import { Behaviours } from "../../behaviours";
import { idiom } from "../../idiom";
import { $ } from '../../libs/jquery/jquery';
import { ui } from "../../ui";
import { http } from "../../http";
import { _ } from '../../libs/underscore/underscore';
import { model } from "../../modelDefinitions";
import { appPrefix } from "../../globals";

export const linker = {
    name: 'linker',
    run: function(instance){
        return {
            template: '<i ng-click="linker.openLinker()" tooltip="editor.option.link"></i>' +
            '<div ng-include="\'/infra/public/template/linker.html\'"></div>',
            link: function (scope, element, attributes) {
                ui.extendSelector.touchEvents('[contenteditable] a');
                scope.linker = {
                    display: {},
                    apps: [],
                    search: {
                        application: {},
                        text: ''
                    },
                    params: {},
                    resource: {}
                };

                instance.bindContextualMenu(scope, 'a', [
                    {
                        label: 'editor.edit.link',
                        action: function (e) {
                            instance.selection.selectNode(e.target);
                            scope.linker.display.chooseLink = true;
                            scope.linker.openLinker($(e.target).data('app-prefix'), $(e.target).attr('href'), e.target);
                        }

                    },
                    {
                        label: 'editor.remove.link',
                        action: function (e) {
                            var content = document.createTextNode($(e.target).text());
                            e.target.parentNode.insertBefore(content, e.target);
                            $(e.target).remove();
                        }
                    }
                ]);

                scope.linker.openLinker = function (appPrefix, address, element) {
                    var sel = window.getSelection();
                    instance.selection.range = sel.getRangeAt(0);
                    this.rangeCount = 1;
                    scope.linker.display.chooseLink = true;
                    if (appPrefix) {
                        scope.linker.search.application.address = '/' + appPrefix;
                        scope.linker.loadApplicationResources(function () {
                            scope.linker.searchApplication(function () {
                                var resource = _.findWhere(scope.linker.resources, { path: address });
                                scope.linker.applyResource(resource);
                                scope.$apply();
                            });
                        });
                    }
                    else {
                        if (!element && instance.selection.selectedElements.length === 1) {
                            element = instance.selection.selectedElements[0];
                        }
                        if (element) {
                            if (element.nodeType !== 1) {
                                element = element.parentNode;
                            }
                            if (element.nodeName === 'A') {
                                var link = $(element).attr('href');
                                scope.linker.params.blank = $(element).attr('target') === '_blank';
                                scope.linker.params.tooltip = $(element).attr('tooltip') || '';

                                if (link.split('http')[0] === '' && link.split('http').length > 1) {
                                    scope.linker.externalLink = true;
                                    scope.linker.params.link = link;
                                }
                                else {
                                    scope.linker.externalLink = false;
                                    scope.linker.openLinker(link.split('/')[1].split('#')[0], link);
                                }
                            }
                        }
                    }
                };

                scope.linker.loadApplicationResources = function(cb){
                    var split = scope.linker.search.application.address.split('/');
                    var prefix = split[split.length - 1];
                    scope.linker.params.appPrefix = prefix;
                    if(!cb){
                        cb = function(){
                            scope.linker.searchApplication();
                            scope.$apply('linker');
                        };
                    }
                    Behaviours.loadBehaviours(scope.linker.params.appPrefix, function (appBehaviour) {
                        const result = Behaviours.applicationsBehaviours[prefix].loadResources(() => cb(Behaviours.applicationsBehaviours[prefix].resources));
                        if(result && result.then){
                            result.then(() => {
                                cb(Behaviours.applicationsBehaviours[prefix].resources);
                            });
                        }
                        scope.linker.addResource = Behaviours.applicationsBehaviours[prefix].create;
                    });
                };

                scope.linker.searchApplication = function(cb){
                    var split = scope.linker.search.application.address.split('/');
                    var prefix = split[split.length - 1];
                    scope.linker.params.appPrefix = prefix;
                    Behaviours.loadBehaviours(scope.linker.params.appPrefix, function(appBehaviour){
                        scope.linker.resources = _.filter(appBehaviour.resources, function(resource) {
                            return scope.linker.search.text !== '' && (idiom.removeAccents(resource.title.toLowerCase()).indexOf(idiom.removeAccents(scope.linker.search.text).toLowerCase()) !== -1 ||
                                resource._id === scope.linker.search.text);
                        });
                        if(typeof cb === 'function'){
                            cb();
                        }
                    });
                };

                scope.linker.createResource = function(){
                    Behaviours.loadBehaviours(scope.linker.params.appPrefix, function(appBehaviour){
                        appBehaviour.create(scope.linker.resource, function(){
                            scope.linker.search.text = scope.linker.resource.title;
                            
                            scope.linker.searchApplication();
                            scope.$apply();
                        });
                    });
                };

                scope.linker.applyLink = function(link){
                    scope.linker.params.link = link;
                };

                scope.linker.applyResource = function(resource){
                    scope.linker.params.link = resource.path;
                    scope.linker.params.id = resource._id;
                };

                scope.linker.saveLink = function(){
                    if(scope.linker.params.blank){
                        scope.linker.params.target = '_blank';
                    }

                    var linkNode;
                    var selectedNode = instance.selection.range.startContainer;
                    if (selectedNode && selectedNode.nodeType !== 1
                        && selectedNode.parentNode.childNodes.length === 1
                        && instance.selection.range.startOffset === 0
                        && instance.selection.range.endOffset === selectedNode.textContent.length) {
                        selectedNode = selectedNode.parentNode;
                    }
                    if (selectedNode && selectedNode.nodeName === 'A') {
                        linkNode = $(selectedNode);
                    }
                    else {
                        linkNode = $('<a></a>');
                    }

                    if(scope.linker.params.link){
                        linkNode.attr('href', scope.linker.params.link);

                        if (scope.linker.params.appPrefix && !scope.linker.externalLink) {
                            linkNode.attr('data-app-prefix', scope.linker.params.appPrefix);
                            if(scope.linker.params.appPrefix !== 'workspace' && !scope.linker.externalLink){
                                linkNode.data('reload', true);
                            }
                        }
                        if(scope.linker.params.id){
                            linkNode.attr('data-id', scope.linker.params.id);
                        }
                        if(scope.linker.params.blank){
                            scope.linker.params.target = '_blank';
                            linkNode.attr('target', scope.linker.params.target);
                        }
                        if(scope.linker.params.tooltip){
                            linkNode.attr('tooltip', scope.linker.params.tooltip);
                        }
                        else if(linkNode.attr('tooltip')){
                            linkNode.removeAttr('tooltip');
                            linkNode.off('mouseover');
                        }
                    }

                    if (selectedNode && selectedNode.nodeName === 'A') {
                        instance.selection.moveCaret(linkNode[0], linkNode.text().length);
                        instance.trigger('change');
                        scope.linker.display.chooseLink = false;
                        scope.linker.params = {};
                        scope.linker.display.search = {
                            application: {},
                            text: ''
                        };
                        scope.linker.externalLink = false;
                        return;
                    }

                    if (instance.selection.isCursor()) {
                        linkNode.text(scope.linker.params.link);
                        instance.selection.replaceHTMLInline(instance.compile(linkNode[0].outerHTML)(scope));
                    }
                    else {
                        instance.selection.wrapText(linkNode);
                    }

                    instance.focus();
                    scope.linker.display.chooseLink = false;
                    scope.linker.params = {};
                    scope.linker.display.search = {
                        application: {},
                        text: ''
                    };
                    scope.linker.externalLink = false;
                };

                scope.linker.cancel = function(){
                    scope.linker.display.chooseLink = false;
                    scope.linker.params = {};
                    scope.linker.display.search = {
                        application: {},
                        text: ''
                    };
                    scope.linker.externalLink = false;
                };

                http().get('/resources-applications').done(function(apps){
                    scope.linker.apps = _.filter(model.me.apps, function(app){
                        return _.find(
                            apps,
                            function (match) {
                                return app.address.indexOf(match) !== -1 && app.icon && app.address.indexOf('#') === -1
                            }
                        );
                    });

                    scope.linker.apps = _.map(scope.linker.apps, function(app) {
                        app.displayName = idiom.translate(app.displayName);
                        return app;
                    });

                    scope.linker.search.application = _.find(scope.linker.apps, function(app){ return app.address.indexOf(appPrefix) !== -1 });
                    if(!scope.linker.search.application){
                        scope.linker.search.application = scope.linker.apps[0];
                        scope.linker.searchApplication(function(){
                            scope.linker.loadApplicationResources(function(){});
                        })
                    }
                    else{
                        scope.linker.loadApplicationResources(function(){});
                    }

                    scope.$apply('linker');
                });
            }
        }
    }
};

export const unlink = {
    name: 'unlink',
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.unlink"></i>',
            link: function(scope, element, attributes){
                element.addClass('disabled');
                element.on('click', function () {
                    var currentNode = instance.selection.range.startContainer;
                    if (currentNode.nodeType !== 1) {
                        currentNode = currentNode.parentNode;
                    }
                    if (currentNode.nodeName !== 'A') {
                        return;
                    }
                    var content = document.createTextNode($(currentNode).text());
                    currentNode.parentNode.insertBefore(content, currentNode);
                    $(currentNode).remove();
                    element.addClass('disabled');
                });

                instance.on('selectionchange', function (e) {
                    var currentNode = e.selection.range.startContainer;
                    if(currentNode.nodeType !==1){
                        currentNode = currentNode.parentNode;
                    }
                    if (currentNode.nodeName === 'A') {
                        element.removeClass('disabled');
                    }
                    else{
                        element.addClass('disabled');
                    }
                });
            }
        };
    }
};