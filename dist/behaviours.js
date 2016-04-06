"use strict";
var http_1 = require('./http');
var model_1 = require('./model');
exports.Behaviours = (function () {
    return {
        copyRights: function (params) {
            if (!params.provider.resource.shared) {
                return;
            }
            http_1.http().get('/' + infraPrefix + '/public/json/sharing-rights.json').done(function (config) {
                http_1.http().get('/' + params.provider.application + '/rights/sharing').done(function (providerSharing) {
                    http_1.http().get('/' + params.target.application + '/rights/sharing').done(function (targetSharing) {
                        params.provider.resource.shared.forEach(function (share) {
                            if (share.userId === model_1.model.me.userId) {
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
                            if (model_1.model.me.groupsIds.indexOf(share.groupId) === -1) {
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
                    });
                });
            }.bind(this));
        },
        register: function (application, appBehaviours) {
            this.applicationsBehaviours[application] = {};
            this.applicationsBehaviours[application] = appBehaviours;
        },
        findRights: function (serviceName, resource) {
            if (this.applicationsBehaviours[serviceName]) {
                if (!resource.myRights) {
                    resource.myRights = {};
                }
                if (typeof this.applicationsBehaviours[serviceName].resource === 'function') {
                    console.log('resource method in behaviours is deprecated, please use rights object or rename to resourceRights');
                    this.applicationsBehaviours[serviceName].resourceRights = this.applicationsBehaviours[serviceName].resource;
                }
                if (typeof this.applicationsBehaviours[serviceName].resourceRights !== 'function' && typeof this.applicationsBehaviours[serviceName].rights === 'object') {
                    var resourceRights = this.applicationsBehaviours[serviceName].rights.resource;
                    this.applicationsBehaviours[serviceName].resourceRights = function (element) {
                        for (var behaviour in resourceRights) {
                            if (model_1.model.me && (model_1.model.me.hasRight(element, resourceRights[behaviour]) ||
                                (element.owner && (model_1.model.me.userId === element.owner.userId || model_1.model.me.userId === element.owner)))) {
                                element.myRights[behaviour] = resourceRights[behaviour];
                            }
                        }
                    };
                }
                if (typeof this.applicationsBehaviours[serviceName].resourceRights === 'function') {
                    return this.applicationsBehaviours[serviceName].resourceRights(resource);
                }
                else {
                    return {};
                }
            }
            /*if(serviceName !== '.'){
                loader.syncLoadFile('/' + serviceName + '/public/js/behaviours.js');
                if(this.applicationsBehaviours[serviceName] && typeof this.applicationsBehaviours[serviceName].resource === 'function'){
                    return this.applicationsBehaviours[serviceName].resourceRights(resource);
                }
                else{
                    this.applicationsBehaviours[serviceName] = {};
                    return this.applicationsBehaviours[serviceName];
                }
            }*/
            return {};
        },
        findBehaviours: function (serviceName, resource) {
            console.log('Deprecated, please use findRights');
            this.findRights(serviceName, resource);
        },
        loadBehaviours: function (serviceName, callback) {
            var actions = {
                error: function (cb) {
                    err = cb;
                }
            };
            var err = undefined;
            if (this.applicationsBehaviours[serviceName]) {
                callback(this.applicationsBehaviours[serviceName]);
                return actions;
            }
            if (serviceName === '.') {
                return actions;
            }
            /*loader.openFile({
                url: '/' + serviceName + '/public/js/behaviours.js',
                success: function(){
                    callback(this.applicationsBehaviours[serviceName])
                }.bind(this),
                error: function(){
                    if(typeof err === 'function'){
                        err();
                    }
                }
            });*/
            return actions;
        },
        findWorkflow: function (serviceName) {
            var returnWorkflows = function () {
                if (!this.applicationsBehaviours[serviceName]) {
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
            if (this.applicationsBehaviours[serviceName]) {
                return returnWorkflows();
            }
            /*if(window.loader){
                require('/' + serviceName + '/public/js/behaviours.js');
                return returnWorkflows();
            }*/
        },
        workflowsFrom: function (obj, dependencies) {
            if (typeof obj !== 'object') {
                return {};
            }
            if (typeof dependencies !== 'object') {
                dependencies = {};
            }
            var workflow = {};
            for (var prop in obj) {
                if (model_1.model.me.hasWorkflow(obj[prop])) {
                    workflow[prop] = true;
                    if (typeof dependencies[prop] === 'string') {
                        workflow[prop] = workflow[prop] && model_1.model.me.hasWorkflow(dependencies[prop]);
                    }
                }
            }
            return workflow;
        },
        applicationsBehaviours: {}
    };
}());
