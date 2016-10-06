// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

const TelegramBot = require('node-telegram-bot-api');

const bggClient = require('./bggClient.js');
const settings = require('./settings.js');


const bot = new TelegramBot(settings.token, {polling: true});

// Any kind of message
bot.onText(/(.+)/, function (msg) {
    'use strict';
    const fromId = msg.from.id;

    bggClient.search(msg.text, function (response) {
        // if (response.hasOwnProperty('forEach')) {
        response.forEach(function (game) {
            // {"$":{"type":"boardgame","id":"140934"},
            // "name":[{"$":{"type":"primary","value":"Arboretum"}}],
            // "yearpublished":[{"$":{"value":"2015"}}]}
            const name = game.name[0]['$'].value;
            const year = game.yearpublished[0]['$'].value;

            bot.sendMessage(fromId, `${name} (${year})`);
        });
        // } else {
            // bot.sendMessage(fromId, response);
        // }
    });
});

module.exports = bot;
