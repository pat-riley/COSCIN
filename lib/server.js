const config = require('./setup/config');
const debug = require('debug')('server-connect:server');
const routes = require('./setup/routes');
const sockets = require('./setup/sockets');
const upload = require('./setup/upload');
const cron = require('./setup/cron');
const http = require('http');
const express = require('express');
const endmw = require('express-end');
const cookieParser = require('cookie-parser');
const session = require('express-session')(Object.assign({ secret: config.secret }, config.session));
const app = express();

app.use(express.static('public', config.static));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(config.secret));
app.use(session);
app.use(endmw);

if (config.compression) {
    const compression = require('compression');
    app.use(compression());
}

app.set('trust proxy', true);
app.set('view engine', 'ejs');
app.set('view options', { root: 'views', async: true });

upload(app);
routes(app);

const server = http.createServer(app);
const io = config.enableSockets ? sockets(server, session) : null;

module.exports = {
    server, app, io,
    start: function(port) {
        // We add the 404 and 500 routes as last
        app.use((req, res) => {
            res.status(404).json({
                status: '404',
                message: `${req.url} not found.`
            });
        });
        
        app.use((err, req, res, next) => {
            debug(`Got error? %O`, err);
            res.status(500).json({
                status: '500',
                code: config.debug ? err.code : undefined,
                message: config.debug ? err.message || err : 'A server error occured, to see the error enable the DEBUG flag.',
                stack: config.debug ? err.stack : undefined,
            });
        });
        
        if (config.enableCron) {
            cron.start();
        }

        server.listen(port || config.port, () => {
            console.log(`App listening at http://localhost:${config.port}`);
        });
    }
};
