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

const getItemValue = function (list, filter, join) {
    if (!_.isArray(list)) {
        list = [list];
    }
    if (!_.isUndefined(filter)) {
        list = _.filter(list, filter);
    }
    if (_.isUndefined(join)) {
        join = '';
    }
    return _.map(list, function (item) {
        return _.get(item, 'value', '');
    }).join(join);
};

const renderGameData = function (game) {
    const gameId = game.originalId;
    const url = `https://boardgamegeek.com/boardgame/${gameId}/`;

    // console.log('Requesting ' + url);

    return new Promise(function (resolve) {
        bggClient('thing', {id: gameId, stats: 1}).then(function (results) {
            const gameDetails = _.get(results, 'items.item');

            // console.log(gameDetails);

            if (!_.isUndefined(gameDetails)) {
                let name = _.get(gameDetails, 'name', []);
                let designers = _.get(gameDetails, 'link', []);
                let rank = _.get(gameDetails, 'statistics.ratings.ranks.rank', []);
                let average = _.get(gameDetails, 'statistics.ratings.average.value', '');
                let weight = _.get(gameDetails, 'statistics.ratings.averageweight.value', '');
                const year = _.get(gameDetails, 'yearpublished.value', '');
                const minPlayers = _.get(gameDetails, 'minplayers.value', '');
                const maxPlayers = _.get(gameDetails, 'maxplayers.value', '');
                const playingTime = _.get(gameDetails, 'playingtime.value', '');
                const cover = _.get(gameDetails, 'thumbnail', '//i.imgur.com/zBdJWnB.pngm');
                const description = _.get(gameDetails, 'description', '');

                name = getItemValue(name, function (name) {
                    return _.get(name, 'type', '') === 'primary';
                });

                designers = getItemValue(designers, function (link) {
                    return _.get(link, 'type', '') === 'boardgamedesigner';
                }, ', ');

                rank = getItemValue(rank, function (ranking) {
                    return _.get(ranking, 'name', '') === 'boardgame';
                });

                if (_.isNumber(average)) {
                    average = average.toFixed(1);
                }

                if (_.isNumber(weight)) {
                    weight = weight.toFixed(2);
                }

                resolve({
                    id: gameId,
                    cover: `http:${cover}`,
                    description: description,
                    content: `*${name}*
Designer(s): ${designers}
Rank: ${rank}
Average rating: ${average}
Weight: ${weight}
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

// COMMANDS ///////////////////////////////////////////////////////////////////

const helpText =
        'This bot is intended to be used in inline mode, just type ' +
        '@the_bgg_bot and a board game name in any chat.';

bot.onText(/\/start.*/, function (msg) {
    bot.sendMessage(msg.from.id, helpText);
});

bot.onText(/\/help.*/, function (msg) {
    bot.sendMessage(msg.from.id, helpText);
});

// INLINE MODE ////////////////////////////////////////////////////////////////

bot.on('inline_query', function (request) {
    const inlineId = request.id;

    // console.log(`Querying ${request.query}`);

    if (request.query.trim().length === 0) {
        bot.answerInlineQuery(inlineId, []);
    }

    bggClient('search', {
        query: request.query.trim(),
        type: 'boardgame,boardgameexpansion'
        // exact: 1
    }).then(function (results) {
        results = _.get(results, 'items.item');

        if (!_.isUndefined(results)) {
            // console.log(`Got ${results.length} results`);

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
            }), 0, settings.maxResults);

            // console.log(`Ketp ${games.length} results`);

            Promise.all(_.map(games, renderGameData)).then(function (results) {
                const gameDetails = _.reject(results, function (result) {
                    return _.isString(result);
                });

                // console.log(`Got ${gameDetails.length} game details`);

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
                    details.cover = details.cover.replace('http:https', 'https');
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
