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
var globals_1 = require("./globals");
var http_1 = require("./http");
var modelDefinitions_1 = require("./modelDefinitions");
exports.Behaviours = (function () {
    return {
        storedRights: {},
        sharingRights: function () {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this.storedRights['json']) {
                    resolve(_this.storedRights['json']);
                }
                http_1.http().get('/' + globals_1.infraPrefix + '/public/json/sharing-rights.json').done(function (config) {
                    _this.storedRights['json'] = config;
                    resolve(config);
                });
            });
        },
        appSharingRights: function (prefix) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this.storedRights[prefix]) {
                    resolve(_this.storedRights[prefix]);
                }
                http_1.http().get('/' + prefix + '/rights/sharing').done(function (config) {
                    _this.storedRights[prefix] = config;
                    resolve(config);
                });
            });
        },
        copyRights: function (params) {
            return __awaiter(this, void 0, void 0, function () {
                var config, providerSharing, targetSharing;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!params.provider.resource.shared) {
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.sharingRights()];
                        case 1:
                            config = _a.sent();
                            return [4 /*yield*/, this.appSharingRights(params.provider.application)];
                        case 2:
                            providerSharing = _a.sent();
                            return [4 /*yield*/, this.appSharingRights(params.target.application)];
                        case 3:
                            targetSharing = _a.sent();
                            params.provider.resource.shared.forEach(function (share) {
                                if (share.userId === modelDefinitions_1.model.me.userId) {
                                    return;
                                }
                                var data = {};
                                if (share.groupId) {
                                    data.groupId = share.groupId;
                                }
                                else {
                                    data.userId = share.userId;
                                }
                                var bundles = { read: false, contrib: false, publish: false, comment: false, manager: false };
                                for (var property in share) {
                                    for (var bundle in providerSharing) {
                                        if (providerSharing[bundle].indexOf(property) !== -1) {
                                            var bundleSplit = bundle.split('.');
                                            bundles[bundleSplit[bundleSplit.length - 1]] = true;
                                            config[bundleSplit[bundleSplit.length - 1]].requires.forEach(function (required) {
                                                bundles[required] = true;
                                            });
                                        }
                                    }
                                }
                                function addRights(targetResource) {
                                    data.actions = [];
                                    for (var bundle in bundles) {
                                        if (!bundles[bundle]) {
                                            continue;
                                        }
                                        for (var targetBundle in targetSharing) {
                                            var targetBundleSplit = targetBundle.split('.');
                                            if (targetBundleSplit[targetBundleSplit.length - 1].indexOf(bundle) !== -1) {
                                                targetSharing[targetBundle].forEach(function (right) {
                                                    data.actions.push(right);
                                                });
                                            }
                                        }
                                    }
                                    http_1.http().put('/' + params.target.application + '/share/json/' + targetResource, http_1.http().serialize(data)).e401(function () { });
                                }
                                //drop rights if I'm not part of the group
                                if (modelDefinitions_1.model.me.groupsIds.indexOf(share.groupId) === -1) {
                                    params.target.resources.forEach(function (targetResource) {
                                        http_1.http().put('/' + params.target.application + '/share/remove/' + targetResource, data).done(function () {
                                            addRights(targetResource);
                                        }).e401(function () { });
                                    });
                                }
                                else {
                                    params.target.resources.forEach(addRights);
                                }
                            });
                            return [2 /*return*/];
                    }
                });
            });
        },
        register: function (application, appBehaviours) {
            this.applicationsBehaviours[application] = {};
            this.applicationsBehaviours[application] = appBehaviours;
        },
        findRights: function (serviceName, resource) {
            var _this = this;
            var resolveRights = function () {
                var serviceBehaviours = exports.Behaviours.applicationsBehaviours[serviceName];
                if (typeof serviceBehaviours.resource === 'function') {
                    console.log('resource method in behaviours is deprecated, please use rights object or rename to resourceRights');
                    serviceBehaviours.resourceRights = serviceBehaviours.resource;
                }
                if (typeof serviceBehaviours.resourceRights !== 'function' && typeof serviceBehaviours.rights === 'object') {
                    var resourceRights = serviceBehaviours.rights.resource;
                    serviceBehaviours.resourceRights = function (element) {
                        for (var behaviour in resourceRights) {
                            if (modelDefinitions_1.model.me && (modelDefinitions_1.model.me.hasRight(element, resourceRights[behaviour]) ||
                                (element.owner && (modelDefinitions_1.model.me.userId === element.owner.userId || modelDefinitions_1.model.me.userId === element.owner)))) {
                                element.myRights[behaviour] = resourceRights[behaviour];
                            }
                        }
                    };
                }
                if (typeof serviceBehaviours.resourceRights === 'function') {
                    return serviceBehaviours.resourceRights(resource);
                }
                else {
                    return {};
                }
            };
            return new Promise(function (resolve, reject) {
                if (_this.applicationsBehaviours[serviceName]) {
                    if (!resource.myRights) {
                        resource.myRights = {};
                    }
                    resolve(resolveRights());
                    return;
                }
                exports.Behaviours.loadBehaviours(serviceName, function () {
                    resolveRights();
                })
                    .error(function () {
                    resolveRights();
                });
            });
        },
        findBehaviours: function (serviceName, resource) {
            console.log('Deprecated, please use findRights');
            this.findRights(serviceName, resource);
        },
        loadBehaviours: function (serviceName, callback) {
            var err = { cb: undefined };
            var actions = {
                error: function (cb) {
                    err.cb = cb;
                }
            };
            if (this.applicationsBehaviours[serviceName]) {
                if (this.applicationsBehaviours[serviceName].callbacks) {
                    this.applicationsBehaviours[serviceName].callbacks.push(callback);
                    this.applicationsBehaviours[serviceName].errors.push(err);
                    return actions;
                }
                callback(this.applicationsBehaviours[serviceName]);
                return actions;
            }
            else {
                this.applicationsBehaviours[serviceName] = {
                    callbacks: [callback],
                    errors: [err]
                };
            }
            if (serviceName === '.') {
                return actions;
            }
            var callbacks = exports.Behaviours.applicationsBehaviours[serviceName].callbacks;
            var errors = exports.Behaviours.applicationsBehaviours[serviceName].errors;
            http_1.http().get('/' + serviceName + '/public/js/behaviours.js').done(function (content) {
                callbacks.forEach(function (cb) {
                    cb(exports.Behaviours.applicationsBehaviours[serviceName]);
                });
            })
                .error(function () {
                errors.forEach(function (err) {
                    if (typeof err.cb === 'function') {
                        err.cb();
                    }
                });
            });
            return actions;
        },
        load: function (serviceName) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                exports.Behaviours.loadBehaviours(serviceName, function () {
                    resolve(_this.applicationsBehaviours[serviceName]);
                })
                    .error(function () {
                    reject();
                });
            });
        },
        findWorkflow: function (serviceName) {
            var returnWorkflows = function () {
                if (!this.applicationsBehaviours[serviceName]) {
                    console.log('Behaviours from ' + serviceName + ' not found.');
                    return {};
                }
                if (typeof this.applicationsBehaviours[serviceName].workflow === 'function') {
                    return this.applicationsBehaviours[serviceName].workflow();
                }
                else {
                    if (typeof this.applicationsBehaviours[serviceName].rights === 'object' && this.applicationsBehaviours[serviceName].rights.workflow) {
                        if (!this.applicationsBehaviours[serviceName].dependencies) {
                            this.applicationsBehaviours[serviceName].dependencies = {};
                        }
                        return this.workflowsFrom(this.applicationsBehaviours[serviceName].rights.workflow, this.applicationsBehaviours[serviceName].dependencies.workflow);
                    }
                }
            }.bind(this);
            if (this.applicationsBehaviours[serviceName] && !this.applicationsBehaviours[serviceName].callbacks) {
                return returnWorkflows();
            }
            return new Promise(function (resolve, reject) {
                exports.Behaviours.loadBehaviours(serviceName, function () {
                    resolve(returnWorkflows());
                })
                    .error(function () {
                    reject();
                });
            });
        },
        workflowsFrom: function (obj, dependencies) {
            if (typeof obj !== 'object') {
                console.log('Empty workflows');
                return {};
            }
            if (typeof dependencies !== 'object') {
                dependencies = {};
            }
            var workflow = {};
            for (var prop in obj) {
                if (modelDefinitions_1.model.me.hasWorkflow(obj[prop])) {
                    workflow[prop] = true;
                    if (typeof dependencies[prop] === 'string') {
                        workflow[prop] = workflow[prop] && modelDefinitions_1.model.me.hasWorkflow(dependencies[prop]);
                    }
                }
            }
            return workflow;
        },
        applicationsBehaviours: {}
    };
}());
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.Behaviours = exports.Behaviours;
window.Behaviours = exports.Behaviours;
//# sourceMappingURL=behaviours.js.map