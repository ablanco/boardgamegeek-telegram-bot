// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

// const http = require('http');
//
// const hostname = '127.0.0.1';
// const port = 3000;
//
// const server = http.createServer(function (req, res) {
//     'use strict';
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end('Hello World\n');
// });
//
// server.listen(port, hostname, function () {
//     'use strict';
//     console.log(`Server running at http://${hostname}:${port}/`);
// });

const TelegramBot = require('node-telegram-bot-api');

const settings = require('./settings.js');

const bggAPI = 'https://www.boardgamegeek.com/xmlapi2/';

const bot = new TelegramBot(settings.token, {polling: true});

// Any kind of message
bot.on('message', function (msg) {
    'use strict';
    const fromId = msg.from.id;

    bot.sendMessage(fromId, 'hello world');
});

// https://www.boardgamegeek.com/xmlapi2/search?query=euphrat
// https://www.boardgamegeek.com/xmlapi2/thing/?id=42&type=boardgame

module.exports = bot;
