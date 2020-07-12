const AuthProvider = require('./provider');

class StaticProvider extends AuthProvider {

    constructor(app, opts, name) {
        super(app, opts, name);
        this.users = opts.users;
        this.perms = opts.perms;
    }

    validate(username, password) {
        if (this.users[username] == password) {
            return username;
        }

        return false;
    }

    permission(username, permissions) {
        for (let permission of permissions) {
            if (!this.permissions[permission].includes(username)) {
                return false;
            }
        }

        return true;
    }

}

module.exports = StaticProvider;