// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

'use strict';

const settings = require('./settings.js');

const TelegramBot = require('node-telegram-bot-api');

const bggClient = require('bgg')(settings.bggClient);
const _ = require('lodash');
const uuid = require('node-uuid');

// TELEGRAM BOT ///////////////////////////////////////////////////////////////

const bot = new TelegramBot(settings.token, {polling: true});

// UTILS //////////////////////////////////////////////////////////////////////

const renderGameData = function (game) {
    const gameId = game.originalId;
    const url = `https://boardgamegeek.com/boardgame/${gameId}/`;

    // console.log('Requesting ' + url);

    return new Promise(function (resolve) {
        bggClient('thing', {id: gameId, stats: 1}).then(function (results) {
            const gameDetails = _.get(results, 'items.item');

            if (!_.isUndefined(gameDetails)) {
                const name = _.get(gameDetails, 'name.value');
                let rank = _.get(gameDetails, 'statistics.ratings.ranks.rank', []);
                const year = _.get(gameDetails, 'yearpublished.value', '');
                const minPlayers = _.get(gameDetails, 'minplayers.value', '');
                const maxPlayers = _.get(gameDetails, 'maxplayers.value', '');
                const playingTime = _.get(gameDetails, 'playingtime.value', '');
                const cover = _.get(gameDetails, 'thumbnail', '//i.imgur.com/zBdJWnB.pngm');
                const description = _.get(gameDetails, 'description', '');

                if (!_.isArray(rank)) {
                    rank = [rank];
                }
                rank = _.find(rank, function (ranking) {
                    return _.get(ranking, 'name', '') === 'boardgame';
                });
                if (_.isUndefined(rank)) {
                    rank = '';
                } else {
                    rank = _.get(rank, 'value', '');
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
            } else {
                resolve('No results');
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
    const inlineId = request.id;

    console.log(`Querying ${request.query}`);

    bggClient('search', {
        query: request.query,
        type: 'boardgame,boardgameexpansion'
    }).then(function (results) {
        results = _.get(results, 'items.item');

        if (!_.isUndefined(results)) {
            console.log(`Got ${results.length} results`);

            let games = _.map(results, function (game) {
                const gameId = _.get(game, 'id', null);

                if (_.isNull(gameId)) {
                    return null;
                }

                const name = _.get(game, 'name.value', 'Unknown');
                const year = _.get(game, 'yearpublished.value');
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

                console.log(`Got ${gameDetails.length} game details`);

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

                bot.answerInlineQuery(inlineId, games);
            });
        } else {
            logErrors(request.query, inlineId, 'No results');
        }
    }).catch(function (error) {
        logErrors(request.query, inlineId, error);
    });
});

module.exports = bot;
