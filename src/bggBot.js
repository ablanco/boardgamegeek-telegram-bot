// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

'use strict';

const TelegramBot = require('node-telegram-bot-api');

const _ = require('lodash');

const bggClient = require('./bggClient.js');
const settings = require('./settings.js');


const bot = new TelegramBot(settings.token, {polling: true});

// Any kind of message
bot.onText(/\/search\ (.+)/, function (msg, match) {
    const fromId = msg.from.id;

    bggClient.search(match[1], function (response) {
        if (_.isArray(response)) {
            const text = _.map(response, function (game) {
                const name = _.get(game, 'name[0].$.value', 'Unknown');
                const year = _.get(game, 'yearpublished[0].$.value');
                if (!_.isUndefined(year)) {
                    return `${name} (${year})`;
                }
                return name;
            }).join('\n');
            bot.sendMessage(fromId, text);
        } else if (_.isUndefined(response)) {
            bot.sendMessage(fromId, 'No results');
        } else {
            bot.sendMessage(fromId, `Error: ${response}`);
        }
    });
});

module.exports = bot;
