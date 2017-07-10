"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("./http");
var ui_1 = require("./ui");
var modelDefinitions_1 = require("./modelDefinitions");
var underscore_1 = require("./libs/underscore/underscore");
exports.skin = {
    addDirectives: undefined,
    templateMapping: {},
    skin: 'raw',
    theme: '/assets/themes/raw/default/',
    portalTemplate: '/assets/themes/raw/portal.html',
    basePath: '',
    logoutCallback: '/',
    loadDisconnected: function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var rand = Math.random();
                        http_1.http().get('/skin', { token: rand }).done(function (data) {
                            _this.skin = data.skin;
                            _this.theme = '/assets/themes/' + data.skin + '/skins/default/';
                            _this.basePath = _this.theme + '../../';
                            http_1.http().get('/assets/themes/' + data.skin + '/template/override.json', { token: rand }, { disableNotifications: true }).done(function (override) {
                                _this.templateMapping = override;
                                resolve();
                            })
                                .e404(function () { return resolve(); });
                        }).e404(function () { });
                    })];
            });
        });
    },
    listThemes: function (cb) {
        http_1.http().get('/themes').done(function (themes) {
            if (typeof cb === 'function') {
                cb(themes);
            }
        });
    },
    setTheme: function (theme) {
        ui_1.ui.setStyle(theme.path);
        http_1.http().get('/userbook/api/edit-userbook-info?prop=theme&value=' + theme._id);
    },
    loadBookmarks: function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        http_1.http().get('/userbook/preference/apps').done(function (data) {
                            if (!data.preference) {
                                data.preference = null;
                            }
                            modelDefinitions_1.model.me.bookmarkedApps = JSON.parse(data.preference) || [];
                            var upToDate = true;
                            var remove = [];
                            modelDefinitions_1.model.me.bookmarkedApps.forEach(function (app, index) {
                                var foundApp = underscore_1._.findWhere(modelDefinitions_1.model.me.apps, { name: app.name });
                                var updateApp = true;
                                if (foundApp) {
                                    updateApp = JSON.stringify(foundApp) !== JSON.stringify(app);
                                    if (updateApp) {
                                        for (var property in foundApp) {
                                            app[property] = foundApp[property];
                                        }
                                    }
                                }
                                else {
                                    remove.push(app);
                                }
                                upToDate = upToDate && !updateApp;
                            });
                            remove.forEach(function (app) {
                                var index = modelDefinitions_1.model.me.bookmarkedApps.indexOf(app);
                                modelDefinitions_1.model.me.bookmarkedApps.splice(index, 1);
                            });
                            if (!upToDate) {
                                http_1.http().putJson('/userbook/preference/apps', modelDefinitions_1.model.me.bookmarkedApps);
                            }
                            resolve();
                        });
                    })];
            });
        });
    },
    loadConnected: function () {
        return __awaiter(this, void 0, void 0, function () {
            var rand, that;
            return __generator(this, function (_a) {
                rand = Math.random();
                that = this;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        http_1.http().get('/theme').done(function (data) {
                            that.theme = data.skin;
                            that.basePath = that.theme + '../../';
                            that.skin = that.theme.split('/assets/themes/')[1].split('/')[0];
                            that.portalTemplate = '/assets/themes/' + that.skin + '/portal.html';
                            that.logoutCallback = data.logoutCallback;
                            http_1.http().get('/assets/themes/' + that.skin + '/template/override.json', { token: rand }).done(function (override) {
                                that.templateMapping = override;
                                resolve();
                            })
                                .e404(function () {
                                resolve();
                            });
                        });
                    })];
            });
        });
    }
};
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.skin = exports.skin;
//# sourceMappingURL=skin.js.map