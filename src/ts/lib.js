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
var behaviours_1 = require("./behaviours");
var calendar_1 = require("./calendar");
var globals_1 = require("./globals");
var modelDefinitions_1 = require("./modelDefinitions");
var skin_1 = require("./skin");
var _ = require('underscore');
var moment = require('moment');
(function () {
    function pluralizeName(obj) {
        var name = (obj.name || obj._name);
        if (!name) {
            name = obj.toString().split('function')[1].split('(')[0].trim();
        }
        if (name[name.length - 1] === 'y' && name[name.length - 2] !== 'a' && name[name.length - 2] !== 'e') {
            return name[0].toLowerCase() + name.substr(1, name.length - 2) + 'ies';
        }
        return name[0].toLowerCase() + name.substr(1) + 's';
    }
    modelDefinitions_1.Collection.prototype = {
        reject: undefined,
        obj: undefined,
        callbacks: {},
        sync: undefined,
        all: [],
        composer: undefined,
        map: undefined,
        find: undefined,
        filter: undefined,
        findWhere: undefined,
        where: undefined,
        on: function (eventName, cb) {
            if (typeof cb !== 'function') {
                return;
            }
            if (!this.callbacks[eventName]) {
                this.callbacks[eventName] = [];
            }
            this.callbacks[eventName].push(cb);
        },
        trigger: function (event) {
            if (this.composer && this.composer.trigger) {
                this.composer.trigger(pluralizeName(this.obj) + '.' + event);
            }
            if (!this.callbacks) {
                this.callbacks = {};
            }
            var col = this;
            if (this.callbacks[event] instanceof Array) {
                this.callbacks[event].forEach(function (cb) {
                    if (typeof cb === 'function') {
                        cb.call(col);
                    }
                });
            }
        },
        unbind: function (event, cb) {
            var events = event.split(',');
            var that = this;
            events.forEach(function (e) {
                var eventName = e.trim();
                if (!that.callbacks) {
                    that.callbacks = {};
                }
                if (!that.callbacks[eventName]) {
                    that.callbacks[eventName] = [];
                }
                if (!cb) {
                    that.callbacks[eventName].pop();
                }
                else {
                    that.callbacks[eventName] = _.without(that.callbacks[eventName], _.find(that.callbacks[eventName], function (item) {
                        return item.toString() === cb.toString();
                    }));
                }
            }.bind(this));
        },
        one: function (event, cb) {
            var that = this;
            var uniqueRun = function () {
                that.unbind(event, uniqueRun);
                if (typeof cb === 'function') {
                    cb();
                }
            };
            this.on(event, uniqueRun);
        },
        forEach: function (cb) {
            this.all.forEach(cb);
        },
        first: function () {
            return this.all[0];
        },
        select: function (predicate) {
            _.filter(this.all, predicate).forEach(function (item) {
                item.selected = true;
            });
        },
        deselect: function (predicate) {
            _.filter(this.all, predicate).forEach(function (item) {
                item.selected = false;
            });
        },
        selectAll: function () {
            this.all.forEach(function (item) {
                item.selected = true;
            });
        },
        deselectAll: function () {
            this.all.forEach(function (item) {
                item.selected = false;
            });
        },
        concat: function (col) {
            return this.all.concat(col.all);
        },
        closeAll: function () {
            this.all.forEach(function (item) {
                if (item.opened) {
                    item.opened = false;
                }
            });
        },
        current: null,
        setCurrent: function (item) {
            this.current = item;
            this.trigger('change');
        },
        slice: function (a, b) {
            return this.all.slice(a, b);
        },
        push: function (element, notify) {
            var newItem = element;
            if (this.obj === undefined) {
                this.obj = modelDefinitions_1.Model;
            }
            if (!(newItem instanceof this.obj)) {
                newItem = new this.obj(element);
            }
            if (this.behaviours) {
                newItem.behaviours(this.behaviours);
            }
            else {
                newItem.behaviours(globals_1.appPrefix);
            }
            this.all.push(newItem);
            newItem.on('change', function () {
                this.trigger('change');
            }.bind(this));
            if (notify === false) {
                return;
            }
            this.trigger('change');
            this.trigger('push');
        },
        remove: function (item, trigger) {
            this.all = _.reject(this.all, function (element) {
                return item === element;
            });
            if (trigger !== false) {
                this.trigger('remove');
                this.trigger('change');
            }
        },
        removeAt: function (index) {
            var element = this.all[index];
            this.remove(element);
        },
        insertAt: function (index, item) {
            this.all.splice(index, 0, item);
            this.trigger('push');
            this.trigger('change');
        },
        moveUp: function (item) {
            var itemIndex = this.getIndex(item);
            var swap = this.all[itemIndex - 1];
            this.all[itemIndex - 1] = item;
            this.all[itemIndex] = swap;
            this.trigger('change');
        },
        moveDown: function (item) {
            var itemIndex = this.getIndex(item);
            var swap = this.all[itemIndex + 1];
            this.all[itemIndex + 1] = item;
            this.all[itemIndex] = swap;
            this.trigger('change');
        },
        getIndex: function (item) {
            for (var i = 0; i < this.all.length; i++) {
                if (this.all[i] === item) {
                    return i;
                }
            }
        },
        splice: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            this.all.splice.apply(this.all, args);
            if (arguments.length > 2) {
                this.trigger('push');
            }
            if (arguments[1] > 0) {
                this.trigger('remove');
            }
            this.trigger('change');
        },
        selectItem: function (item) {
            item.selected = true;
            this.trigger('change');
        },
        selection: function () {
            //returning the new array systematically breaks the watcher
            //due to the reference always being updated
            var currentSelection = _.where(this.all, { selected: true }) || [];
            if (!this._selection || this._selection.length !== currentSelection.length) {
                this._selection = currentSelection;
            }
            return this._selection;
        },
        removeSelection: function () {
            if (this.obj.prototype.api) {
                this.selection().forEach(function (item) {
                    item.remove();
                });
            }
            this.all = _.reject(this.all, function (item) { return item.selected; });
        },
        addRange: function (data, cb, notify) {
            var that = this;
            data.forEach(function (item) {
                if (!(newObj instanceof that.obj)) {
                    var newObj = modelDefinitions_1.Model.create(that.obj, item);
                }
                that.push(newObj, false);
                if (typeof cb === 'function') {
                    cb(newObj);
                }
            });
            if (notify === false) {
                return;
            }
            this.model.trigger(pluralizeName(this.obj) + '.change');
            this.trigger('change');
            this.trigger('push');
        },
        load: function (data, cb, notify) {
            this.all.splice(0, this.all.length);
            this.addRange(data, cb, notify);
            this.trigger('sync');
        },
        empty: function () {
            return this.all.length === 0;
        },
        length: function () {
            return this.all.length;
        },
        request: function (method, path, cb) {
            var col = this;
            this.selection().forEach(function (item) {
                http_1.http()[method](http_1.http().parseUrl(path, item), {}).done(function (data) {
                    if (typeof cb === 'function') {
                        cb(data);
                    }
                });
            });
        },
        toJSON: function () {
            return this.all;
        },
        contains: function (obj) {
            return this.all.indexOf(obj) !== -1;
        },
        last: function () {
            return this.all[this.all.length - 1];
        },
        removeAll: function () {
            this.all = [];
        }
    };
    for (var property in _) {
        (function () {
            if (_.hasOwnProperty(property) && typeof _[property] === 'function') {
                var func = property;
                modelDefinitions_1.Collection.prototype[func] = function (arg) {
                    return _[func](this.all, arg);
                };
            }
        }());
    }
    modelDefinitions_1.Model.prototype.models = [];
    modelDefinitions_1.Model.prototype.sync = function () {
        http_1.http().get(http_1.http().parseUrl(this.api.get, this)).done(function (data) {
            this.updateData(data);
        }.bind(this));
    };
    modelDefinitions_1.Model.prototype.saveModifications = function () {
        http_1.http().putJson(http_1.http().parseUrl(this.api.put, this), this);
    };
    modelDefinitions_1.Model.prototype.remove = function () {
        http_1.http().delete(http_1.http().parseUrl(this.api.delete, this));
    };
    modelDefinitions_1.Model.prototype.create = function () {
        http_1.http().postJson(http_1.http().parseUrl(this.api.post, this), this).done(function (data) {
            this.updateData(data);
        }.bind(this));
    };
    modelDefinitions_1.Model.prototype.makeModel = function (fn, methods, namespace) {
        if (typeof fn !== 'function') {
            throw new TypeError('Only functions can be models');
        }
        if (!namespace) {
            namespace = window;
        }
        // this cryptic code is meant to :
        // 1. make the instances of the constructor answer true to both instanceof ctr and instanceof Model
        // 2. force ctr to run Model constructor before itself
        // 3. apply name prop, which misses in IE (even modern versions)
        // 4. extend fn prototype with whatever functions the user sent
        if (fn.name === undefined) {
            // grabs function name from function string
            fn.name = fn._name || fn.toString().match(/^function\s*([^\s(]+)/)[1];
        }
        // overwrites user ctr with a version calling parent ctr
        // fn is passed as parameter to keep its written behaviour
        var ctr = new Function("fn", "return function " + (fn.name || fn._name) + "(data){ Model.call(this, data); fn.call(this, data); }")(fn);
        ctr.prototype = Object.create(modelDefinitions_1.Model.prototype);
        if (ctr.name === undefined) {
            ctr.name = fn.name;
        }
        for (var method in methods) {
            ctr.prototype[method] = methods[method];
        }
        if (fn.prototype.api) {
            if (fn.prototype.api.get) {
                fn.prototype.sync = function () {
                    http_1.http().get(http_1.http().parseUrl(this.api.get, this)).done(function (data) {
                        this.updateData(data);
                    }.bind(this));
                };
            }
            if (fn.prototype.api.put) {
                fn.prototype.saveModifications = function () {
                    http_1.http().putJson(http_1.http().parseUrl(this.api.put, this), this);
                };
            }
            if (fn.prototype.api.delete) {
                fn.prototype.remove = function () {
                    http_1.http().delete(http_1.http().parseUrl(this.api.delete, this));
                };
            }
            if (fn.prototype.api.post) {
                fn.prototype.create = function () {
                    http_1.http().postJson(http_1.http().parseUrl(this.api.post, this), this).done(function (data) {
                        this.updateData(data);
                    }.bind(this));
                };
            }
            if (fn.prototype.api.post && fn.prototype.api.put && typeof fn.prototype.save !== 'function') {
                fn.prototype.save = function () {
                    if (this._id || this.id) {
                        this.saveModifications();
                    }
                    else {
                        this.create();
                    }
                };
            }
        }
        for (var prop in fn.prototype) {
            ctr.prototype[prop] = fn.prototype[prop];
        }
        // overwrites fn with custom ctr
        namespace[(ctr.name || ctr._name)] = ctr;
        modelDefinitions_1.Model.prototype.models.push(ctr);
    };
    modelDefinitions_1.Model.prototype.makeModels = function (constructors) {
        if (!(constructors instanceof Array)) {
            for (var ctr in constructors) {
                if (constructors.hasOwnProperty(ctr)) {
                    if (ctr[0] === ctr.toUpperCase()[0]) {
                        constructors[ctr]._name = ctr;
                        this.makeModel(constructors[ctr], {}, constructors);
                    }
                }
            }
        }
        else {
            constructors.forEach(function (item) {
                this.makeModel(item);
            }.bind(this));
        }
    };
    modelDefinitions_1.Model.prototype.collection = function (obj, methods) {
        var col = new modelDefinitions_1.Collection(obj);
        col.composer = this;
        this[pluralizeName(obj)] = col;
        for (var method in methods) {
            if (method === 'sync' && typeof methods[method] === 'string') {
                (function () {
                    var path = methods[method];
                    col[method] = function () {
                        http_1.http().get(http_1.http().parseUrl(path, this.composer)).done(function (data) {
                            this.load(data);
                        }.bind(this));
                    };
                }());
            }
            else {
                col[method] = methods[method];
            }
        }
        col.model = this;
        return col;
    };
    modelDefinitions_1.Model.prototype.toJSON = function () {
        var dup = {};
        for (var prop in this) {
            if (this.hasOwnProperty(prop) && prop !== 'callbacks' && prop !== 'data' && prop !== '$$hashKey') {
                dup[prop] = this[prop];
            }
        }
        return dup;
    };
    modelDefinitions_1.Model.prototype.sync = function () {
        for (var col in this) {
            if (this[col] instanceof modelDefinitions_1.Collection) {
                this[col].sync();
            }
        }
    };
    modelDefinitions_1.Model.prototype.updateData = function (newData, triggerEvent) {
        this.data = newData;
        if (typeof newData !== 'object') {
            return this;
        }
        for (var property in newData) {
            if (newData.hasOwnProperty(property) && !(this[property] instanceof modelDefinitions_1.Collection)) {
                this[property] = newData[property];
            }
            if (newData.hasOwnProperty(property) && this[property] instanceof modelDefinitions_1.Collection) {
                this[property].load(newData[property]);
            }
        }
        if (triggerEvent !== false) {
            this.trigger('change');
        }
    };
    modelDefinitions_1.Model.create = function (func, data) {
        var newItem = new func(data);
        newItem.data = data;
        if (typeof data !== 'object') {
            return newItem;
        }
        for (var property in data) {
            if (data.hasOwnProperty(property) && !newItem.hasOwnProperty(property)) {
                newItem[property] = data[property];
            }
        }
        return newItem;
    };
    modelDefinitions_1.Model.prototype.on = function (event, cb) {
        if (typeof cb !== 'function') {
            return;
        }
        var events = event.split(',');
        var that = this;
        events.forEach(function (e) {
            var eventName = e.trim();
            if (!that.callbacks) {
                that.callbacks = {};
            }
            if (!that.callbacks[eventName]) {
                that.callbacks[eventName] = [];
            }
            that.callbacks[eventName].push(cb);
            var propertiesChain = eventName.split('.');
            if (propertiesChain.length > 1) {
                var prop = propertiesChain[0];
                propertiesChain.splice(0, 1);
                if (!this[prop] || !this[prop].on) {
                    throw "Property " + prop + " is undefined in " + eventName;
                }
                this[prop].on(propertiesChain.join('.'), cb);
            }
        }.bind(this));
    };
    modelDefinitions_1.Model.prototype.unbind = function (event, cb) {
        var events = event.split(',');
        var that = this;
        events.forEach(function (e) {
            var eventName = e.trim();
            if (!that.callbacks) {
                that.callbacks = {};
            }
            if (!that.callbacks[eventName]) {
                that.callbacks[eventName] = [];
            }
            if (!cb) {
                that.callbacks[eventName].pop();
            }
            else {
                that.callbacks[eventName] = _.without(that.callbacks[eventName], _.find(that.callbacks[eventName], function (item) {
                    return item.toString() === cb.toString();
                }));
            }
            var propertiesChain = eventName.split('.');
            if (propertiesChain.length > 1) {
                var prop = propertiesChain[0];
                propertiesChain.splice(0, 1);
                if (!this[prop] || !this[prop].on) {
                    throw "Property " + prop + " is undefined in " + eventName;
                }
                this[prop].unbind(propertiesChain.join('.'));
            }
        }.bind(this));
    };
    modelDefinitions_1.Model.prototype.one = function (event, cb) {
        var that = this;
        var uniqueRun = function () {
            that.unbind(event, uniqueRun);
            if (typeof cb === 'function') {
                cb();
            }
        };
        this.on(event, uniqueRun);
    };
    modelDefinitions_1.Model.prototype.trigger = function (event, eventData) {
        if (!this.callbacks || !this.callbacks[event]) {
            return;
        }
        for (var i = 0; i < this.callbacks[event].length; i++) {
            if (typeof this.callbacks[event][i] === 'function') {
                this.callbacks[event][i].call(this, eventData);
            }
        }
    };
    modelDefinitions_1.Model.prototype.behaviours = function (serviceName) {
        if (this.shared || this.owner) {
            return behaviours_1.Behaviours.findRights(serviceName, this);
        }
        return {};
    };
    modelDefinitions_1.Model.prototype.inherits = function (targetFunction, prototypeFunction) {
        var targetProps = {};
        for (var property in targetFunction.prototype) {
            if (targetFunction.prototype.hasOwnProperty(property)) {
                targetProps[property] = targetFunction.prototype[property];
            }
        }
        targetFunction.prototype = new prototypeFunction();
        for (var property in targetProps) {
            targetFunction.prototype[property] = targetProps[property];
        }
    };
}());
function bootstrap(func) {
    var _this = this;
    if (globals_1.currentLanguage === 'fr') {
        moment.locale(globals_1.currentLanguage);
        moment.updateLocale(globals_1.currentLanguage, {
            calendar: {
                lastDay: '[Hier à] HH[h]mm',
                sameDay: '[Aujourd\'hui à] HH[h]mm',
                nextDay: '[Demain à] HH[h]mm',
                lastWeek: 'dddd [dernier à] HH[h]mm',
                nextWeek: 'dddd [prochain à] HH[h]mm',
                sameElse: 'dddd LL'
            }
        });
    }
    else {
        moment.locale(globals_1.currentLanguage);
    }
    if (window.notLoggedIn) {
        behaviours_1.Behaviours.loadBehaviours(globals_1.appPrefix, function () {
            skin_1.skin.loadDisconnected();
            func();
        })
            .error(function () {
            skin_1.skin.loadDisconnected();
            func();
        });
        return;
    }
    http_1.http().get('/auth/oauth2/userinfo').done(function (data) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, skin_1.skin.loadConnected()];
                case 1:
                    _a.sent();
                    modelDefinitions_1.model.me = data;
                    modelDefinitions_1.model.me.preferences = {
                        save: function (pref, data) {
                            if (data !== undefined) {
                                this[pref] = data;
                            }
                            modelDefinitions_1.model.trigger('preferences-updated');
                        }
                    };
                    modelDefinitions_1.model.trigger('preferences-updated');
                    modelDefinitions_1.model.me.hasWorkflow = function (workflow) {
                        return _.find(modelDefinitions_1.model.me.authorizedActions, function (workflowRight) {
                            return workflowRight.name === workflow;
                        }) !== undefined || workflow === undefined;
                    };
                    modelDefinitions_1.model.me.hasRight = function (resource, right) {
                        if (right === 'owner') {
                            return resource.owner && resource.owner.userId === modelDefinitions_1.model.me.userId;
                        }
                        var rightName = right.right || right;
                        var currentSharedRights = _.filter(resource.shared, function (sharedRight) {
                            return modelDefinitions_1.model.me.groupsIds.indexOf(sharedRight.groupId) !== -1
                                || sharedRight.userId === modelDefinitions_1.model.me.userId;
                        });
                        var resourceRight = _.find(currentSharedRights, function (resourceRight) {
                            return resourceRight[rightName] || resourceRight.manager;
                        }) !== undefined;
                        var workflowRight = true;
                        if (right.workflow) {
                            workflowRight = this.hasWorkflow(right.workflow);
                        }
                        return resourceRight && workflowRight;
                    };
                    modelDefinitions_1.model.me.workflow = {
                        load: function (services) {
                            return __awaiter(this, void 0, void 0, function () {
                                var _i, services_1, service, workflows, e_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _i = 0, services_1 = services;
                                            _a.label = 1;
                                        case 1:
                                            if (!(_i < services_1.length)) return [3 /*break*/, 6];
                                            service = services_1[_i];
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, 4, , 5]);
                                            return [4 /*yield*/, behaviours_1.Behaviours.findWorkflow(service)];
                                        case 3:
                                            workflows = _a.sent();
                                            console.log('Workflows loaded from ' + service);
                                            console.log(workflows);
                                            this[service] = workflows;
                                            return [3 /*break*/, 5];
                                        case 4:
                                            e_1 = _a.sent();
                                            console.log(service + " doesn't have a behaviours file.");
                                            return [3 /*break*/, 5];
                                        case 5:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 6: return [2 /*return*/];
                                    }
                                });
                            });
                        }
                    };
                    if (!(globals_1.appPrefix !== '.')) return [3 /*break*/, 3];
                    return [4 /*yield*/, modelDefinitions_1.model.me.workflow.load(['workspace', globals_1.appPrefix])];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, modelDefinitions_1.model.me.workflow.load(['workspace'])];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    modelDefinitions_1.model.trigger('me.change');
                    calendar_1.calendar.init();
                    return [4 /*yield*/, skin_1.skin.loadBookmarks()];
                case 6:
                    _a.sent();
                    func();
                    return [2 /*return*/];
            }
        });
    }); })
        .e404(function () {
        func();
    });
}
exports.bootstrap = bootstrap;
//# sourceMappingURL=lib.js.map