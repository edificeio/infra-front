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
var entcore_1 = require("./entcore");
var waitingFor = {};
var Rights = (function () {
    function Rights(resource) {
        this.resource = resource;
        this.myRights = {};
    }
    Rights.prototype.isOwner = function () {
        return this.resource.owner.userId === entcore_1.model.me.userId;
    };
    Rights.prototype.fromBehaviours = function (prefix) {
        var _this = this;
        if (!prefix) {
            prefix = entcore_1.appPrefix;
        }
        return new Promise(function (resolve, reject) {
            if (entcore_1.Behaviours.applicationsBehaviours[prefix] && !entcore_1.Behaviours.applicationsBehaviours[prefix].callbacks) {
                _this.fromObject(entcore_1.Behaviours.applicationsBehaviours[prefix].rights, prefix).then(function (result) {
                    resolve(result);
                });
            }
            else {
                if (waitingFor[prefix]) {
                    waitingFor[prefix].push(function () { return resolve(_this.fromObject(entcore_1.Behaviours.applicationsBehaviours[prefix].rights, prefix)); });
                }
                else {
                    waitingFor[prefix] = [];
                    entcore_1.Behaviours.loadBehaviours(prefix, function () {
                        _this.fromObject(entcore_1.Behaviours.applicationsBehaviours[prefix].rights, prefix).then(function (result) {
                            resolve(result);
                            waitingFor[prefix].forEach(function (f) { return f(); });
                            delete waitingFor[prefix];
                        });
                    });
                }
            }
        });
    };
    Rights.prototype.fromObject = function (obj, prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var resourceRights = obj.resource;
                        var computeRights = function () {
                            for (var behaviour in resourceRights) {
                                if (entcore_1.model.me && (entcore_1.model.me.hasRight(_this.resource, resourceRights[behaviour]) ||
                                    (_this.resource.owner && (entcore_1.model.me.userId === _this.resource.owner.userId)))) {
                                    _this.myRights[behaviour] = true;
                                }
                            }
                        };
                        if (entcore_1.model.me) {
                            computeRights();
                            resolve();
                            return;
                        }
                        if (entcore_1.model.bootstrapped && !entcore_1.model.me) {
                            resolve();
                            return;
                        }
                        entcore_1.model.one('bootstrap', function () {
                            computeRights();
                            resolve();
                        });
                    })];
            });
        });
    };
    return Rights;
}());
exports.Rights = Rights;
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.Rights = Rights;
//# sourceMappingURL=rights.js.map