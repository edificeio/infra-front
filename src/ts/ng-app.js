"use strict";
// Copyright © WebServices pour l'Éducation, 2014
//
// This file is part of ENT Core. ENT Core is a versatile ENT engine based on the JVM.
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation (version 3 of the License).
//
// For the sake of explanation, any module that communicate over native
// Web protocols, such as HTTP, with ENT Core is outside the scope of this
// license and could be license under its own terms. This is merely considered
// normal use of ENT Core, and does not fall under the heading of "covered work".
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
Object.defineProperty(exports, "__esModule", { value: true });
var jquery_1 = require("./libs/jquery/jquery");
var idiom_1 = require("./idiom");
var http_1 = require("./http");
var modelDefinitions_1 = require("./modelDefinitions");
var lib_1 = require("./lib");
var ui_1 = require("./ui");
var behaviours_1 = require("./behaviours");
var globals_1 = require("./globals");
var template_1 = require("./template");
var moment_1 = require("./libs/moment/moment");
var underscore_1 = require("./libs/underscore/underscore");
var angular_1 = require("./libs/angular/angular");
var entcore_1 = require("./entcore");
var ng_start_1 = require("./ng-start");
var directives = require("./directives");
var module = angular_1.angular.module('app', ['ngSanitize', 'ngRoute'], ['$interpolateProvider', function ($interpolateProvider) {
        $interpolateProvider.startSymbol('[[');
        $interpolateProvider.endSymbol(']]');
    }])
    .factory('route', ['$rootScope', '$route', '$routeParams', function ($rootScope, $route, $routeParams) {
        var routes = {};
        var currentAction = undefined;
        var currentParams = undefined;
        $rootScope.$on("$routeChangeSuccess", function ($currentRoute, $previousRoute) {
            if (routes[$route.current.action] instanceof Array &&
                (currentAction !== $route.current.action || (currentParams !== $route.current.params && !(Object.getOwnPropertyNames($route.current.params).length === 0)))) {
                currentAction = $route.current.action;
                currentParams = $route.current.params;
                routes[$route.current.action].forEach(function (r) { return r($routeParams); });
                setTimeout(function () {
                    ui_1.ui.scrollToId(window.location.hash.split('#')[1]);
                }, 100);
            }
        });
        return function (setRoutes) {
            for (var prop in setRoutes) {
                if (!routes[prop]) {
                    routes[prop] = [];
                }
                routes[prop].push(setRoutes[prop]);
            }
        };
    }])
    .factory('model', ['$timeout', function ($timeout) {
        var fa = modelDefinitions_1.Collection.prototype.trigger;
        modelDefinitions_1.Collection.prototype.trigger = function (event) {
            $timeout(function () {
                fa.call(this, event);
            }.bind(this), 10);
        };
        var fn = modelDefinitions_1.Model.prototype.trigger;
        modelDefinitions_1.Model.prototype.trigger = function (event, eventData) {
            $timeout(function () {
                fn.call(this, event, eventData);
            }.bind(this), 10);
        };
        return modelDefinitions_1.model;
    }])
    .factory('xmlHelper', function () {
    return {
        xmlToJson: function (xml, accumulator, stripNamespaces, flatten) {
            var nodeName;
            var that = this;
            if (!accumulator)
                accumulator = {};
            if (!stripNamespaces)
                stripNamespaces = true;
            if (flatten == null)
                flatten = true;
            if (stripNamespaces && xml.nodeName.indexOf(":") > -1) {
                nodeName = xml.nodeName.split(':')[1];
            }
            else {
                nodeName = xml.nodeName;
            }
            if (jquery_1.$(xml).children().length > 0) {
                if (!flatten)
                    accumulator[nodeName] = [];
                else
                    accumulator[nodeName] = {};
                underscore_1._.each(jquery_1.$(xml).children(), function (child) {
                    if (!flatten)
                        accumulator[nodeName].push(that.xmlToJson(child, {}, stripNamespaces, flatten));
                    else
                        return that.xmlToJson(child, accumulator[nodeName], stripNamespaces, flatten);
                });
            }
            else {
                accumulator[nodeName] = jquery_1.$(xml).text();
            }
            return accumulator;
        }
    };
})
    .factory('httpWrapper', function () {
    return {
        wrap: function (name, fun, context) {
            var scope = this;
            if (typeof fun !== "function")
                return;
            if (typeof scope[name] !== "object")
                scope[name] = {};
            if (scope[name].loading)
                return;
            scope[name].loading = true;
            var args = [];
            for (var i = 3; i < arguments.length; i++)
                args.push(arguments[i]);
            var completion = function () {
                scope[name].loading = false;
                scope.$apply();
            };
            var xhrReq;
            if (context) {
                xhrReq = fun.apply(context, args);
            }
            else {
                xhrReq = fun.apply(scope, args);
            }
            if (xhrReq && xhrReq.xhr)
                xhrReq.xhr.complete(completion);
            else
                completion();
        }
    };
});
//routing
if (globals_1.routes.routing) {
    module.config(['$routeProvider', globals_1.routes.routing]);
}
for (var directive in directives) {
    ng_start_1.ng.directives.push(directives[directive]);
}
//directives
module.directive('completeChange', function () {
    return {
        restrict: 'A',
        scope: {
            exec: '&completeChange',
            field: '=ngModel'
        },
        link: function (scope, element, attributes) {
            scope.$watch('field', function (newVal) {
                element.val(newVal);
                if (element[0].type === 'textarea' && element.hasClass('inline-editing')) {
                    setTimeout(function () {
                        element.height(1);
                        element.height(element[0].scrollHeight - 1);
                    }, 100);
                }
            });
            element.bind('change', function () {
                scope.field = element.val();
                if (!scope.$$phase) {
                    scope.$apply('field');
                }
                scope.$parent.$eval(scope.exec);
                if (!scope.$$phase) {
                    scope.$apply('field');
                }
            });
        }
    };
});
module.directive('mediaLibrary', function () {
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            ngChange: '&',
            multiple: '=',
            fileFormat: '='
        },
        templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/media-library.html',
        link: function (scope, element, attributes) {
            scope.$watch(function () {
                return scope.$parent.$eval(attributes.visibility);
            }, function (newVal) {
                scope.visibility = newVal;
                if (!scope.visibility) {
                    scope.visibility = 'protected';
                }
                scope.visibility = scope.visibility.toLowerCase();
            });
            scope.upload = {
                loading: []
            };
            scope.$watch('ngModel', function (newVal) {
                if ((newVal && newVal._id) || (newVal && scope.multiple && newVal.length)) {
                    scope.ngChange();
                }
                scope.upload = {
                    loading: []
                };
            });
            jquery_1.$('body').on('click', '.lightbox-backdrop', function () {
                scope.upload = {
                    loading: []
                };
            });
        }
    };
});
module.directive('container', function () {
    return {
        restrict: 'E',
        scope: true,
        template: '<div ng-include="templateContainer"></div>',
        link: function (scope, element, attributes) {
            scope.tpl = template_1.template;
            template_1.template.watch(attributes.template, function () {
                scope.templateContainer = template_1.template.containers[attributes.template];
                if (scope.templateContainer === 'empty') {
                    scope.templateContainer = undefined;
                }
            });
            if (attributes.template) {
                scope.templateContainer = template_1.template.containers[attributes.template];
            }
        }
    };
});
module.directive('colorSelect', function () {
    return {
        restrict: 'E',
        scope: {
            ngModel: '='
        },
        replace: true,
        template: '' +
            '<div class="color-picker" ng-class="{ opened: pickColor }">' +
            '<button class="colors-opener" type="button"></button>' +
            '<div class="colors-list">' +
            '<button type="button" ng-repeat="color in colors" class="[[color]]" ng-click="setColor(color)"></button>' +
            '</div>' +
            '</div>',
        link: function (scope, element, attributes) {
            scope.colors = ['orange', 'pink', 'purple', 'blue', 'green', 'black', 'white', 'transparent'];
            scope.setColor = function (color) {
                scope.ngModel = color;
            };
            element.find('.colors-opener').on('click', function (e) {
                scope.pickColor = !scope.pickColor;
                scope.$apply('pickColor');
                e.stopPropagation();
                jquery_1.$('body, .main').one('click', function () {
                    scope.pickColor = false;
                    scope.$apply('pickColor');
                });
            });
        }
    };
});
module.directive('soundSelect', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            ngModel: '=',
            ngChange: '&',
            visibility: '@'
        },
        template: '<div><audio ng-src="[[ngModel]]" controls ng-if="ngModel" style="cursor: pointer"></audio>' +
            '<button ng-click="display.userSelecting = true"><i18n>audio.pick</i18n></button>' +
            '<lightbox show="display.userSelecting" on-close="userSelecting = false;">' +
            '<media-library ' +
            'visibility="selectedFile.visibility"' +
            'ng-change="updateDocument()" ' +
            'ng-model="selectedFile.file" ' +
            'file-format="\'audio\'">' +
            '</media-library>' +
            '</lightbox>' +
            '</div>',
        link: function (scope, element, attributes) {
            scope.display = {};
            scope.selectedFile = { file: {}, visibility: 'protected' };
            scope.selectedFile.visibility = scope.$parent.$eval(attributes.visibility);
            if (!scope.selectedFile.visibility) {
                scope.selectedFile.visibility = 'protected';
            }
            scope.selectedFile.visibility = scope.selectedFile.visibility.toLowerCase();
            scope.updateDocument = function () {
                scope.display.userSelecting = false;
                var path = '/workspace/document/';
                if (scope.selectedFile.visibility === 'public') {
                    path = '/workspace/pub/document/';
                }
                scope.ngModel = path + scope.selectedFile.file._id;
                scope.$apply('ngModel');
                scope.ngChange();
            };
            element.on('click', 'audio', function () {
                scope.userSelecting = true;
                scope.$apply('userSelecting');
            });
        }
    };
});
module.directive('mediaSelect', function () {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            ngModel: '=',
            multiple: '=',
            ngChange: '&',
            fileFormat: '=',
            label: "@",
            class: "@",
            value: '@',
            mytooltip: "@"
        },
        template: '<div><input type="button" class="pick-file [[class]]" tooltip="[[mytooltip]]" />' +
            '<lightbox show="userSelecting" on-close="userSelecting = false;">' +
            '<media-library ng-change="updateDocument()" ng-model="selectedFile.file" multiple="multiple" file-format="fileFormat" visibility="selectedFile.visibility"></media-library>' +
            '</lightbox>' +
            '</div>',
        compile: function (element, attributes) {
            if (!attributes.mytooltip && attributes.tooltip) {
                console.warn('tooltip attribute is deprecated on media-select tag, use mytooltip instead.');
                element.attr("mytooltip", attributes.tooltip);
                element.removeAttr('tooltip');
                attributes.mytooltip = attributes.tooltip;
                delete attributes.tooltip;
            }
            return function (scope, element, attributes) {
                //link: function(scope, element, attributes){
                scope.selectedFile = { file: {}, visibility: 'protected' };
                scope.selectedFile.visibility = scope.$parent.$eval(attributes.visibility);
                if (!scope.selectedFile.visibility) {
                    scope.selectedFile.visibility = 'protected';
                }
                scope.selectedFile.visibility = scope.selectedFile.visibility.toLowerCase();
                if (!scope.mytooltip) {
                    element.find('input').removeAttr('tooltip');
                }
                attributes.$observe('label', function (newVal) {
                    element.find('[type=button]').attr('value', idiom_1.idiom.translate(newVal));
                });
                scope.$watch('fileFormat', function (newVal) {
                    if (newVal === undefined) {
                        scope.fileFormat = 'img';
                    }
                });
                scope.updateDocument = function () {
                    scope.userSelecting = false;
                    var path = '/workspace/document/';
                    if (scope.selectedFile.visibility === 'public') {
                        path = '/workspace/pub/document/';
                    }
                    scope.ngModel = path + scope.selectedFile.file._id;
                    scope.$apply('ngModel');
                    scope.ngChange();
                };
                element.find('.pick-file').on('click', function () {
                    scope.userSelecting = true;
                    scope.$apply('userSelecting');
                });
            };
        }
    };
});
module.directive('filesPicker', function () {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        template: '<input type="button" ng-transclude />',
        scope: {
            ngChange: '&',
            ngModel: '='
        },
        link: function (scope, element, attributes) {
            element.on('click', function () {
                var fileSelector = jquery_1.$('<input />', {
                    type: 'file'
                })
                    .hide()
                    .appendTo('body');
                if (attributes.multiple !== undefined) {
                    fileSelector.attr('multiple', true);
                }
                fileSelector.on('change', function () {
                    scope.ngModel = fileSelector[0].files;
                    scope.$apply();
                    scope.$eval(scope.ngChange);
                    scope.$parent.$apply();
                });
                fileSelector.click();
                fileSelector.trigger('touchstart');
            });
        }
    };
});
module.directive('filesInputChange', function () {
    return {
        restrict: 'A',
        scope: {
            filesInputChange: '&',
            file: '=ngModel'
        },
        link: function ($scope, $element) {
            $element.bind('change', function () {
                $scope.file = $element[0].files;
                $scope.$apply();
                $scope.filesInputChange();
                $scope.$apply();
            });
        }
    };
});
module.directive('iconsSelect', function () {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            class: '@',
            current: '=',
            change: '&'
        },
        link: function (scope, element, attributes) {
            element.bind('change', function () {
                scope.current.id = element.find('.current').data('selected');
                scope.$eval(scope.change);
                element.unbind('change');
            });
        },
        template: '' +
            '<div>' +
            '<div class="current fixed cell twelve" data-selected="[[current.id]]">' +
            '<i class="[[current.icon]]"></i>' +
            '<span translate content="[[current.text]]"></span>' +
            '</div>' +
            '<div class="options-list icons-view">' +
            '<div class="wrapper">' +
            '<div class="cell three option" data-value="[[option.id]]" data-ng-repeat="option in options">' +
            '<i class="[[option.icon]]"></i>' +
            '<span translate content="[[option.text]]"></span>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>'
    };
});
module.directive('preview', function () {
    return {
        restrict: 'E',
        template: '<div class="row content-line"><div class="row fixed-block height-four">' +
            '<div class="four cell fixed image clip text-container"></div>' +
            '<div class="eight cell fixed-block left-four paragraph text-container"></div>' +
            '</div></div>',
        replace: true,
        scope: {
            content: '='
        },
        link: function ($scope, $element, $attributes) {
            $scope.$watch('content', function (newValue) {
                var fragment = jquery_1.$(newValue);
                $element.find('.image').html(fragment.find('img').first());
                var paragraph = underscore_1._.find(fragment.find('p'), function (node) {
                    return jquery_1.$(node).text().length > 0;
                });
                $element.find('.paragraph').text(jquery_1.$(paragraph).text());
            });
        }
    };
});
module.directive('portal', function () {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: entcore_1.skin.portalTemplate,
        compile: function (element, attributes, transclude) {
            element.find('[logout]').attr('href', '/auth/logout?callback=' + entcore_1.skin.logoutCallback);
            ui_1.ui.setStyle(entcore_1.skin.theme);
            http_1.Http.prototype.bind('disconnected', function () {
                window.location.href = '/';
            });
        }
    };
});
module.directive('adminPortal', function () {
    entcore_1.skin.skin = 'admin';
    entcore_1.skin.theme = '/public/admin/default/';
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: '/public/admin/portal.html',
        compile: function (element, attributes, transclude) {
            jquery_1.$('[logout]').attr('href', '/auth/logout?callback=' + entcore_1.skin.logoutCallback);
            http_1.http().get('/userbook/preference/admin').done(function (data) {
                var theme = data.preference ? JSON.parse(data.preference) : null;
                if (!theme || !theme.path)
                    ui_1.ui.setStyle(entcore_1.skin.theme);
                else {
                    ui_1.ui.setStyle('/public/admin/' + theme.path + '/');
                }
            }).error(function (error) {
                ui_1.ui.setStyle(entcore_1.skin.theme);
            });
        }
    };
});
module.directive('portalStyles', function () {
    return {
        restrict: 'E',
        compile: function (element, attributes) {
            jquery_1.$('[logout]').attr('href', '/auth/logout?callback=' + entcore_1.skin.logoutCallback);
            ui_1.ui.setStyle(entcore_1.skin.theme);
        }
    };
});
module.directive('defaultStyles', function () {
    return {
        restrict: 'E',
        link: function (scope, element, attributes) {
            ui_1.ui.setStyle(entcore_1.skin.theme);
        }
    };
});
module.directive('skinSrc', function () {
    return {
        restrict: 'A',
        scope: '&',
        link: function ($scope, $element, $attributes) {
            if (!jquery_1.$('#theme').attr('href')) {
                return;
            }
            var path = entcore_1.skin.basePath;
            $attributes.$observe('skinSrc', function () {
                if ($attributes.skinSrc.indexOf('http://') === -1 && $attributes.skinSrc.indexOf('https://') === -1 && $attributes.skinSrc.indexOf('/workspace/') === -1) {
                    $element.attr('src', path + $attributes.skinSrc);
                }
                else {
                    $element.attr('src', $attributes.skinSrc);
                }
            });
        }
    };
});
module.directive('localizedClass', function () {
    return {
        restrict: 'A',
        link: function ($scope, $attributes, $element) {
            $element.$addClass(globals_1.currentLanguage);
        }
    };
});
module.directive('pullDownMenu', function () {
    return {
        restrict: 'E',
        transclude: true,
        template: '<div class="pull-down-menu hide" ng-transclude></div>',
        controller: function ($scope) {
        }
    };
});
module.directive('pullDownOpener', function () {
    return {
        restrict: 'E',
        require: '^pullDownMenu',
        transclude: true,
        template: '<div class="pull-down-opener" ng-transclude></div>',
        link: function (scope, element, attributes) {
            element.find('.pull-down-opener').on('click', function () {
                var container = element.parents('.pull-down-menu');
                if (container.hasClass('hide')) {
                    setTimeout(function () {
                        jquery_1.$('body').on('click.pulldown', function () {
                            container.addClass('hide');
                            jquery_1.$('body').unbind('click.pulldown');
                        });
                    }, 0);
                    container.removeClass('hide');
                }
                else {
                    jquery_1.$('body').unbind('click.pulldown');
                    container.addClass('hide');
                }
            });
        }
    };
});
module.directive('pullDownContent', function () {
    return {
        restrict: 'E',
        require: '^pullDownMenu',
        transclude: true,
        template: '<div class="wrapper"><div class="arrow"></div><div class="pull-down-content" ng-transclude></div></div>',
        link: function (scope, element, attributes) {
        }
    };
});
module.directive('topNotification', function () {
    return {
        restrict: 'E',
        template: '<div class="notify-top">' +
            '<div class="notify-top-content" ng-bind-html="content"></div>' +
            '<div class="notify-top-actions">' +
            '<span ng-click="cancel()">[[doConfirm ? labels().cancel : labels().ok]]</span>' +
            '<span ng-click="ok()" ng-show="doConfirm">[[labels().confirm]]</span> ' +
            '</div>' +
            '</div>',
        scope: {
            trigger: '=',
            confirm: '=',
            content: '=',
            labels: '&'
        },
        link: function (scope, element, attributes) {
            element.css('display', 'none');
            scope.doConfirm = false;
            scope.cancel = function () {
                scope.trigger = false;
            };
            scope.ok = function () {
                scope.trigger = false;
                scope.confirm();
            };
            if (!scope.labels()) {
                scope.labels = function () {
                    return {
                        confirm: idiom_1.idiom.translate('confirm'),
                        cancel: idiom_1.idiom.translate('cancel'),
                        ok: idiom_1.idiom.translate('ok')
                    };
                };
            }
            scope.$watch('trigger', function (newVal) {
                if (newVal)
                    element.slideDown();
                else
                    element.slideUp();
            });
            scope.$watch('confirm', function (newVal) {
                scope.doConfirm = newVal ? true : false;
            });
        }
    };
});
module.directive('dropDown', ['$compile', '$timeout', function ($compile, $timeout) {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                ngChange: '&',
                onClose: '&',
                ngModel: '='
            },
            template: '<div data-drop-down class="drop-down">' +
                '<div>' +
                '<ul class="ten cell right-magnet">' +
                '<li ng-repeat="option in options | limitTo:limit" ng-model="option">[[option.toString()]]</li>' +
                '<li class="display-more" ng-show="limit < options.length" ng-click="increaseLimit()">' + idiom_1.idiom.translate('seemore') + '</li>' +
                '</ul>' +
                '</div>' +
                '</div>',
            link: function (scope, element, attributes) {
                scope.limit = 6;
                var dropDown = element.find('[data-drop-down]');
                scope.setDropDownHeight = function () {
                    var liHeight = 0;
                    var max = Math.min(scope.limit, scope.options.length);
                    dropDown.find('li').each(function (index, el) {
                        liHeight += jquery_1.$(el).height();
                        return index < max;
                    });
                    dropDown.height(liHeight);
                };
                scope.increaseLimit = function () {
                    scope.limit += 5;
                    $timeout(function () {
                        scope.setDropDownHeight();
                    });
                };
                scope.$watchCollection('options', function (newValue) {
                    if (!scope.options || scope.options.length === 0) {
                        dropDown.height();
                        dropDown.addClass('hidden');
                        scope.limit = 6;
                        dropDown.attr('style', '');
                        return;
                    }
                    dropDown.removeClass('hidden');
                    var linkedInput = jquery_1.$('#' + attributes.for);
                    var pos = linkedInput.offset();
                    var width = linkedInput.width() +
                        parseInt(linkedInput.css('padding-right')) +
                        parseInt(linkedInput.css('padding-left')) +
                        parseInt(linkedInput.css('border-width') || 1) * 2;
                    var height = linkedInput.height() +
                        parseInt(linkedInput.css('padding-top')) +
                        parseInt(linkedInput.css('padding-bottom')) +
                        parseInt(linkedInput.css('border-height') || 1) * 2;
                    pos.top = pos.top + height;
                    dropDown.offset(pos);
                    dropDown.width(width);
                    scope.setDropDownHeight();
                    setTimeout(function () {
                        scope.setDropDownHeight();
                    }, 100);
                });
                dropDown.detach().appendTo('body');
                dropDown.on('click', 'li', function (e) {
                    if (jquery_1.$(e.target).hasClass('display-more')) {
                        return;
                    }
                    scope.limit = 6;
                    dropDown.attr('style', '');
                    scope.current = jquery_1.$(this).scope().option;
                    scope.ngModel = jquery_1.$(this).scope().option;
                    scope.$apply('ngModel');
                    scope.$eval(scope.ngChange);
                    scope.$eval(scope.onClose);
                    scope.$apply('ngModel');
                });
                var closeDropDown = function (e) {
                    if (dropDown.find(e.target).length > 0) {
                        return;
                    }
                    scope.$eval(scope.onClose);
                    scope.$apply();
                };
                jquery_1.$('body').on('click', closeDropDown);
                dropDown.attr('data-opened-drop-down', true);
                element.on('$destroy', function () {
                    jquery_1.$('body').unbind('click', closeDropDown);
                    dropDown.remove();
                });
            }
        };
    }]);
module.directive('dropDownButton', function () {
    return {
        restrict: 'E',
        transclude: 'true',
        controller: function ($scope) {
        },
        template: '<div class="drop-down-button hidden"><div ng-transclude></div></div>',
        link: function (scope, element, attributes) {
            element.on('click', '.opener', function () {
                element.find('.drop-down-button').removeClass('hidden');
                jquery_1.$(document).one('mousedown', function (e) {
                    setTimeout(function () {
                        element.find('.drop-down-button').addClass('hidden');
                    }, 200);
                });
            });
        }
    };
});
module.directive('opts', function () {
    return {
        restrict: 'E',
        require: '^dropDownButton',
        transclude: true,
        template: '<div class="options"><ul ng-transclude></ul></div>',
        link: function (scope, element, attributes) {
            element.on('click', 'li', function () {
                element.parents('.drop-down-button').addClass('hidden');
            });
        }
    };
});
module.directive('loadingIcon', function () {
    return {
        restrict: 'E',
        link: function ($scope, $element, $attributes) {
            var addImage = function () {
                if (jquery_1.$('#theme').length === 0)
                    return;
                var loadingIllustrationPath = entcore_1.skin.basePath + '/img/icons/anim_loading_small.gif';
                jquery_1.$('<img>')
                    .attr('src', loadingIllustrationPath)
                    .attr('class', $attributes.class)
                    .addClass('loading-icon')
                    .appendTo($element);
            };
            if ($attributes.default === 'loading') {
                addImage();
            }
            http_1.http().bind('request-started.' + $attributes.request, function (e) {
                $element.find('img').remove();
                addImage();
            });
            if ($attributes.onlyLoadingIcon === undefined) {
                http_1.http().bind('request-ended.' + $attributes.request, function (e) {
                    var loadingDonePath = entcore_1.skin.basePath + '/img/icons/checkbox-checked.png';
                    $element.find('.loading-icon').remove();
                    jquery_1.$('<img>')
                        .attr('src', loadingDonePath)
                        .appendTo($element);
                });
            }
            else {
                http_1.http().bind('request-ended.' + $attributes.request, function (e) {
                    $element.find('img').remove();
                });
            }
        }
    };
});
module.directive('loadingPanel', function () {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attributes) {
            $attributes.$observe('loadingPanel', function (val) {
                http_1.http().bind('request-started.' + $attributes.loadingPanel, function (e) {
                    var loadingIllustrationPath = entcore_1.skin.basePath + '/img/illustrations/loading.gif';
                    if ($element.children('.loading-panel').length === 0) {
                        $element.append('<div class="loading-panel">' +
                            '<h1>' + idiom_1.idiom.translate('loading') + '</h1>' +
                            '<img src="' + loadingIllustrationPath + '" />' +
                            '</div>');
                    }
                });
                http_1.http().bind('request-ended.' + $attributes.loadingPanel, function (e) {
                    $element.find('.loading-panel').remove();
                });
            });
        }
    };
});
module.directive('userRole', function () {
    return {
        restrict: 'A',
        link: function ($scope, $element, $attributes) {
            var auth = $attributes.userRole;
            if (!modelDefinitions_1.model.me.functions[auth]) {
                $element.hide();
            }
            else {
                $element.show();
            }
        }
    };
});
module.directive('behaviour', function () {
    return {
        restrict: 'E',
        template: '<div ng-transclude></div>',
        replace: false,
        transclude: true,
        scope: {
            resource: '='
        },
        link: function ($scope, $element, $attributes) {
            console.error('This directive is deprecated. Please use "authorize" instead.');
            if (!$attributes.name) {
                throw "Behaviour name is required";
            }
            var content = $element.children('div');
            $scope.$watch('resource', function (newVal) {
                var hide = ($scope.resource instanceof Array && underscore_1._.find($scope.resource, function (resource) { return !resource.myRights || resource.myRights[$attributes.name] === undefined; }) !== undefined) ||
                    ($scope.resource instanceof modelDefinitions_1.Model && (!$scope.resource.myRights || $scope.resource.myRights[$attributes.name] === undefined));
                if (hide) {
                    content.hide();
                }
                else {
                    content.show();
                }
            });
        }
    };
});
module.directive('authorize', function () {
    return {
        restrict: 'EA',
        link: function (scope, element, attributes) {
            if (attributes.name === undefined && attributes.authorize === undefined) {
                throw "Right name is required";
            }
            var content = element.children('div');
            var switchHide = function () {
                var resource = scope.$eval(attributes.resource);
                var name = attributes.name || attributes.authorize;
                var hide = name && (resource instanceof Array && underscore_1._.find(resource, function (resource) { return !resource.myRights || resource.myRights[name] === undefined; }) !== undefined) ||
                    (resource instanceof modelDefinitions_1.Model && (!resource.myRights || resource.myRights[name] === undefined));
                if (hide) {
                    content.remove();
                    element.hide();
                }
                else {
                    element.append(content);
                    element.show();
                }
            };
            attributes.$observe('name', switchHide);
            attributes.$observe('authorize', switchHide);
            scope.$watch(function () { return scope.$eval(attributes.resource); }, switchHide);
        }
    };
});
module.directive('drawingZone', function () {
    return function ($scope, $element, $attributes) {
        $element.addClass('drawing-zone');
    };
});
module.directive('resizable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            ui_1.ui.extendElement.resizable(element, {
                lock: {
                    horizontal: element.attr('horizontal-resize-lock'),
                    vertical: element.attr('vertical-resize-lock')
                }
            });
        }
    };
});
module.directive('draggable', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            if (attributes.draggable == 'false' || attributes.native !== undefined) {
                return;
            }
            ui_1.ui.extendElement.draggable(element, {
                mouseUp: function () {
                    element.on('click', function () {
                        scope.$parent.$eval(attributes.ngClick);
                    });
                }
            });
        }
    };
});
module.directive('sharePanel', function () {
    return {
        scope: {
            resources: '=',
            appPrefix: '='
        },
        restrict: 'E',
        templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/share-panel.html',
        link: function ($scope, $element, $attributes) {
            $scope.shareTable = '/' + globals_1.appPrefix + '/public/template/entcore/share-panel-table.html';
        }
    };
});
module.directive('widgets', function () {
    return {
        scope: {
            list: '='
        },
        restrict: 'E',
        templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/widgets.html',
        link: function (scope, element, attributes) {
            element.on('index-changed', '.widget-container', function (e) {
                var widgetObj = angular_1.angular.element(e.target).scope().widget;
                element.find('.widget-container').each(function (index, widget) {
                    if (e.target === widget) {
                        return;
                    }
                    if (jquery_1.$(e.target).offset().top + (jquery_1.$(e.target).height() / 2) > jquery_1.$(widget).offset().top &&
                        jquery_1.$(e.target).offset().top + (jquery_1.$(e.target).height() / 2) < jquery_1.$(widget).offset().top + jquery_1.$(widget).height()) {
                        widgetObj.setIndex(index);
                        scope.$apply('widgets');
                    }
                    //last widget case
                    if (jquery_1.$(e.target).offset().top > jquery_1.$(widget).offset().top + jquery_1.$(widget).height() && index === element.find('.widget-container').length - 1) {
                        widgetObj.setIndex(index);
                        scope.$apply('widgets');
                    }
                    //first widget case
                    if (jquery_1.$(e.target).offset().top + jquery_1.$(e.target).height() > jquery_1.$(widget).offset().top && index === 0) {
                        widgetObj.setIndex(index);
                        scope.$apply('widgets');
                    }
                });
                element.find('.widget-container').css({ position: 'relative', top: '0px', left: '0px' });
            });
            modelDefinitions_1.model.widgets.on('change', function () {
                if (element.find('.widget-container').length === 0) {
                    element
                        .parents('.widgets')
                        .next('.widgets-friend')
                        .addClass('widgets-enemy');
                    element.parents('.widgets').addClass('hidden');
                }
                else {
                    element
                        .parents('.widgets')
                        .next('.widgets-friend')
                        .removeClass('widgets-enemy');
                    element.parents('.widgets').removeClass('hidden');
                }
            });
        }
    };
});
module.directive('progressBar', function () {
    return {
        restrict: 'E',
        scope: {
            max: '=',
            filled: '=',
            unit: '@'
        },
        template: '<div class="progress-bar">' +
            '<div class="filled">[[filled]] <span translate content="[[unit]]"></span></div>[[max]] <span translate content="[[unit]]"></span>' +
            '</div>',
        link: function (scope, element, attributes) {
            function updateBar() {
                var filledPercent = scope.filled * 100 / scope.max;
                element.find('.filled').width(filledPercent + '%');
                if (filledPercent < 10) {
                    element.find('.filled').addClass('small');
                }
                else {
                    element.find('.filled').removeClass('small');
                }
            }
            scope.$watch('filled', function (newVal) {
                updateBar();
            });
            scope.$watch('max', function (newVal) {
                updateBar();
            });
        }
    };
});
module.directive('datePicker', function () {
    return {
        scope: {
            minDate: '=',
            ngModel: '=',
            ngChange: '&'
        },
        transclude: true,
        replace: true,
        restrict: 'E',
        template: '<input ng-transclude type="text" data-date-format="dd/mm/yyyy"  />',
        link: function (scope, element, attributes) {
            scope.$watch('ngModel', function (newVal) {
                element.val(moment_1.moment(scope.ngModel).format('DD/MM/YYYY'));
                if (element.datepicker)
                    element.datepicker('setValue', moment_1.moment(scope.ngModel).format('DD/MM/YYYY'));
            });
            if (scope.minDate) {
                scope.$watch('minDate', function (newVal) {
                    setNewDate();
                });
            }
            function setNewDate() {
                var minDate = scope.minDate;
                var date = element.val().split('/');
                var temp = date[0];
                date[0] = date[1];
                date[1] = temp;
                date = date.join('/');
                scope.ngModel = new Date(date);
                if (scope.ngModel < minDate) {
                    scope.ngModel = minDate;
                    element.val(moment_1.moment(minDate).format('DD/MM/YYYY'));
                }
                scope.$apply('ngModel');
                scope.$parent.$eval(scope.ngChange);
                scope.$parent.$apply();
            }
            http_1.http().loadScript('/' + globals_1.infraPrefix + '/public/js/bootstrap-datepicker.js').then(function () {
                element.datepicker({
                    dates: {
                        months: moment_1.moment.months(),
                        monthsShort: moment_1.moment.monthsShort(),
                        days: moment_1.moment.weekdays(),
                        daysShort: moment_1.moment.weekdaysShort(),
                        daysMin: moment_1.moment.weekdaysMin()
                    },
                    weekStart: 1
                })
                    .on('changeDate', function () {
                    setTimeout(setNewDate, 10);
                    jquery_1.$(this).datepicker('hide');
                });
                element.datepicker('hide');
            });
            var hideFunction = function (e) {
                if (e.originalEvent && (element[0] === e.originalEvent.target || jquery_1.$('.datepicker').find(e.originalEvent.target).length !== 0)) {
                    return;
                }
                element.datepicker('hide');
            };
            jquery_1.$('body, lightbox').on('click', hideFunction);
            jquery_1.$('body, lightbox').on('focusin', hideFunction);
            element.on('focus', function () {
                var that = this;
                jquery_1.$(this).parents('form').on('submit', function () {
                    jquery_1.$(that).datepicker('hide');
                });
                element.datepicker('show');
            });
            element.on('change', setNewDate);
            element.on('$destroy', function () {
                element.datepicker('hide');
            });
        }
    };
});
module.directive('datePickerIcon', function () {
    return {
        scope: {
            ngModel: '=',
            ngChange: '&'
        },
        replace: true,
        restrict: 'E',
        template: '<div class="date-picker-icon"> <input type="text" class="hiddendatepickerform" style="visibility: hidden; width: 0px; height: 0px; float: inherit" data-date-format="dd/mm/yyyy"/> <a ng-click="openDatepicker()"><i class="calendar"/></a> </div>',
        link: function ($scope, $element, $attributes) {
            http_1.http().loadScript('/' + globals_1.infraPrefix + '/public/js/bootstrap-datepicker.js').then(function () {
                var input_element = $element.find('.hiddendatepickerform');
                input_element.value = moment_1.moment(new Date()).format('DD/MM/YYYY');
                input_element.datepicker({
                    dates: {
                        months: moment_1.moment.months(),
                        monthsShort: moment_1.moment.monthsShort(),
                        days: moment_1.moment.weekdays(),
                        daysShort: moment_1.moment.weekdaysShort(),
                        daysMin: moment_1.moment.weekdaysMin()
                    },
                    weekStart: 1
                })
                    .on('changeDate', function (event) {
                    $scope.ngModel = event.date;
                    $scope.$apply('ngModel');
                    jquery_1.$(this).datepicker('hide');
                    if (typeof $scope.ngChange === 'function') {
                        $scope.ngChange();
                    }
                });
                input_element.datepicker('hide');
                $scope.openDatepicker = function () {
                    input_element.datepicker('show');
                };
            });
        }
    };
});
module.directive('filters', function () {
    return {
        restrict: 'E',
        template: '<div class="row line filters">' +
            '<div class="filters-icons">' +
            '<ul ng-transclude>' +
            '</ul></div>' +
            '</div><div class="row"></div> ',
        transclude: true,
        link: function (scope, element, attributes) {
        }
    };
});
module.directive('alphabetical', ['$compile', '$parse', function ($compile, $parse) {
        return {
            restrict: 'E',
            controller: function ($scope) {
                $scope.letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];
                $scope.matchingElements = {};
                $scope.matching = function (letter) {
                    return function (element) {
                        return element[$scope.title][0].toUpperCase() === letter || (letter === '#' && element[$scope.title][0].toLowerCase() === element[$scope.title][0].toUpperCase());
                    };
                };
                $scope.updateElements = function () {
                    $scope.letters.forEach(function (letter) {
                        $scope.matchingElements[letter] = underscore_1._.filter($scope.collection($scope), function (element) {
                            return element[$scope.title][0].toUpperCase() === letter || (letter === '#' && element[$scope.title][0].toLowerCase() === element[$scope.title][0].toUpperCase());
                        });
                    });
                };
                if (!$scope.display) {
                    $scope.display = {};
                }
                $scope.display.pickLetter;
            },
            compile: function (element, attributes) {
                var iterator = attributes.list;
                var iteratorContent = element.html();
                element.html('<lightbox class="letter-picker" show="display.pickLetter" on-close="display.pickLetter = false;">' +
                    '<div ng-repeat="letter in letters"><h2 ng-click="viewLetter(letter)" class="cell" ng-class="{disabled: matchingElements[letter].length <= 0 }">[[letter]]</h2></div>' +
                    '</lightbox>' +
                    '<div ng-repeat="letter in letters">' +
                    '<div ng-if="matchingElements[letter].length > 0" class="row">' +
                    '<h1 class="letter-picker" ng-click="display.pickLetter = true;" id="alphabetical-[[letter]]">[[letter]]</h1><hr class="line" />' +
                    '<div class="row"><div ng-repeat="' + iterator + ' |filter: matching(letter)">' + iteratorContent + '</div></div>' +
                    '</div><div ng-if="matchingElements[letter].length > 0" class="row"></div>' +
                    '</div>');
                element.addClass('alphabetical');
                var match = iterator.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
                var collection = match[2];
                return function (scope, element, attributes) {
                    scope.title = attributes.title || 'title';
                    element.removeAttr('title');
                    scope.collection = $parse(collection);
                    scope.$watchCollection(collection, function (newVal) {
                        scope.updateElements();
                    });
                    scope.updateElements();
                    scope.viewLetter = function (letter) {
                        document.getElementById('alphabetical-' + letter).scrollIntoView();
                        scope.display.pickLetter = false;
                    };
                };
            }
        };
    }]);
module.directive('completeClick', ['$parse', function ($parse) {
        return {
            compile: function (selement, attributes) {
                var fn = $parse(attributes.completeClick);
                return function (scope, element, attributes) {
                    element.on('click', function (event) {
                        scope.$apply(function () {
                            fn(scope, { $event: event });
                        });
                    });
                };
            }
        };
    }]);
module.directive('dragstart', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attributes) {
                var dragStartFn = $parse(attributes.dragstart);
                var ngModel = $parse(attributes.ngModel);
                if (attributes.dragcondition !== undefined && scope.$eval(attributes.dragcondition) === false) {
                    element.attr("draggable", "false");
                    return;
                }
                element.attr("draggable", "true");
                element.attr("native", "");
                element.on("dragstart", function (event) {
                    if (ngModel && ngModel(scope)) {
                        try {
                            event.originalEvent.dataTransfer.setData('application/json', JSON.stringify(ngModel(scope)));
                        }
                        catch (e) {
                            event.originalEvent.dataTransfer.setData('Text', JSON.stringify(ngModel(scope)));
                        }
                    }
                    if (attributes.dragstart === '') {
                        return;
                    }
                    dragStartFn(scope, { $originalEvent: event.originalEvent });
                });
                element.on('$destroy', function () {
                    element.off();
                });
            }
        };
    }]);
module.directive('dragdrop', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            link: function (scope, element, attributes) {
                var dropFn = $parse(attributes.dragdrop);
                var dropConditionFn = $parse(attributes.dropcondition);
                element.on("dragover", function (event) {
                    if (attributes.dropcondition === undefined || dropConditionFn(scope, { $originalEvent: event.originalEvent })) {
                        event.preventDefault();
                        event.stopPropagation();
                        element.addClass("droptarget");
                    }
                });
                element.on("dragleave", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    element.removeClass("droptarget");
                });
                element.on("drop", function (event) {
                    event.originalEvent.preventDefault();
                    element.removeClass("droptarget");
                    var item;
                    try {
                        item = JSON.parse(event.originalEvent.dataTransfer.getData('application/json'));
                    }
                    catch (e) {
                        item = JSON.parse(event.originalEvent.dataTransfer.getData('Text'));
                    }
                    dropFn(scope, { $originalEvent: event.originalEvent, $item: item });
                });
                element.on('$destroy', function () {
                    element.off();
                });
            }
        };
    }]);
module.directive('dropFiles', ['$parse', function ($parse) {
        return {
            link: function (scope, element, attributes) {
                var ngModel = $parse(attributes.dropFiles);
                element.on('dragover', function (e) {
                    e.preventDefault();
                    scope.$eval(attributes.onDrag);
                    element.addClass('droptarget');
                });
                element.on('dragleave', function (e) {
                    e.preventDefault();
                    scope.$eval(attributes.onLeave);
                    element.removeClass('droptarget');
                });
                element.on('drop', function (e) {
                    e.preventDefault();
                    ngModel.assign(scope, e.originalEvent.dataTransfer.files);
                    scope.$eval(attributes.onDrop);
                    scope.$apply();
                    element.removeClass('droptarget');
                });
            }
        };
    }]);
module.directive('attachments', ['$parse', function ($parse) {
        return {
            scope: true,
            restrict: 'E',
            templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/attachments.html',
            controller: function ($scope) {
                $scope.linker = {
                    resource: {}
                };
                $scope.attachments = {
                    me: modelDefinitions_1.model.me,
                    display: {
                        search: { text: '', application: {} },
                        pickFile: false
                    },
                    addAttachment: function (resource) {
                        resource.provider = $scope.attachments.display.search.application;
                        if ($scope.ngModel($scope) instanceof Array) {
                            $scope.ngModel($scope).push(resource);
                        }
                        else {
                            $scope.ngModel.assign($scope, [resource]);
                        }
                        $scope.attachments.display.pickFile = false;
                    },
                    removeAttachment: function (resource) {
                        $scope.ngModel.assign($scope, underscore_1._.reject($scope.ngModel($scope), function (item) {
                            return item === resource;
                        }));
                    },
                    attachmentsList: function () {
                        $scope.list = $scope.ngModel($scope);
                        return $scope.list;
                    }
                };
            },
            link: function (scope, element, attributes) {
                scope.ngModel = $parse(attributes.ngModel);
                scope.attachments.onChange = function () {
                    scope.$eval(attributes.onChange);
                };
                scope.apps = scope.$eval(attributes.apps);
                scope.$watch(function () {
                    return scope.attachments.display.pickFile;
                }, function (newVal) {
                    if (newVal) {
                        scope.attachments.loadApplicationResources(function () {
                            scope.attachments.searchApplication();
                            scope.attachments.display.search.text = ' ';
                            scope.$apply('attachments');
                        });
                    }
                    else {
                        scope.attachments.display.search.text = '';
                    }
                }, true);
                http_1.http().get('/resources-applications').done(function (apps) {
                    scope.attachments.apps = underscore_1._.filter(modelDefinitions_1.model.me.apps, function (app) {
                        return underscore_1._.find(apps, function (match) {
                            return app.address.indexOf(match) !== -1 && app.icon;
                        }) && underscore_1._.find(scope.apps, function (match) {
                            return app.address.indexOf(match) !== -1;
                        });
                    });
                    scope.attachments.display.search.application = scope.attachments.apps[0];
                    scope.attachments.loadApplicationResources(function () { });
                    scope.$apply('attachments');
                });
                scope.attachments.loadApplicationResources = function (cb) {
                    if (!cb) {
                        cb = function () {
                            scope.attachments.display.searchApplication();
                            scope.$apply('attachments');
                        };
                    }
                    var split = scope.attachments.display.search.application.address.split('/');
                    scope.prefix = split[split.length - 1];
                    behaviours_1.Behaviours.loadBehaviours(scope.prefix, function (appBehaviour) {
                        appBehaviour.loadResources(cb);
                        scope.attachments.addResource = appBehaviour.create;
                    });
                };
                scope.attachments.searchApplication = function () {
                    var split = scope.attachments.display.search.application.address.split('/');
                    scope.prefix = split[split.length - 1];
                    behaviours_1.Behaviours.loadBehaviours(scope.prefix, function (appBehaviour) {
                        scope.attachments.resources = underscore_1._.filter(appBehaviour.resources, function (resource) {
                            return scope.attachments.display.search.text !== '' && (idiom_1.idiom.removeAccents(resource.title.toLowerCase()).indexOf(idiom_1.idiom.removeAccents(scope.attachments.display.search.text).toLowerCase()) !== -1 ||
                                resource._id === scope.attachments.display.search.text);
                        });
                    });
                };
                scope.linker.createResource = function () {
                    var split = scope.attachments.display.search.application.address.split('/');
                    var prefix = split[split.length - 1];
                    behaviours_1.Behaviours.loadBehaviours(prefix, function (appBehaviour) {
                        appBehaviour.create(scope.linker.resource, function (resources, newResource) {
                            if (!(scope.ngModel(scope) instanceof Array)) {
                                scope.ngModel.assign(scope, []);
                            }
                            scope.attachments.display.pickFile = false;
                            var resource = underscore_1._.find(resources, function (resource) {
                                return resource._id === newResource._id;
                            });
                            resource.provider = scope.attachments.display.search.application;
                            scope.ngModel(scope).push(resource);
                            scope.$apply();
                        });
                    });
                };
            }
        };
    }]);
module.directive('pdfViewer', function () {
    return {
        restrict: 'E',
        template: '' +
            '<div class="file-controls">' +
            '<i class="previous" ng-click="previousPage()"></i>' +
            '<i class="next" ng-click="nextPage()"></i>' +
            '</div>' +
            '<div class="pagination">' +
            '<input type="text" ng-model="pageIndex" ng-change="openPage()" /> / [[numPages]]' +
            '</div>',
        link: function (scope, element, attributes) {
            var pdf;
            scope.pageIndex = 1;
            scope.nextPage = function () {
                if (scope.pageIndex < scope.numPages) {
                    scope.pageIndex++;
                    scope.openPage();
                }
            };
            scope.previousPage = function () {
                if (scope.pageIndex > 0) {
                    scope.pageIndex--;
                    scope.openPage();
                }
            };
            scope.openPage = function () {
                var pageNumber = parseInt(scope.pageIndex);
                if (!pageNumber) {
                    return;
                }
                if (pageNumber < 1) {
                    pageNumber = 1;
                }
                if (pageNumber > scope.numPages) {
                    pageNumber = scope.numPages;
                }
                pdf.getPage(pageNumber).then(function (page) {
                    var viewport;
                    if (!jquery_1.$(canvas).hasClass('fullscreen')) {
                        viewport = page.getViewport(1);
                        var scale = element.width() / viewport.width;
                        viewport = page.getViewport(scale);
                    }
                    else {
                        viewport = page.getViewport(2);
                    }
                    var context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext);
                });
            };
            scope.$parent.render = scope.openPage;
            window.PDFJS = { workerSrc: '/infra/public/js/viewers/pdf.js/pdf.worker.js' };
            var canvas = document.createElement('canvas');
            jquery_1.$(canvas).addClass('render');
            element.append(canvas);
            http_1.http().loadScript('/infra/public/js/viewers/pdf.js/pdf.js').then(function () {
                window.PDFJS
                    .getDocument(attributes.ngSrc)
                    .then(function (file) {
                    pdf = file;
                    scope.numPages = pdf.pdfInfo.numPages;
                    scope.$apply('numPages');
                    scope.openPage();
                });
            });
        }
    };
});
module.directive('fileViewer', function () {
    return {
        restrict: 'E',
        scope: {
            ngModel: '='
        },
        templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/file-viewer.html',
        link: function (scope, element, attributes) {
            scope.contentType = scope.ngModel.metadata.contentType;
            scope.isFullscreen = false;
            scope.download = function () {
                window.location.href = scope.ngModel.link;
            };
            var renderElement;
            var renderParent;
            scope.fullscreen = function (allow) {
                scope.isFullscreen = allow;
                if (allow) {
                    var container = jquery_1.$('<div class="fullscreen-viewer"></div>');
                    container.hide();
                    container.on('click', function (e) {
                        if (!jquery_1.$(e.target).hasClass('render')) {
                            scope.fullscreen(false);
                            scope.$apply('isFullscreen');
                        }
                    });
                    element.children('.embedded-viewer').addClass('fullscreen');
                    renderElement = element
                        .find('.render');
                    renderParent = renderElement.parent();
                    renderElement
                        .addClass('fullscreen')
                        .appendTo(container);
                    container.appendTo('body');
                    container.fadeIn();
                    if (typeof scope.render === 'function') {
                        scope.render();
                    }
                }
                else {
                    renderElement.removeClass('fullscreen').appendTo(renderParent);
                    element.children('.embedded-viewer').removeClass('fullscreen');
                    var fullscreenViewer = jquery_1.$('body').find('.fullscreen-viewer');
                    fullscreenViewer.fadeOut(400, function () {
                        fullscreenViewer.remove();
                    });
                    if (typeof scope.render === 'function') {
                        scope.render();
                    }
                }
            };
        }
    };
});
module.directive('ngTouchstart', function () {
    return {
        restrict: 'A',
        scope: true,
        link: function (scope, element, attributes) {
            element.on('touchstart', function () {
                scope.$eval(attributes['ngTouchstart']);
            });
            if (attributes['ngTouchend']) {
                jquery_1.$('body').on('touchend', function () {
                    scope.$eval(attributes['ngTouchend']);
                });
            }
        }
    };
});
module.directive('inputPassword', function () {
    return {
        restrict: 'E',
        replace: false,
        template: '<input type="password"/>' +
            '<button type="button" \
				ng-mousedown="show(true)" \
				ng-touchstart="show(true)" \
				ng-touchend="show(false)" \
				ng-mouseup="show(false)" \
				ng-mouseleave="show(false)"></button>',
        scope: true,
        compile: function (element, attributes) {
            element.addClass('toggleable-password');
            var passwordInput = element.children('input[type=password]');
            for (var prop in attributes.$attr) {
                passwordInput.attr(attributes.$attr[prop], attributes[prop]);
                element.removeAttr(attributes.$attr[prop]);
            }
            return function (scope) {
                scope.show = function (bool) {
                    passwordInput[0].type = bool ? "text" : "password";
                };
            };
        }
    };
});
module.directive('sidePanel', function () {
    return {
        restrict: 'E',
        transclude: true,
        template: '<div class="opener"></div>' +
            '<div class="toggle">' +
            '<div class="content" ng-transclude></div>' +
            '</div>',
        link: function (scope, element, attributes) {
            element.addClass('hidden');
            element.children('.opener').on('click', function (e) {
                if (!element.hasClass('hidden')) {
                    return;
                }
                element.removeClass('hidden');
                setTimeout(function () {
                    jquery_1.$('body').on('click.switch-side-panel', function (e) {
                        if (!(element.children('.toggle').find(e.originalEvent.target).length)) {
                            element.addClass('hidden');
                            jquery_1.$('body').off('click.switch-side-panel');
                        }
                    });
                }, 0);
            });
        }
    };
});
module.directive('plus', function () {
    return {
        restrict: 'E',
        transclude: true,
        template: '' +
            '<div class="opener">' +
            '<div class="plus"></div>' +
            '<div class="minus"></div>' +
            '</div>' +
            '<section class="toggle-buttons">' +
            '<div class="toggle" ng-transclude></div>' +
            '</div>',
        link: function (scope, element, attributes) {
            element.children('.toggle-buttons').addClass('hide');
            element.children('.opener').addClass('plus');
            element.children('.opener').on('click', function (e) {
                if (!element.children('.toggle-buttons').hasClass('hide')) {
                    return;
                }
                element.children('.toggle-buttons').removeClass('hide');
                element.children('.opener').removeClass('plus').addClass('minus');
                setTimeout(function () {
                    jquery_1.$('body').on('click.switch-plus-buttons', function (e) {
                        //if(!(element.children('.toggle-buttons').find(e.originalEvent.target).length)){
                        element.children('.toggle-buttons').addClass('hide');
                        element.children('.opener').removeClass('minus').addClass('plus');
                        jquery_1.$('body').off('click.switch-plus-buttons');
                        //}
                    });
                }, 0);
            });
        }
    };
});
module.directive('help', function () {
    var helpText;
    return {
        restrict: 'E',
        scope: {},
        template: '<i class="help"></i>' +
            '<lightbox show="display.read" on-close="display.read = false"><div></div></lightbox>',
        link: function (scope, element) {
            scope.display = {};
            scope.helpPath = '/help/application/' + globals_1.appPrefix + '/';
            if (globals_1.appPrefix === '.' && window.location.pathname !== '/adapter') {
                scope.helpPath = '/help/application/portal/';
            }
            else if (window.location.pathname === '/adapter') {
                scope.helpPath = '/help/application/' + window.location.search.split('eliot=')[1].split('&')[0] + '/';
            }
            var helpContent;
            var setHtml = function (content) {
                helpContent = jquery_1.$('<div>' + content + '</div>');
                helpContent.find('img').each(function (index, item) {
                    jquery_1.$(item).attr('src', scope.helpPath + jquery_1.$(item).attr('src'));
                });
                helpContent.find('script').remove();
                element.find('div.content').html(helpContent.html());
                element.find('a').on('click', function (e) {
                    element.find('.app-content-section').slideUp();
                    jquery_1.$('#' + jquery_1.$(e.target).attr('href').split('#')[1]).slideDown();
                });
                element.find('a').first().click();
                scope.display.read = true;
                scope.$apply('display');
            };
            element.children('i.help').on('click', function () {
                if (helpText) {
                    setHtml(helpText);
                }
                else {
                    http_1.http().get(scope.helpPath)
                        .done(function (content) {
                        helpText = content;
                        setHtml(helpText);
                    })
                        .e404(function () {
                        helpText = '<h2>' + idiom_1.idiom.translate('help.notfound.title') + '</h2><p>' + idiom_1.idiom.translate('help.notfound.text') + '</p>';
                        setHtml(helpText);
                    });
                }
            });
        }
    };
});
module.directive('stickToTop', function () {
    return {
        restrict: 'EA',
        link: function (scope, element, attributes) {
            var initialPosition;
            setTimeout(function () {
                initialPosition = element.offset().top;
            }, 200);
            var scrollTop = jquery_1.$(window).scrollTop();
            var actualScrollTop = jquery_1.$(window).scrollTop();
            var animation = function () {
                element.addClass('scrolling');
                element.offset({
                    top: element.offset().top + (actualScrollTop + jquery_1.$('.height-marker').height() - (element.offset().top)) / 20
                });
                requestAnimationFrame(animation);
            };
            var scrolls = false;
            jquery_1.$(window).scroll(function () {
                actualScrollTop = jquery_1.$(window).scrollTop();
                if (actualScrollTop <= initialPosition - jquery_1.$('.height-marker').height()) {
                    actualScrollTop = initialPosition - jquery_1.$('.height-marker').height();
                }
                if (!scrolls) {
                    animation();
                }
                scrolls = true;
            });
        }
    };
});
module.directive('floatingNavigation', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {},
        template: '<nav class="vertical hash-magnet floating" stick-to-top>' +
            '<div class="previous arrow" ng-class="{ visible: step > 0 }"></div>' +
            '<div class="content" ng-transclude></div>' +
            '<div class="next arrow" ng-class="{ visible: step < stepsLength && stepsLength > 0 }"></div>' +
            '</nav>',
        link: function (scope, element, attributes) {
            var initialPosition;
            scope.step = 0;
            setTimeout(function () {
                initialPosition = element.offset();
                element.height(jquery_1.$(window).height() - parseInt(element.css('margin-bottom')) - 100);
                scope.stepsLength = parseInt(element.find('.content')[0].scrollHeight / element.height());
            }, 800);
            element.find('.arrow.next').on('click', function () {
                scope.step++;
                scope.$apply();
                element.find('.content').animate({
                    scrollTop: element.height() * scope.step
                }, 450);
            });
            element.find('.arrow.previous').on('click', function () {
                scope.step--;
                scope.$apply();
                element.find('.content').animate({
                    scrollTop: element.height() * scope.step
                }, 450);
            });
        }
    };
});
module.directive('multiCombo', function () {
    return {
        restrict: 'E',
        replace: false,
        scope: {
            title: '@',
            comboModel: '=',
            filteredModel: '=',
            searchOn: '@',
            orderBy: '@',
            filterModel: '&',
            searchPlaceholder: '@',
            maxSelected: '@',
            labels: '&',
            disable: '&',
            selectionEvent: '&',
            deselectionEvent: '&'
        },
        templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/multi-combo.html',
        controller: function ($scope, $filter, $timeout) {
            /* Search input */
            $scope.search = {
                input: '',
                reset: function () { this.input = ""; }
            };
            /* Combo box visibility */
            $scope.show = false;
            $scope.toggleVisibility = function () {
                $scope.show = !$scope.show;
                if ($scope.show) {
                    $scope.addClickEvent();
                    $scope.search.reset();
                    $timeout(function () {
                        $scope.setComboPosition();
                    }, 1);
                }
            };
            /* Item list selection & filtering */
            if (!$scope.filteredModel || !($scope.filteredModel instanceof Array))
                $scope.filteredModel = [];
            $scope.isSelected = function (item) {
                return $scope.filteredModel.indexOf(item) >= 0;
            };
            $scope.toggleItem = function (item) {
                var idx = $scope.filteredModel.indexOf(item);
                if (idx >= 0) {
                    $scope.filteredModel.splice(idx, 1);
                    if ($scope.deselectionEvent() instanceof Function)
                        $scope.deselectionEvent()();
                }
                else if (!$scope.maxSelected || $scope.filteredModel.length < $scope.maxSelected) {
                    $scope.filteredModel.push(item);
                    if ($scope.selectionEvent() instanceof Function)
                        $scope.selectionEvent()();
                }
            };
            $scope.selectAll = function () {
                $scope.filteredModel.length = 0;
                for (var i = 0; i < $scope.filteredComboModel.length; i++) {
                    $scope.filteredModel.push($scope.filteredComboModel[i]);
                }
                if ($scope.selectionEvent() instanceof Function)
                    $scope.selectionEvent()();
            };
            $scope.deselectAll = function () {
                $scope.filteredModel.length = 0;
                if ($scope.deselectionEvent() instanceof Function)
                    $scope.deselectionEvent()();
            };
            $scope.fairInclusion = function (anyString, challenger) {
                return idiom_1.idiom.removeAccents(anyString.toLowerCase()).indexOf(idiom_1.idiom.removeAccents(challenger.toLowerCase())) >= 0;
            };
            $scope.filteringFun = function (item) {
                var precondition = $scope.filterModel() ? $scope.filterModel()(item) : true;
                if ($scope.searchOn && item instanceof Object)
                    return precondition && $scope.fairInclusion(item[$scope.searchOn], $scope.search.input);
                return precondition && $scope.fairInclusion(item, $scope.search.input);
            };
            /* Item display */
            $scope.display = function (item) {
                return item instanceof Object ? item.toString() : item;
            };
            /* Ensure that filtered elements are not obsolete */
            $scope.$watchCollection('comboModel', function () {
                if (!$scope.comboModel) {
                    $scope.filteredModel = [];
                    return;
                }
                for (var i = 0; i < $scope.filteredModel.length; i++) {
                    var idx = $scope.comboModel.indexOf($scope.filteredModel[i]);
                    if (idx < 0) {
                        $scope.filteredModel.splice(idx, 1);
                        i--;
                    }
                }
            });
        },
        link: function (scope, element, attributes) {
            if (!attributes.comboModel || !attributes.filteredModel) {
                throw '[<multi-combo> directive] Error: combo-model & filtered-model attributes are required.';
            }
            /* Max n° of elements selected limit */
            scope.maxSelected = parseInt(scope.maxSelected);
            if (!isNaN(scope.maxSelected) && scope.maxSelected < 1) {
                throw '[<multi-combo> directive] Error: max-selected must be an integer greater than 0.';
            }
            /* Visibility mouse click event */
            scope.addClickEvent = function () {
                if (!scope.show)
                    return;
                var timeId = new Date().getTime();
                jquery_1.$('body').on('click.multi-combo' + timeId, function (e) {
                    if (!(element.find(e.originalEvent.target).length)) {
                        scope.show = false;
                        jquery_1.$('body').off('click.multi-combo' + timeId);
                        scope.$apply();
                    }
                });
            };
            /* Drop down position */
            scope.setComboPosition = function () {
                element.css('position', 'relative');
                element.find('.multi-combo-root-panel').css('top', element.find('.multi-combo-root-button').outerHeight());
            };
            scope.setComboPosition();
        }
    };
});
module.directive('slide', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attributes) {
            scope.$watch(function () {
                return scope.$eval(attributes.slide);
            }, function (newVal) {
                if (newVal) {
                    element.slideDown();
                }
                else {
                    element.slideUp();
                }
            });
            if (!scope.$eval(attributes.slide)) {
                element.hide();
            }
        }
    };
});
module.directive('sideNav', function () {
    return {
        restrict: 'AE',
        link: function (scope, element, attributes) {
            var body = jquery_1.$('body');
            ;
            jquery_1.$('.mobile-nav-opener').addClass('visible');
            var maxWidth = ui_1.ui.breakpoints.tablette;
            var target = attributes.targetElement || '.navbar';
            element.addClass('side-nav');
            jquery_1.$('body').addClass('transition');
            var opener = jquery_1.$('.mobile-nav-opener');
            opener.on('click', function () {
                if (!element.hasClass('slide')) {
                    element.addClass('slide');
                    jquery_1.$('body').addClass('point-out');
                }
                else {
                    element.removeClass('slide');
                    jquery_1.$('body').removeClass('point-out');
                }
            });
            jquery_1.$('body').on('click', function (e) {
                if (element[0] === e.target || element.find(e.target).length || jquery_1.$('.mobile-nav-opener')[0] === e.target) {
                    return;
                }
                element.removeClass('slide');
                jquery_1.$('body').removeClass('point-out');
            });
            if (attributes.maxWidth) {
                maxWidth = parseInt(attributes.maxWidth);
            }
            function addRemoveEvents() {
                if (ui_1.ui.breakpoints.checkMaxWidth(maxWidth)) {
                    element.height(jquery_1.$(window).height());
                    if (jquery_1.$('.mobile-nav-opener').hasClass('visible')) {
                        body.find('.application-title').addClass('move-right');
                    }
                    ui_1.ui.extendElement.touchEvents(body, {
                        exclude: ['longclick'],
                        allowDefault: true
                    });
                    ui_1.ui.extendElement.touchEvents(element, {
                        exclude: ['longclick']
                    });
                    body.on('swipe-right', function () {
                        element.addClass('slide');
                    });
                    element.on('swipe-left', function () {
                        element.removeClass('slide');
                        jquery_1.$('body').removeClass('point-out');
                    });
                }
                else {
                    element.height('auto');
                }
            }
            addRemoveEvents();
            jquery_1.$(window).on('resize', addRemoveEvents);
            scope.$on("$destroy", function () {
                jquery_1.$('.mobile-nav-opener').removeClass('visible');
                body.find('.application-title').removeClass('move-right');
            });
        }
    };
});
module.directive('appTitle', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            link: function (scope, element, attributes) {
                element.addClass('zero-mobile');
                element.find('h1').addClass('application-title');
                function setHeader() {
                    var header = jquery_1.$('app-title').html();
                    var mobileheader = jquery_1.$('header.main .application-title');
                    if (ui_1.ui.breakpoints.checkMaxWidth("tablette")) {
                        if (!mobileheader.length)
                            jquery_1.$('header.main').append($compile(header)(scope));
                    }
                    else {
                        mobileheader.remove();
                    }
                }
                setHeader();
                jquery_1.$(window).on('resize', setHeader);
                scope.$on("$destroy", function () {
                    jquery_1.$('body').find('header.main .application-title').remove();
                });
            }
        };
    }]);
module.directive('microbox', ['$compile', function ($compile) {
        return {
            restrict: 'E',
            compile: function (element, attributes, transclude) {
                var content = element.html();
                return function (scope, element, attributes) {
                    var microtitle = idiom_1.idiom.translate(attributes.microtitle);
                    var closeBox = idiom_1.idiom.translate(attributes.close);
                    element.addClass('zero-mobile');
                    function setBox(apply) {
                        if (ui_1.ui.breakpoints.checkMaxWidth("tablette")) {
                            if (!jquery_1.$('.microbox-wrapper').length) {
                                //creer la box
                                jquery_1.$('body').append('<div class="microbox-wrapper zero">' +
                                    '<div class="microbox-content">' +
                                    '<i class="close-2x"></i>' +
                                    '<div class="microbox-material"></div>' +
                                    '<button class="microbox-close">' + closeBox + '</button>' +
                                    '</div></div>');
                                jquery_1.$('.microbox-material').html($compile(content)(scope));
                                element.after('<button class="microbox">' + microtitle + '</button>');
                                jquery_1.$('button.microbox').on('click', function () {
                                    if (jquery_1.$('.microbox-wrapper').hasClass('zero')) {
                                        jquery_1.$('.microbox-wrapper').removeClass('zero');
                                    }
                                });
                                jquery_1.$('button.microbox-close, .microbox-content i.close-2x').on('click', function () {
                                    if (!jquery_1.$('.microbox-wrapper').hasClass('zero')) {
                                        jquery_1.$('.microbox-wrapper').addClass('zero');
                                    }
                                });
                                if (apply) {
                                    scope.$apply();
                                }
                            }
                        }
                        else {
                            jquery_1.$('.microbox-wrapper').remove();
                            jquery_1.$('button.microbox').remove();
                        }
                    }
                    setBox();
                    jquery_1.$(window).on('resize', function () { setBox(true); });
                    scope.$on("$destroy", function () {
                        jquery_1.$('body').find('button.microbox').remove();
                        jquery_1.$('body').find('.microbox-content').remove();
                    });
                };
            }
        };
    }]);
module.directive('subtitle', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attributes) {
            jquery_1.$('section.main').addClass('subtitle-push');
            scope.$on("$destroy", function () {
                jquery_1.$('section.main').removeClass('subtitle-push');
            });
        }
    };
});
module.directive('whereami', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attributes) {
            element.addClass('whereami');
            var current = jquery_1.$('nav.side-nav a.selected').text();
            jquery_1.$('body').on('whereami.update', function () {
                element.text(jquery_1.$('nav.side-nav a.selected').text());
            });
            element.text(current);
        }
    };
});
var checkToolDelay = (function () {
    var applyAllowed = true;
    return function checkApplication(scope) {
        if (applyAllowed) {
            applyAllowed = false;
            setTimeout(function () {
                scope.$apply();
                applyAllowed = true;
            }, 200);
        }
    };
}());
module.directive('checkTool', function () {
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            ngClick: '&',
            ngChange: '&',
        },
        template: '<div class="check-tool"><i class="check-status"></i></div>',
        link: function (scope, element, attributes) {
            element.on('click', function () {
                scope.ngModel = !scope.ngModel;
                checkToolDelay(scope);
                if (scope.ngModel) {
                    element.addClass('selected');
                }
                else {
                    element.removeClass('selected');
                }
                if (scope.ngClick) {
                    scope.ngClick();
                }
                if (scope.ngChange) {
                    scope.ngChange();
                }
                checkToolDelay(scope);
            });
            jquery_1.$('body').on('click', function (e) {
                if (jquery_1.$(e.target).parents('.check-tool, .toggle, .lightbox').length === 0 && e.target.nodeName !== "CHECK-TOOL" && jquery_1.$('body').find(e.target).length !== 0) {
                    scope.ngModel = false;
                    element.removeClass('selected');
                    checkToolDelay(scope);
                    if (scope.ngChange) {
                        scope.ngChange();
                        checkToolDelay(scope);
                    }
                }
            });
        }
    };
});
module.directive('subtitle', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attributes) {
            jquery_1.$('section.main').addClass('subtitle-push');
            scope.$on("$destroy", function () {
                jquery_1.$('section.main').removeClass('subtitle-push');
            });
        }
    };
});
module.directive('whereami', function () {
    //only on mailboxes
    return {
        restrict: 'A',
        scope: false,
        link: function (scope, element, attributes) {
            var current = jquery_1.$('nav.side-nav a.selected').text();
            jquery_1.$('body').on('whereami.update', function () {
                element.text(jquery_1.$('nav.side-nav a.selected').text());
            });
            element.text(current);
        }
    };
});
module.controller('Account', ['$scope', function ($scope) {
        $scope.nbNewMessages = 0;
        $scope.me = modelDefinitions_1.model.me;
        $scope.rand = Math.random();
        $scope.skin = entcore_1.skin;
        $scope.lang = idiom_1.idiom;
        $scope.refreshAvatar = function () {
            http_1.http().get('/userbook/api/person', {}, { requestName: "refreshAvatar" }).done(function (result) {
                $scope.avatar = result.result['0'].photo;
                if (!$scope.avatar || $scope.avatar === 'no-avatar.jpg' || $scope.avatar === 'no-avatar.svg') {
                    $scope.avatar = entcore_1.skin.basePath + '/img/illustrations/no-avatar.svg';
                }
                $scope.username = result.result['0'].displayName;
                modelDefinitions_1.model.me.profiles = result.result['0'].type;
                $scope.$apply();
            });
        };
        $scope.refreshMails = function () {
            http_1.http().get('/conversation/count/INBOX', { unread: true }).done(function (nbMessages) {
                $scope.nbNewMessages = nbMessages.count;
                $scope.$apply('nbNewMessages');
            });
        };
        $scope.openApps = function (event) {
            if (jquery_1.$(window).width() <= 700) {
                event.preventDefault();
            }
        };
        http_1.http().get('/directory/userbook/' + modelDefinitions_1.model.me.userId).done(function (data) {
            modelDefinitions_1.model.me.userbook = data;
            $scope.$apply('me');
        });
        entcore_1.skin.listThemes(function (themes) {
            $scope.themes = themes;
            $scope.$apply('themes');
        });
        $scope.$root.$on('refreshMails', $scope.refreshMails);
        $scope.refreshMails();
        $scope.refreshAvatar();
        $scope.currentURL = window.location.href;
    }]);
module.controller('Share', ['$rootScope', '$scope', function ($rootScope, $scope) {
        if (!$scope.appPrefix) {
            $scope.appPrefix = globals_1.appPrefix;
        }
        if ($scope.resources instanceof modelDefinitions_1.Model) {
            $scope.resources = [$scope.resources];
        }
        if (!($scope.resources instanceof Array)) {
            throw new TypeError('Resources in share panel must be instance of Model or Array');
        }
        $scope.sharing = {};
        $scope.found = [];
        $scope.maxResults = 5;
        $scope.editResources = [];
        $scope.sharingModel = {
            edited: []
        };
        $scope.addResults = function () {
            $scope.maxResults += 5;
        };
        var actionsConfiguration = {};
        http_1.http().get('/' + globals_1.infraPrefix + '/public/json/sharing-rights.json').done(function (config) {
            actionsConfiguration = config;
        });
        $scope.translate = idiom_1.idiom.translate;
        function actionToRights(item, action) {
            var actions = [];
            underscore_1._.where($scope.actions, { displayName: action.displayName }).forEach(function (item) {
                item.name.forEach(function (i) {
                    actions.push(i);
                });
            });
            return actions;
        }
        function rightsToActions(rights, http) {
            var actions = {};
            rights.forEach(function (right) {
                var action = underscore_1._.find($scope.actions, function (action) {
                    return action.name.indexOf(right) !== -1;
                });
                if (!action) {
                    return;
                }
                if (!actions[action.displayName]) {
                    actions[action.displayName] = true;
                }
            });
            return actions;
        }
        function setActions(actions) {
            $scope.actions = actions;
            $scope.actions.forEach(function (action) {
                var actionId = action.displayName.split('.')[1];
                if (actionsConfiguration[actionId]) {
                    action.priority = actionsConfiguration[actionId].priority;
                    action.requires = actionsConfiguration[actionId].requires;
                }
            });
        }
        function dropRights(callback) {
            function drop(resource, type) {
                var done = 0;
                for (var element in resource[type].checked) {
                    var path = '/' + $scope.appPrefix + '/share/remove/' + resource._id;
                    var data = {};
                    if (type === 'users') {
                        data.userId = element;
                    }
                    else {
                        data.groupId = element;
                    }
                    http_1.http().put(path, http_1.http().serialize(data));
                }
            }
            $scope.editResources.forEach(function (resource) {
                drop(resource, 'users');
                drop(resource, 'groups');
            });
            callback();
            $scope.varyingRights = false;
        }
        function differentRights(model1, model2) {
            var result = false;
            function different(type) {
                for (var element in model1[type].checked) {
                    if (!model2[type].checked[element]) {
                        return true;
                    }
                    model1[type].checked[element].forEach(function (right) {
                        result = result || model2[type].checked[element].indexOf(right) === -1;
                    });
                }
                return result;
            }
            return different('users') || different('groups');
        }
        var feedData = function () {
            var initModel = true;
            $scope.resources.forEach(function (resource) {
                var id = resource._id;
                http_1.http().get('/' + $scope.appPrefix + '/share/json/' + id).done(function (data) {
                    if (initModel) {
                        $scope.sharingModel = data;
                        $scope.sharingModel.edited = [];
                    }
                    data._id = resource._id;
                    $scope.editResources.push(data);
                    var editResource = $scope.editResources[$scope.editResources.length - 1];
                    if (!$scope.sharing.actions) {
                        setActions(data.actions);
                    }
                    function addToEdit(type) {
                        for (var element in editResource[type].checked) {
                            var rights = editResource[type].checked[element];
                            var groupActions = rightsToActions(rights);
                            var elementObj = underscore_1._.findWhere(editResource[type].visibles, {
                                id: element
                            });
                            if (elementObj) {
                                elementObj.actions = groupActions;
                                if (initModel) {
                                    $scope.sharingModel.edited.push(elementObj);
                                }
                                elementObj.index = $scope.sharingModel.edited.length;
                            }
                        }
                    }
                    addToEdit('groups');
                    addToEdit('users');
                    if (!initModel) {
                        if (differentRights(editResource, $scope.sharingModel) || differentRights($scope.sharingModel, editResource)) {
                            $scope.varyingRights = true;
                            $scope.sharingModel.edited = [];
                        }
                    }
                    initModel = false;
                    $scope.$apply('sharingModel.edited');
                });
            });
        };
        $scope.$watch('resources', function () {
            $scope.actions = [];
            $scope.sharingModel.edited = [];
            $scope.search = '';
            $scope.found = [];
            $scope.varyingRights = false;
            feedData();
        });
        $scope.$watchCollection('resources', function () {
            $scope.actions = [];
            $scope.sharingModel.edited = [];
            $scope.search = '';
            $scope.found = [];
            $scope.varyingRights = false;
            feedData();
        });
        $scope.addEdit = function (item) {
            item.actions = {};
            $scope.sharingModel.edited.push(item);
            item.index = $scope.sharingModel.edited.length;
            var addedIndex = $scope.found.indexOf(item);
            $scope.found.splice(addedIndex, 1);
            var defaultActions = [];
            $scope.actions.forEach(function (action) {
                var actionId = action.displayName.split('.')[1];
                if (actionsConfiguration[actionId].default) {
                    item.actions[action.displayName] = true;
                    defaultActions.push(action);
                }
            });
            var index = -1;
            var loopAction = function () {
                if (++index < defaultActions.length) {
                    $scope.saveRights(item, defaultActions[index], loopAction);
                }
            };
            loopAction();
        };
        $scope.findUserOrGroup = function () {
            var searchTerm = idiom_1.idiom.removeAccents($scope.search).toLowerCase();
            $scope.found = underscore_1._.union(underscore_1._.filter($scope.sharingModel.groups.visibles, function (group) {
                var testName = idiom_1.idiom.removeAccents(group.name).toLowerCase();
                return testName.indexOf(searchTerm) !== -1;
            }), underscore_1._.filter($scope.sharingModel.users.visibles, function (user) {
                var testName = idiom_1.idiom.removeAccents(user.lastName + ' ' + user.firstName).toLowerCase();
                var testNameReversed = idiom_1.idiom.removeAccents(user.firstName + ' ' + user.lastName).toLowerCase();
                return testName.indexOf(searchTerm) !== -1 || testNameReversed.indexOf(searchTerm) !== -1;
            }));
            $scope.found = underscore_1._.filter($scope.found, function (element) {
                return $scope.sharingModel.edited.indexOf(element) === -1;
            });
        };
        $scope.remove = function (element) {
            var data;
            if (element.login !== undefined) {
                data = {
                    userId: element.id
                };
            }
            else {
                data = {
                    groupId: element.id
                };
            }
            $scope.sharingModel.edited = underscore_1._.reject($scope.sharingModel.edited, function (item) {
                return item.id === element.id;
            });
            $scope.resources.forEach(function (resource) {
                var path = '/' + $scope.appPrefix + '/share/remove/' + resource._id;
                http_1.http().put(path, http_1.http().serialize(data)).done(function () {
                    $rootScope.$broadcast('share-updated', data);
                });
            });
        };
        $scope.maxEdit = 3;
        $scope.displayMore = function () {
            var displayMoreInc = 5;
            $scope.maxEdit += displayMoreInc;
        };
        function applyRights(element, action, cb) {
            var data;
            if (element.login !== undefined) {
                data = { userId: element.id, actions: [] };
            }
            else {
                data = { groupId: element.id, actions: [] };
            }
            data.actions = actionToRights(element, action);
            var setPath = 'json';
            if (!element.actions[action.displayName]) {
                setPath = 'remove';
                underscore_1._.filter($scope.actions, function (item) {
                    return underscore_1._.find(item.requires, function (dependency) {
                        return action.displayName.split('.')[1].indexOf(dependency) !== -1;
                    }) !== undefined;
                })
                    .forEach(function (item) {
                    if (item) {
                        element.actions[item.displayName] = false;
                        data.actions = data.actions.concat(actionToRights(element, item));
                    }
                });
            }
            else {
                action.requires.forEach(function (required) {
                    var action = underscore_1._.find($scope.actions, function (action) {
                        return action.displayName.split('.')[1].indexOf(required) !== -1;
                    });
                    if (action) {
                        element.actions[action.displayName] = true;
                        data.actions = data.actions.concat(actionToRights(element, action));
                    }
                });
            }
            var times = $scope.resources.length;
            var countdownAction = function () {
                if (--times <= 0 && typeof cb === 'function') {
                    cb();
                }
            };
            $scope.resources.forEach(function (resource) {
                http_1.http().put('/' + $scope.appPrefix + '/share/' + setPath + '/' + resource._id, http_1.http().serialize(data)).done(function () {
                    if (setPath === 'remove') {
                        $rootScope.$broadcast('share-updated', { removed: { groupId: data.groupId, userId: data.userId, actions: rightsToActions(data.actions) } });
                    }
                    else {
                        $rootScope.$broadcast('share-updated', { added: { groupId: data.groupId, userId: data.userId, actions: rightsToActions(data.actions) } });
                    }
                    countdownAction();
                });
            });
        }
        $scope.saveRights = function (element, action, cb) {
            if ($scope.varyingRights) {
                dropRights(function () {
                    applyRights(element, action, cb);
                });
            }
            else {
                applyRights(element, action, cb);
            }
        };
    }]);
module.controller('Admin', ['$scope', function ($scope) {
        $scope.urls = [];
        http_1.http().get('/admin-urls').done(function (urls) {
            $scope.urls = urls;
            $scope.$apply('urls');
        });
        $scope.getHighlight = function (url) {
            return window.location.href.indexOf(url.url) >= 0;
        };
        $scope.orderUrls = function (url) {
            return !$scope.getHighlight(url) ? 1 : 0;
        };
        $scope.filterUrls = function (url) {
            return !url.allowed || !(url.allowed instanceof Array) ? true : underscore_1._.find(modelDefinitions_1.model.me.functions, function (f) { return underscore_1._.contains(url.allowed, f.code); });
        };
        $scope.scrollUp = ui_1.ui.scrollToTop;
    }]);
jquery_1.$(document).ready(function () {
    setTimeout(function () {
        //routing
        if (globals_1.routes.routing) {
            module.config(globals_1.routes.routing);
        }
        lib_1.bootstrap(function () {
            entcore_1.RTE.addDirectives(module);
            if (window.entcore.ng.init) {
                window.entcore.ng.init(module);
            }
            modelDefinitions_1.model.build();
            idiom_1.idiom.addDirectives(module);
            function start() {
                idiom_1.idiom.addBundle('/i18n', function () {
                    idiom_1.idiom.addBundle('/' + globals_1.appPrefix + '/i18n', function () {
                        angular_1.angular.bootstrap(jquery_1.$('html'), ['app']);
                        modelDefinitions_1.model.trigger('bootstrap');
                        modelDefinitions_1.model.bootstrapped = true;
                        modelDefinitions_1.model.sync();
                    });
                });
            }
            http_1.http().get(entcore_1.skin.basePath + 'js/directives.js').done(function (d) {
                eval(d);
                if (typeof entcore_1.skin.addDirectives === 'function') {
                    entcore_1.skin.addDirectives(module, start);
                }
                else {
                    start();
                }
            })
                .error(function () {
                start();
            });
        });
    }, 10);
});
module.controller('SearchPortal', ['$scope', function ($scope) {
        $scope.launchSearch = function (event) {
            var words = $scope.mysearch;
            if (event != "link")
                event.stopPropagation();
            if ((event == "link" || event.keyCode == 13)) {
                words = (!words || words === '') ? ' ' : words;
                $scope.mysearch = "";
                window.location.href = '/searchengine#/' + words;
            }
        };
    }]);
module.controller('MediaLibrary', ['$scope', function ($scope) {
        if (!modelDefinitions_1.model.me) {
            return;
        }
        if (!modelDefinitions_1.model.mediaLibrary) {
            modelDefinitions_1.model.makeModels(entcore_1.workspace);
            modelDefinitions_1.model.mediaLibrary = new modelDefinitions_1.Model();
            modelDefinitions_1.model.mediaLibrary.myDocuments = new entcore_1.workspace.MyDocuments();
            modelDefinitions_1.model.mediaLibrary.sharedDocuments = new entcore_1.workspace.SharedDocuments();
            modelDefinitions_1.model.mediaLibrary.appDocuments = new entcore_1.workspace.AppDocuments();
            modelDefinitions_1.model.mediaLibrary.publicDocuments = new entcore_1.workspace.PublicDocuments();
        }
        $scope.myDocuments = modelDefinitions_1.model.mediaLibrary.myDocuments;
        $scope.display = {
            show: 'browse',
            search: '',
            limit: 12
        };
        $scope.show = function (tab) {
            $scope.display.show = tab;
            $scope.upload.loading = [];
        };
        $scope.showPath = function () {
            return '/' + globals_1.appPrefix + '/public/template/entcore/media-library-' + $scope.display.show + '.html';
        };
        $scope.listFrom = function (listName) {
            $scope.display.listFrom = listName;
            modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom].sync();
        };
        $scope.openFolder = function (folder) {
            if ($scope.openedFolder.closeFolder && folder.folder.indexOf($scope.openedFolder.folder + '_') === -1) {
                $scope.openedFolder.closeFolder();
            }
            $scope.openedFolder = folder;
            folder.sync();
            folder.on('sync', function () {
                $scope.documents = filteredDocuments(folder);
                $scope.folders = folder.folders.all;
                $scope.$apply('documents');
                $scope.$apply('folders');
            });
        };
        $scope.$watch('visibility', function (newVal) {
            if (modelDefinitions_1.model.me && modelDefinitions_1.model.me.workflow.workspace.create) {
                if ($scope.visibility === 'public') {
                    $scope.display.listFrom = 'publicDocuments';
                }
                else {
                    $scope.display.listFrom = 'appDocuments';
                }
            }
            else if (modelDefinitions_1.model.me && modelDefinitions_1.model.me.workflow.workspace.list) {
                $scope.display.listFrom = 'sharedDocuments';
            }
            modelDefinitions_1.model.mediaLibrary.on('myDocuments.sync, sharedDocuments.sync, appDocuments.sync, publicDocuments.sync', function () {
                $scope.documents = filteredDocuments(modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom]);
                if (modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom].folders) {
                    $scope.folders = modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom].folders.filter(function (folder) {
                        return idiom_1.idiom.removeAccents(folder.name.toLowerCase()).indexOf(idiom_1.idiom.removeAccents($scope.display.search.toLowerCase())) !== -1;
                    });
                    $scope.$apply('folders');
                }
                else {
                    delete ($scope.folders);
                }
                $scope.folder = modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom];
                $scope.openedFolder = $scope.folder;
                $scope.$apply('documents');
            });
            $scope.$watch('fileFormat', function (newVal) {
                if (!newVal) {
                    return;
                }
                if (newVal === 'audio') {
                    $scope.display.show = 'record';
                }
                else {
                    $scope.display.show = 'browse';
                }
                if (modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom].documents.length() === 0) {
                    modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom].sync();
                }
                else {
                    modelDefinitions_1.model.mediaLibrary[$scope.display.listFrom].trigger('sync');
                }
            });
        });
        function filteredDocuments(source) {
            return source.documents.filter(function (doc) {
                return (doc.role() === $scope.fileFormat || $scope.fileFormat === 'any') &&
                    idiom_1.idiom.removeAccents(doc.metadata.filename.toLowerCase()).indexOf(idiom_1.idiom.removeAccents($scope.display.search.toLowerCase())) !== -1;
            });
        }
        $scope.insertRecord = function () {
            modelDefinitions_1.model.mediaLibrary.appDocuments.documents.sync();
            $scope.display.show = 'browse';
            $scope.listFrom('appDocuments');
        };
        $scope.selectDocument = function (document) {
            if (($scope.folder === modelDefinitions_1.model.mediaLibrary.appDocuments && $scope.visibility === 'protected') ||
                ($scope.folder === modelDefinitions_1.model.mediaLibrary.publicDocuments && $scope.visibility === 'public')) {
                if ($scope.multiple) {
                    $scope.$parent.ngModel = [document];
                }
                else {
                    $scope.$parent.ngModel = document;
                }
            }
            else {
                var copyFn = document.protectedDuplicate;
                if ($scope.visibility === 'public') {
                    copyFn = document.publicDuplicate;
                }
                $scope.display.loading = [document];
                copyFn.call(document, function (newFile) {
                    $scope.display.loading = [];
                    if ($scope.multiple) {
                        $scope.$parent.ngModel = [newFile];
                        $scope.$parent.$apply('ngModel');
                    }
                    else {
                        $scope.$parent.ngModel = newFile;
                        $scope.$parent.$apply('ngModel');
                    }
                });
            }
        };
        $scope.selectDocuments = function () {
            var selectedDocuments = underscore_1._.where($scope.documents, { selected: true });
            if (($scope.folder === modelDefinitions_1.model.mediaLibrary.appDocuments && $scope.visibility === 'protected') ||
                ($scope.folder === modelDefinitions_1.model.mediaLibrary.publicDocuments && $scope.visibility === 'public')) {
                $scope.$parent.ngModel = selectedDocuments;
            }
            else {
                var duplicateDocuments = [];
                var documentsCount = 0;
                $scope.display.loading = selectedDocuments;
                selectedDocuments.forEach(function (doc) {
                    var copyFn = doc.protectedDuplicate.bind(doc);
                    if ($scope.visibility === 'public') {
                        copyFn = doc.publicDuplicate.bind(doc);
                    }
                    copyFn(function (newFile) {
                        $scope.display.loading = [];
                        duplicateDocuments.push(newFile);
                        documentsCount++;
                        if (documentsCount === selectedDocuments.length) {
                            $scope.$parent.ngModel = duplicateDocuments;
                            $scope.$parent.$apply('ngModel');
                        }
                    });
                });
            }
        };
        $scope.setFilesName = function () {
            $scope.upload.names = '';
            for (var i = 0; i < $scope.upload.files.length; i++) {
                if (i > 0) {
                    $scope.upload.names += ', ';
                }
                $scope.upload.names += $scope.upload.files[i].name;
            }
        };
        $scope.importFiles = function () {
            var waitNumber = $scope.upload.files.length;
            for (var i = 0; i < $scope.upload.files.length; i++) {
                $scope.upload.loading.push($scope.upload.files[i]);
                entcore_1.workspace.Document.prototype.upload($scope.upload.files[i], 'file-upload-' + $scope.upload.files[i].name + '-' + i, function () {
                    waitNumber--;
                    modelDefinitions_1.model.mediaLibrary.appDocuments.documents.sync();
                    if (!waitNumber) {
                        $scope.display.show = 'browse';
                        if ($scope.visibility === 'public') {
                            $scope.listFrom('publicDocuments');
                        }
                        else {
                            $scope.listFrom('appDocuments');
                        }
                    }
                    $scope.$apply('display');
                }, $scope.visibility);
            }
            $scope.upload.files = undefined;
            $scope.upload.names = '';
        };
        $scope.updateSearch = function () {
            $scope.documents = filteredDocuments($scope.openedFolder);
        };
    }]);
//# sourceMappingURL=ng-app.js.map