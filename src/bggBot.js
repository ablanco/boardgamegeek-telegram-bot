// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

'use strict';

const TelegramBot = require('node-telegram-bot-api');

const _ = require('lodash');

const bggClient = require('./bggClient.js');
const settings = require('./settings.js');


const bot = new TelegramBot(settings.token, {polling: true});

bot.onText(/\/search\ (.+)/, function (msg, match) {
    const fromId = msg.from.id;

    bggClient.search(match[1], function (response) {
        if (_.isArray(response)) {
            const text = _.map(response, function (game) {
                const name = _.get(game, 'name[0].$.value', 'Unknown');
                const year = _.get(game, 'yearpublished[0].$.value');
                const id = _.get(game, '$.id');
                if (!_.isUndefined(year)) {
                    return `${name} (${year}) - ${id}`;
                }
                return `${name} - ${id}`;
            }).join('\n');
            bot.sendMessage(fromId, text);
        } else if (_.isUndefined(response)) {
            bot.sendMessage(fromId, 'No results');
        } else {
            bot.sendMessage(fromId, `Error: ${response}`);
        }
    });
});

bot.onText(/\/game\ (.+)/, function (msg, match) {
    const fromId = msg.from.id;

    bggClient.gameDetails(match[1]).then(function (results) {
        const game = _.head(results);
        const name = _.get(game, 'name[0].$.value');
        const description = _.get(game, 'description[0]', '');

        bot.sendMessage(fromId, `${name}\n${description}`);
    }).catch(function (error) {
        bot.sendMessage(fromId, `Error: ${error}`);
    });
});

module.exports = bot;
