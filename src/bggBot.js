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

    return new Promise(function (resolve) {
        bggClient.gameDetails(gameId).then(function (results) {
            if (_.isArray(results)) {
                const gameDetails = _.head(results);
                const name = _.get(gameDetails, 'name[0].$.value');
                let rank = _.get(gameDetails, 'statistics[0].ratings[0].ranks[0].rank', []);
                const year = _.get(gameDetails, 'yearpublished[0].$.value', '');
                const minPlayers = _.get(gameDetails, 'minplayers[0].$.value', '');
                const maxPlayers = _.get(gameDetails, 'maxplayers[0].$.value', '');
                const playingTime = _.get(gameDetails, 'playingtime[0].$.value', '');
                const cover = _.get(gameDetails, 'thumbnail[0]', '//i.imgur.com/zBdJWnB.pngm');
                const description = _.get(gameDetails, 'description[0]', '');

                rank = _.find(rank, function (ranking) {
                    return _.get(ranking, '$.name', '') === 'boardgame';
                });
                if (_.isUndefined(rank)) {
                    rank = '';
                } else {
                    rank = _.get(rank, '$.value', '');
                }

                resolve({
                    id: gameId,
                    cover: `http:${cover}`,
                    description: description,
                    content: `*${name}*
Rank: ${rank}
Published in: ${year}
Players: ${minPlayers} - ${maxPlayers}
Playing time: ${playingTime}

[Open in BGG](${url})`
                });
            } else if (_.isUndefined(results)) {
                resolve('No results');
            } else {
                resolve('No response');
            }
        }).catch(function (error) {
            resolve(`ERROR: ${error}`);
        });
    });
};

const logErrors = function (query, id, error) {
    console.error(`Inline Query: ${query}`);
    console.error(error);
    bot.answerInlineQuery(id, []);
};

// INLINE MODE ////////////////////////////////////////////////////////////////

bot.on('inline_query', function (request) {
    const id = request.id;

    // console.log(`Querying ${request.query}`);

    bggClient.search(request.query).then(function (results) {
        if (_.isArray(results)) {
            // console.log(`Got ${results.length} results`);

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

            Promise.all(_.map(games, renderGameData)).then(function (results) {
                const gameDetails = _.reject(results, function (result) {
                    return _.isString(result);
                });

                games = _.map(games, function (game) {
                    const details = _.find(gameDetails, function (details) {
                        return details.id === game.originalId;
                    });
                    if (_.isUndefined(details)) {
                        return null;
                    }

                    game.input_message_content = {
                        message_text: details.content,
                        parse_mode: 'Markdown',
                        disable_web_page_preview: false
                    };
                    game.thumb_url = details.cover;
                    game.description = _.truncate(details.description, {
                        length: 100
                    });
                    return game;
                });
                games = _.reject(games, function (game) {
                    return _.isNull(game);
                });

                bot.answerInlineQuery(id, games);
            });
        } else {
            logErrors(request.query, id, results);
        }
    }).catch(function (error) {
        logErrors(request.query, id, error);
    });
});

module.exports = bot;
