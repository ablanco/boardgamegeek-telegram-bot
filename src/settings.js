// Copyright (c) 2016 Alejandro Blanco <alejandro.b.e@gmail.com>
// MIT License

const settings = {
    token: process.env.BGG_TELEGRAM_BOT_TOKEN,

    maxResults: 10, // 50 is the maximum allowed by Telegram

    bggClient: {
        authorizationKey: "", // https://boardgamegeek.com/using_the_xml_api#toc10
    },
};

module.exports = settings;
