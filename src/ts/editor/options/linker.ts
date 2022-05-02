import { Behaviours } from "../../behaviours";
import { idiom } from "../../idiom";
import { $ } from '../../libs/jquery/jquery';
import { ui } from "../../ui";
import { http } from "../../http";
import { _ } from '../../libs/underscore/underscore';
import { model } from "../../modelDefinitions";
import { appPrefix } from "../../globals";
import { editorEvents, LinkerEventBody } from "../../editor";

interface EditorInstance{
    selection: any
    focus():void
    trigger(event:string):void
    compile(html:string):(scope:any)=>void
    bindContextualMenu(scope:any, tag:string, menu:Array<{label:string, action:(e:any)=>void}>):void
}

type Resource = { _id?: string, title?: string, path?: string }
type App = { address?: string, icon?: string }
export interface LinkerScope {
    linker: {
        externalLink?: boolean | string
        display: {
            searching?: boolean
            chooseLink?: boolean
            search?: {
                application: App,
                text: string
            }
        },
        apps: App[],
        search: {
            application: App,
            text: string
        },
        params: {
            id?: string
            appPrefix?: string;
            link?: string
            blank?: boolean
            target?: string
            tooltip?: string
        },
        resource: Resource,
        resources?: Resource[]
        cancel?: () => void
        saveLink?: () => void;
        addResource?: () => any;
        createResource?: () => void;
        applyLink?: (link: string) => void
        searchApplication?: (onFinish?: () => void) => void
        applyResource?: (resource: any) => void;
        loadApplicationResources?: (onFinish?: () => void) => void
        openLinker?: (appPrefix: string, address: string, element?: Node) => void
    }
    $apply: any;
}
export const linker = {
    name: 'linker',
    run: function(instance:EditorInstance){
        return {
            template: '<i ng-click="linker.openLinker()" tooltip="editor.option.link"></i>' +
                '<div ng-include="\'/infra/public/template/linker.html\'"></div>',
            link: function (scope: LinkerScope, element, attributes) {
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
                    if (!element) {
                        instance.selection.range = window.getSelection().getRangeAt(0);
                    }
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
                        const behaviour = Behaviours.applicationsBehaviours[prefix];
                        scope.linker.addResource = behaviour.create;
                        if(behaviour.loadResourcesWithFilter){
                            cb();
                        }else{
                            const result = behaviour.loadResources(() => cb());
                            if(result && result.then){
                                result.then(() => {
                                    cb();
                                });
                            }
                        }
                    });
                };
                const debounce = (callback, wait) => {
                    let timeout = null
                    return (...args) => {
                        const next = () => callback(...args)
                        clearTimeout(timeout)
                        timeout = setTimeout(next, wait)
                    }
                }
                const searchDebounced = debounce((appBehaviour, cb)=>{
                    scope.linker.display.searching = true;
                    scope.$apply('linker');
                    appBehaviour.loadResourcesWithFilter(scope.linker.search.text, (r)=>{
                        scope.linker.resources = r;
                        scope.linker.display.searching = false;
                        scope.$apply('linker');
                        cb && cb();
                    })
                }, 400)
                scope.linker.searchApplication = function(cb){
                    var split = scope.linker.search.application.address.split('/');
                    var prefix = split[split.length - 1];
                    scope.linker.params.appPrefix = prefix;
                    Behaviours.loadBehaviours(scope.linker.params.appPrefix, function(appBehaviour){
                        if(appBehaviour.loadResourcesWithFilter){
                            if(scope.linker.search.text){
                                searchDebounced(appBehaviour, cb)
                            }
                        }else{
                            scope.linker.resources = _.filter(appBehaviour.resources, function(resource) {
                                return scope.linker.search.text !== '' && (idiom.removeAccents(resource.title.toLowerCase()).indexOf(idiom.removeAccents(scope.linker.search.text).toLowerCase()) !== -1 ||
                                    resource._id === scope.linker.search.text);
                            });
                            if(typeof cb === 'function'){
                                cb();
                            }
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
                        let matcher = new RegExp('^www');
                        let linkToCheck = scope.linker.params.link.match(matcher);
                        let protocolToAdd = 'https://';
                        if(linkToCheck === null) {
                            linkNode.attr('href', scope.linker.params.link);
                        } else if(linkToCheck[0] == 'www') {
                            let finalUrl = protocolToAdd.concat(scope.linker.params.link.toString());
                            linkNode.attr('href', finalUrl);
                        }

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
                            var reg = /[<]/gi;
                            scope.linker.params.tooltip = scope.linker.params.tooltip.replace(reg, "&lt;");
                            reg = /[>]/gi;
                            scope.linker.params.tooltip = scope.linker.params.tooltip.replace(reg, "&gt;");
                            linkNode.attr('tooltip', scope.linker.params.tooltip);
                        }
                        else if(linkNode.attr('tooltip')){
                            linkNode.removeAttr('tooltip');
                            linkNode.off('mouseover');
                        }
                        editorEvents.onLinkerAdd.next({
                            externalLink: scope.linker.externalLink,
                            ...scope.linker.params
                        } as LinkerEventBody)
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
                    if (e.selection.range) {
                        var currentNode = e.selection.range.startContainer;
                        if (currentNode.nodeType !== 1) {
                            currentNode = currentNode.parentNode;
                        }
                        if (currentNode.nodeName === 'A') {
                            element.removeClass('disabled');
                        } else {
                            element.addClass('disabled');
                        }
                    }
                });
            }
        };
    }
};
