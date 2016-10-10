// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

const settings = {
    token: 'YOUR_TELEGRAM_BOT_TOKEN',

    maxResults: 10, // 50 is the maximum allowed by Telegram

    bggClient: {
        timeout: 10000, // timeout of 10s (5s is the default)

        // see   https://github.com/cujojs/rest/blob/master/docs/interceptors.md#module-rest/interceptor/retry
        retry: {
            initial: 100,
            multiplier: 2,
            max: 15e3
        }
    }
};

module.exports = settings;
