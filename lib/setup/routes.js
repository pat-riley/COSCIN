const fs = require('fs-extra');
const debug = require('debug')('server-connect:setup:routes');
const config = require('./config');
const { map } = require('../core/async');
const { posix, extname } = require('path');
const { serverConnect, templateView } = require('../core/middleware');

module.exports = async function (app) {
    if (config.createApiRoutes) {
        fs.ensureDirSync('app/api');
        createApiRoutes('app/api');
    }

    if (fs.existsSync('app/config/routes.json')) {
        const { routes, layouts } = fs.readJSONSync('app/config/routes.json');

        parseRoutes(routes, null);

        function parseRoutes(routes, parent) {
            for (let route of routes) {
                if (!route.path) continue;
    
                let { path, method, redirect, url, page, layout, exec, data } = route;
    
                method = method || 'get';
                data = data || {};
                if (page) page = page.replace(/^\//, '');
                if (layout) layout = layout.replace(/^\//, '');
                if (parent && parent.path) path = parent.path + path;
    
                if (redirect) {
                    app.get(path, (req, res) => res.redirect(redirect));
                } else if (url) {
                    app[method](path, (req, res) => {
                        if (parent && parent.url && !req.xhr) {
                            res.sendFile(parent.url, { root: 'public' });
                        } else {
                            res.sendFile(route.url, { root: 'public' });
                        }
                    });
                    
    
                    // Page routes
                    /*
                    if (Array.isArray(route.routes)) {
                        for (let pageRoute of route.routes) {
                            if (!pageRoute.path) continue;
                            app.get(posix.join(path, pageRoute.path), (req, res) => res.sendFile(url, { root: 'public' }));
                        }
                    }
                    */
                } else if (page) {
                    if (exec) {
                        if (fs.existsSync(`app/${exec}.json`)) {
                            let json = fs.readJSONSync(`app/${exec}.json`);
    
                            if (json.exec && json.exec.steps) {
                                json = json.exec.steps;
                            } else if (json.steps) {
                                json = json.steps;
                            } else if (!Array.isArray(json)) {
                                json = [json];
                            }
    
    
                            if (layout && layouts && layouts[layout]) {
                                if (layouts[layout].data) {
                                    data = Object.assign({}, layouts[layout].data, data);
                                }
    
                                if (layouts[layout].exec) {
                                    if (fs.existsSync(`app/${layouts[layout].exec}.json`)) {
                                        let _json = fs.readJSONSync(`app/${layouts[layout].exec}.json`);
    
                                        if (_json.exec && _json.exec.steps) {
                                            _json = _json.exec.steps;
                                        } else if (_json.steps) {
                                            _json = _json.steps;
                                        } else if (!Array.isArray(_json)) {
                                            _json = [_json];
                                        }
    
                                        json = _json.concat(json);
                                    } else {
                                        debug(`Route ${path} skipped, "app/${exec}.json" not found`);
                                        continue;
                                    }
                                }
                            }
    
                            app[method](path, templateView(layout, page, data, json));
                        } else {
                            debug(`Route ${path} skipped, "app/${exec}.json" not found`);
                            continue;
                        }
                    } else {
                        app[method](path, templateView(layout, page, data));
                    }
                } else if (exec) {
                    if (fs.existsSync(`app/${exec}.json`)) {
                        let json = fs.readJSONSync(`app/${exec}.json`);
                        app[method](path, serverConnect(json));
                        continue;
                    }
                }

                if (Array.isArray(route.routes)) {
                    parseRoutes(route.routes, route);
                }
            }
        }
    }

    function createApiRoutes(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
    
        return map(entries, async (entry) => {
            let path = posix.join(dir, entry.name);
    
            if (entry.isFile() && extname(path) == '.json') {
                let json = fs.readJSONSync(path);
                let routePath = path.replace(/^app/i, '').replace(/.json$/, '(.json)?');
                app.all(routePath, serverConnect(json));
                debug(`Api route ${routePath} created`);
            }
    
            if (entry.isDirectory()) {
                return createApiRoutes(path);
            }
        });
    }
};
