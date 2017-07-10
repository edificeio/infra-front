"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var behaviours_1 = require("./behaviours");
var modelDefinitions_1 = require("./modelDefinitions");
var globals_1 = require("./globals");
var http_1 = require("./http");
var idiom_1 = require("./idiom");
var underscore_1 = require("./libs/underscore/underscore");
exports.sniplets = {
    load: function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.sniplets.length) {
                resolve(_this.sniplets);
                return;
            }
            var sniplets = _this;
            http_1.http().get('/resources-applications').done(function (apps) {
                if (modelDefinitions_1.model.me) {
                    apps = modelDefinitions_1.model.me.apps.filter(function (app) {
                        return underscore_1._.find(apps, function (match) {
                            return app.address.indexOf(match) !== -1 && app.icon.indexOf('/') === -1;
                        });
                    });
                    apps.push({
                        displayName: 'directory',
                        address: '/directory'
                    });
                }
                else {
                    apps = [globals_1.appPrefix, 'workspace'];
                }
                var all = apps.length;
                apps.forEach(function (app) {
                    var token = setTimeout(function () {
                        all--;
                        if (all === 0) {
                            resolve();
                        }
                    }, 1000);
                    var appPrefix = app.address ? app.address.split('/')[1] : app;
                    behaviours_1.Behaviours.loadBehaviours(appPrefix, function (behaviours) {
                        if (behaviours.sniplets) {
                            sniplets.sniplets = sniplets.sniplets.concat(underscore_1._.map(behaviours.sniplets, function (sniplet, name) { return { application: appPrefix, template: name, sniplet: sniplet }; }));
                            idiom_1.idiom.addBundle('/' + appPrefix + '/i18n');
                        }
                        all--;
                        clearTimeout(token);
                        if (all === 0) {
                            resolve();
                        }
                    })
                        .error(function () {
                        all--;
                        if (all === 0) {
                            resolve();
                        }
                        clearTimeout(token);
                    });
                });
            });
        });
    },
    sniplets: []
};
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.sniplets = exports.sniplets;
//# sourceMappingURL=sniplets.js.map