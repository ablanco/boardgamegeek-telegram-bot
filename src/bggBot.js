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

// COMMANDS ///////////////////////////////////////////////////////////////////

bot.onText(/\/search\ (.+)/, function (msg, match) {
    const fromId = msg.from.id;

    bggClient.search(match[1]).then(function (results) {
        if (_.isArray(results)) {
            const text = _.map(results, function (game) {
                const name = _.get(game, 'name[0].$.value', 'Unknown');
                const year = _.get(game, 'yearpublished[0].$.value');
                const id = _.get(game, '$.id');
                if (!_.isUndefined(year)) {
                    return `${name} (${year}) - ${id}`;
                }
                return `${name} - ${id}`;
            }).join('\n');
            bot.sendMessage(fromId, text);
        } else if (_.isUndefined(results)) {
            bot.sendMessage(fromId, 'No results');
        } else {
            bot.sendMessage(fromId, 'No response');
        }
    }).catch(function (error) {
        bot.sendMessage(fromId, `Error: ${error}`);
    });
});

bot.onText(/\/game\ (.+)/, function (msg, match) {
    const fromId = msg.from.id;

    bggClient.gameDetails(match[1]).then(function (results) {
        if (_.isArray(results)) {
            const game = _.head(results);
            const name = _.get(game, 'name[0].$.value');
            const description = _.get(game, 'description[0]', '');

            bot.sendMessage(fromId, `${name}\n${description}`);
        } else if (_.isUndefined(results)) {
            bot.sendMessage(fromId, 'No results');
        } else {
            bot.sendMessage(fromId, 'No response');
        }
    }).catch(function (error) {
        bot.sendMessage(fromId, `Error: ${error}`);
    });
});

// INLINE /////////////////////////////////////////////////////////////////////

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
                result.title = name;
                if (!_.isUndefined(year)) {
                    result.title = `${name} (${year})`;
                }
                const url = `https://boardgamegeek.com/boardgame/${gameId}/`;
                result.input_message_content = {
                    message_text: `${url}`,
                    parse_mode: 'Markdown'
                    // disable_web_page_preview: false
                };

                return result;
            });

            games = _.slice(_.reject(games, function (game) {
                return _.isNull(game);
            }), 0, 50);
            bot.answerInlineQuery(id, games);
        } else {
            console.log(`Inline Query: ${request.query}`);
            console.log(results);
            bot.answerInlineQuery(id, []);
        }
    });
});

module.exports = bot;
