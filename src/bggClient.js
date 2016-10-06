// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

const http = require('http');

// https://www.boardgamegeek.com/xmlapi2/search?query=euphrat
// https://www.boardgamegeek.com/xmlapi2/thing/?id=42&type=boardgame

const client = {
    search: function (query, callback) {
        'use strict';

        let data = '';

        const options = {
            hostname: 'www.boardgamegeek.com',
            path: `\/xmlapi2\/search\?query\=${query}`,
            method: 'GET'
        };

        const request = http.request(options, function (response) {
            response.on('data', function (chunk) {
                data = data + chunk;
            });
            response.on('end', function () {
                callback(data);
            });
        });

        request.on('error', function (e) {
            callback(e.mesage);
        });

        request.end();
    }
};

module.exports = client;
