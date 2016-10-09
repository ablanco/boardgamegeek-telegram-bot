// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

'use strict';

const TelegramBot = require('node-telegram-bot-api');

const _ = require('lodash');
const uuid = require('node-uuid');

const bggClient = require('./bggClient.js');
const settings = require('./settings.js');

// TELEGRAM BOT ///////////////////////////////////////////////////////////////

const bot = new TelegramBot(settings.token, {polling: true});

// UTILS //////////////////////////////////////////////////////////////////////

const renderGameData = function (game) {
    const gameId = game.originalId;
    const url = `https://boardgamegeek.com/boardgame/${gameId}/`;

    return new Promise(function (resolve, reject) {
        bggClient.gameDetails(gameId).then(function (results) {
            if (_.isArray(results)) {
                const gameDetails = _.head(results);
                const name = _.get(gameDetails, 'name[0].$.value');
                const year = _.get(gameDetails, 'yearpublished[0].$.value', '');
                const minPlayers = _.get(gameDetails, 'minplayers[0].$.value', '');
                const maxPlayers = _.get(gameDetails, 'maxplayers[0].$.value', '');
                const playingTime = _.get(gameDetails, 'playingtime[0].$.value', '');

                resolve({
                    id: gameId,
                    content: `[${name}](${url})\n\nPublished: ${year}\nMin players: ${minPlayers}\nMax players: ${maxPlayers}\nPlaying time: ${playingTime}`
                });
            } else if (_.isUndefined(results)) {
                reject('No results');
            } else {
                reject('No response');
            }
        }).catch(function (error) {
            reject(error);
        });
    });
};

// INLINE MODE ////////////////////////////////////////////////////////////////

bot.on('inline_query', function (request) {
    const id = request.id;

    bggClient.search(request.query).then(function (results) {
        if (_.isArray(results)) {
            let games = _.map(results, function (game) {
                const gameId = _.get(game, '$.id', null);

                if (_.isNull(gameId)) {
                    return null;
                }

                const name = _.get(game, 'name[0].$.value', 'Unknown');
                const year = _.get(game, 'yearpublished[0].$.value');
                const result = {type: 'article'};

                result.id = uuid.v4();
                result.originalId = gameId;
                result.title = name;
                if (!_.isUndefined(year)) {
                    result.title = `${name} (${year})`;
                }

                return result;
            });

            games = _.slice(_.reject(games, function (game) {
                return _.isNull(game);
            }), 0, 50);

            Promise.all(_.map(games, renderGameData)).then(function (gameDetails) {
                games = _.map(games, function (game) {
                    const content = _.find(gameDetails, function (details) {
                        return details.id === game.originalId;
                    }).content;
                    game.input_message_content = {
                        message_text: content,
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true
                    };
                    return game;
                });
                bot.answerInlineQuery(id, games);
            });
        } else {
            console.log(`Inline Query: ${request.query}`);
            console.log(results);
            bot.answerInlineQuery(id, []);
        }
    });
});

module.exports = bot;
