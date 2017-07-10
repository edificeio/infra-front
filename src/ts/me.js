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
var modelDefinitions_1 = require("./modelDefinitions");
var axios_1 = require("axios");
var entcore_toolkit_1 = require("entcore-toolkit");
var Me = (function () {
    function Me() {
    }
    Object.defineProperty(Me, "session", {
        get: function () {
            return modelDefinitions_1.model.me;
        },
        enumerable: true,
        configurable: true
    });
    Me.savePreference = function (app) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, axios_1.default.put('/userbook/preference/' + app, this.preferences[app])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Me.preference = function (app) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.preferences) {
                    this.preferences = {};
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.preferences[app] && _this.loading.indexOf(app) === -1) {
                            _this.loading.push(app);
                            _this.eventer.once(app + '-loaded', function () { return resolve(_this.preferences[app]); });
                            axios_1.default.get('/userbook/preference/' + app).then(function (response) {
                                var data = {};
                                if (response.data.preference) {
                                    try {
                                        data = JSON.parse(response.data.preference);
                                    }
                                    catch (e) {
                                        data = {};
                                    }
                                }
                                if (!data) {
                                    data = {};
                                }
                                _this.preferences[app] = data;
                                _this.eventer.trigger(app + '-loaded', _this.preferences[app]);
                            });
                        }
                        else if (!_this.preferences[app]) {
                            _this.eventer.once(app + '-loaded', function () { return resolve(_this.preferences[app]); });
                        }
                        else {
                            resolve(_this.preferences[app]);
                        }
                    })];
            });
        });
    };
    Me.loading = [];
    Me.eventer = new entcore_toolkit_1.Eventer();
    return Me;
}());
exports.Me = Me;
//# sourceMappingURL=me.js.map