// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer(function (req, res) {
    'use strict';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
});

server.listen(port, hostname, function () {
    'use strict';
    console.log(`Server running at http://${hostname}:${port}/`);
});
