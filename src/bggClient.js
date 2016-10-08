// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

'use strict';

const http = require('http');

const parse = require('xml2js').parseString;

const client = {};

// UTILS //////////////////////////////////////////////////////////////////////

client.makeRequest = function (options) {
    return new Promise(function (resolve, reject) {
        let data = '';

        const request = http.request(options, function (response) {
            response.on('data', function (chunk) {
                data = data + chunk;
            });
            response.on('end', function () {
                resolve(data);
            });
        });

        request.on('error', function (e) {
            reject(e.mesage);
        });

        request.end();
    });
};

client.parseXML = function (text) {
    return new Promise(function (resolve, reject) {
        parse(text, function (e, result) {
            if (e === null) {
                resolve(result);
            } else {
                reject(e);
            }
        });
    });
};

// METHODS ////////////////////////////////////////////////////////////////////

client.search = function (query, callback) {
    query = query.replace(/\s/, '+');

    const options = {
        hostname: 'www.boardgamegeek.com',
        path: `\/xmlapi2\/search\?query\=${query}&type=boardgame,boardgameexpansion`,
        method: 'GET'
    };

    client.makeRequest(options).then(function (xml) {
        client.parseXML(xml).then(function (data) {
            callback(data.items.item);
        }).catch(function (error) {
            callback(error);
        });
    }).catch(function (error) {
        callback(error);
    });
};

module.exports = client;
