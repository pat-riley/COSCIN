const package = require('../../package.json');
const fs = require('fs-extra');
const debug = require('debug')('server-connect:setup:config');
const { toSystemPath } = require('../core/path');

const config = {
    port: process.env.PORT || 3000,
    debug: false,
    secret: 'Need to be set',
    tmpFolder: '/tmp',
    createApiRoutes: true,
    enableCron: false,
    enableSockets: false,
    compression: true,
    static: {
        index: false
    },
    session: {
        name: package.name + '.sid',
        resave: false,
        saveUninitialized: false
    },
    mail: {},
    auth: {},
    db: {}
};

if (fs.existsSync('app/config/config.json')) {
    Object.assign(config, fs.readJSONSync('app/config/config.json'));
}

if (fs.existsSync('app/config/mail.json')) {
    config.mail = fs.readJSONSync('app/config/mail.json');
}

if (fs.existsSync('app/config/auth.json')) {
    config.auth = fs.readJSONSync('app/config/auth.json');
}

if (fs.existsSync('app/config/db.json')) {
    config.db = fs.readJSONSync('app/config/db.json');
}

// folders are site relative
config.tmpFolder = toSystemPath(config.tmpFolder);

if (config.debug) {
    require('debug').enable(typeof config.debug == 'string' ? config.debug : 'server-connect:*');
}

debug(config);

module.exports = config;