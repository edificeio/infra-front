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

import { $ } from './libs/jquery/jquery';
import { idiom as lang, idiom as idiom } from './idiom';
import { http, Http } from './http';
import { Collection, Model, model } from './modelDefinitions';
import { bootstrap } from './lib';
import { ui } from './ui';
import { Behaviours } from './behaviours';
import { currentLanguage, routes, appPrefix, infraPrefix } from './globals';
import { template } from './template';
import { moment, frLocales } from './libs/moment/moment';
import { _ } from './libs/underscore/underscore';
import { angular } from './libs/angular/angular';
import { notify, skin, RTE } from './entcore';
import { ng } from './ng-start';
import * as directives from './directives';

var module = angular.module('app', ['ngSanitize', 'ngRoute'], ['$interpolateProvider', function($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	}])
	.factory('route', ['$rootScope', '$route', '$routeParams', function($rootScope, $route, $routeParams){
		const routes = {};
		let currentAction = undefined;
		let currentParams = undefined;

		$rootScope.$on("$routeChangeSuccess", function($currentRoute, $previousRoute){
			if(routes[$route.current.action] instanceof Array &&
				(currentAction !== $route.current.action || (currentParams !== $route.current.params && !(Object.getOwnPropertyNames($route.current.params).length === 0)))){
				currentAction = $route.current.action;
				currentParams = $route.current.params;

				routes[$route.current.action].forEach(r => r($routeParams));
				setTimeout(function () {
				    ui.scrollToId(window.location.hash.split('#')[1]);
				}, 100);
			}
		});

		return function(setRoutes){
			for(let prop in setRoutes){
				if(!routes[prop]){
					routes[prop] = [];
				}
				routes[prop].push(setRoutes[prop]);
			}
		}
	}])
	.factory('model', ['$timeout', function($timeout){
		var fa = Collection.prototype.trigger;
		Collection.prototype.trigger = function(event){
			$timeout(function(){
				fa.call(this, event);
			}.bind(this), 10);
		};

		var fn = Model.prototype.trigger;
		Model.prototype.trigger = function(event, eventData){
			$timeout(function(){
				fn.call(this, event, eventData);
			}.bind(this), 10);
		};

		return model;
	}])
    .factory('xmlHelper', function(){
        return {
            xmlToJson: function(xml, accumulator, stripNamespaces, flatten) {
                var nodeName;
                var that = this;
                if (!accumulator)
                    accumulator = {};
                if (!stripNamespaces)
                    stripNamespaces = true;
                if(flatten == null)
                    flatten = true

                if (stripNamespaces && xml.nodeName.indexOf(":") > -1) {
                    nodeName = xml.nodeName.split(':')[1];
                } else {
                    nodeName = xml.nodeName;
                }
                if ($(xml).children().length > 0) {
                    if(!flatten)
                        accumulator[nodeName] = [];
                    else
                        accumulator[nodeName] = {};
                    _.each($(xml).children(), function(child) {
                        if(!flatten)
                            accumulator[nodeName].push(that.xmlToJson(child, {}, stripNamespaces, flatten));
                        else
                            return that.xmlToJson(child, accumulator[nodeName], stripNamespaces, flatten);
                    });
                } else {
                    accumulator[nodeName] = $(xml).text();
                }
                return accumulator;
            }
        }
    })
    .factory('httpWrapper', function(){
        return {
            wrap: function(name, fun, context){
                var scope = this
        		if(typeof fun !== "function")
        			return
        		if(typeof scope[name] !== "object")
        			scope[name] = {}
                if(scope[name].loading)
                    return
        		scope[name].loading = true

        		var args = []
        		for(var i = 3; i < arguments.length; i++)
        			args.push(arguments[i])

        		var completion = function(){
        			scope[name].loading = false
        			scope.$apply()
        		}

                var xhrReq
        		if(context){
        			xhrReq = fun.apply(context, args)
        		} else {
        			xhrReq =  fun.apply(scope, args)
        		}
                if(xhrReq && xhrReq.xhr)
                    xhrReq.xhr.complete(completion)
                else
                    completion()
        	}
        }
    });

//routing
if(routes.routing){
	module.config(['$routeProvider', routes.routing]);
}

for (let directive in directives) {
    ng.directives.push(directives[directive]);
}

//directives
module.directive('container', ['$timeout', function($timeout){
	return {
		restrict: 'E',
		scope: true,
		template: '<div ng-include="templateContainer"></div>',
		link: function(scope, element, attributes){
			scope.tpl = template;

			template.watch(attributes.template, function(){
				//use timeout to force reload template (like a scope.apply)
				$timeout(function(){
					scope.templateContainer = template.containers[attributes.template];
					if(scope.templateContainer === 'empty'){
						scope.templateContainer = undefined;
					}
				},0)
			});

			if(attributes.template){
				scope.templateContainer = template.containers[attributes.template];
			}
		}
	}
}]);

module.directive('colorSelect', function(){
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
		link: function(scope, element, attributes){
			scope.colors = ['orange', 'pink', 'purple', 'blue', 'green', 'black', 'white', 'transparent'];
			scope.setColor = function(color){
			    scope.ngModel = color;
			};

			element.find('.colors-opener').on('click', function(e){
				scope.pickColor = !scope.pickColor;
				scope.$apply('pickColor');
				e.stopPropagation();
				$('body, .main').one('click', function(){
					scope.pickColor = false;
					scope.$apply('pickColor');
				});
			});
		}
	}
});

module.directive('soundSelect', function(){
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
			'<div ng-if="display.userSelecting">' +
			'<media-library ' +
				'visibility="selectedFile.visibility"' +
				'ng-change="updateDocument()" ' +
				'ng-model="selectedFile.file" ' +
				'file-format="\'audio\'">' +
			'</media-library>' +
			'</div>' +
			'</lightbox>' +
			'</div>',
        link: function (scope, element, attributes) {
            scope.display = {};
			scope.selectedFile = { file: {}, visibility: 'protected'};

			scope.selectedFile.visibility = scope.$parent.$eval(attributes.visibility);
			if(!scope.selectedFile.visibility){
				scope.selectedFile.visibility = 'protected';
			}
			scope.selectedFile.visibility = scope.selectedFile.visibility.toLowerCase();

			scope.updateDocument = function(){
				scope.display.userSelecting = false;
				var path = '/workspace/document/';
				if(scope.selectedFile.visibility === 'public'){
					path = '/workspace/pub/document/'
				}
				scope.ngModel = path + scope.selectedFile.file._id;
				scope.$apply('ngModel');
				scope.ngChange();
			};
			element.on('click', 'audio', function(){
				scope.userSelecting = true;
				scope.$apply('userSelecting');
			});
		}
	}
});

module.directive('mediaSelect', function(){
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
						'<div ng-if="userSelecting">' +
							'<media-library ng-change="updateDocument()" ng-model="selectedFile.file" multiple="multiple" file-format="fileFormat" visibility="selectedFile.visibility"></media-library>' +
						'</div>' +
					'</lightbox>' +
				'</div>',
		compile: function(element, attributes){

			if(!attributes.mytooltip && attributes.tooltip){
				console.warn('tooltip attribute is deprecated on media-select tag, use mytooltip instead.');
				element.attr("mytooltip", attributes.tooltip);
				element.removeAttr('tooltip');
				attributes.mytooltip = attributes.tooltip;
				delete attributes.tooltip;
			}

			return function(scope, element, attributes){
			//link: function(scope, element, attributes){
				scope.selectedFile = { file: {}, visibility: 'protected' };
				scope.selectedFile.visibility = scope.$parent.$eval(attributes.visibility);
				if(!scope.selectedFile.visibility){
					scope.selectedFile.visibility = 'protected';
				}
				scope.selectedFile.visibility = scope.selectedFile.visibility.toLowerCase();

				if(!scope.mytooltip){
					element.find('input').removeAttr('tooltip');
				}

				attributes.$observe('label', function(newVal){
					element.find('[type=button]').attr('value', lang.translate(newVal));
				});

				scope.$watch('fileFormat', function(newVal){
					if(newVal === undefined){
						scope.fileFormat = 'img'
					}
				});
				scope.updateDocument = function(){
					scope.userSelecting = false;
					var path = '/workspace/document/';
					if(scope.selectedFile.visibility === 'public'){
						path = '/workspace/pub/document/'
					}
					scope.ngModel = path + scope.selectedFile.file._id;
					scope.$apply('ngModel');
					scope.ngChange();
				};
				element.find('.pick-file').on('click', function(){
					scope.userSelecting = true;
					scope.$apply('userSelecting');
				});
			}
		}
	}
});

module.directive('filesPicker', function(){
	return {
		restrict: 'E',
		transclude: true,
		replace: true,
		template: '<input type="button" ng-transclude />',
		scope: {
			ngChange: '&',
			ngModel: '='
		},
		link: function(scope, element, attributes){
			element.on('click', function(){
				var fileSelector = $('<input />', {
					type: 'file'
				})
					.hide()
					.appendTo('body');
				if(attributes.multiple !== undefined){
					fileSelector.attr('multiple', true);
				}

				fileSelector.on('change', function(){
					scope.ngModel = fileSelector[0].files;
					scope.$apply();
					scope.$eval(scope.ngChange);
					scope.$parent.$apply();
				});
				fileSelector.click();
				fileSelector.trigger('touchstart');
			});
		}
	}
})

module.directive('filesInputChange', function(){
	return {
		restrict: 'A',
		scope: {
			filesInputChange: '&',
			file: '=ngModel'
		},
		link: function($scope, $element){
			$element.bind('change', function(){
				$scope.file = $element[0].files;
				$scope.$apply();
				$scope.filesInputChange();
				$scope.$apply();
			})
		}
	}
})

module.directive('iconsSelect', function() {
	return {
		restrict: 'E',
		scope:{
			options: '=',
			class: '@',
			current: '=',
			change: '&'
		},
		link: function(scope, element, attributes){
			var current;
			scope.separateIcon = attributes.hasOwnProperty('separateIcon');

			var updateCurrent = function() {
				scope.current.id = current.id;
				scope.current.icon = current.icon;
				scope.current.text = current.text;
			};

			scope.$watch('options', function() {
				if (scope.options && scope.options.length) {
					current = _.findWhere(scope.options, {
						id: scope.current.id
					});
					updateCurrent();
		
					element.bind('change', function(){
						current = _.findWhere(scope.options, {
							id: element.find('.current').data('selected')
						});
						updateCurrent();
						scope.$eval(scope.change); 
						scope.$apply();
					});
				}
			}, true);
		},
		template: `
			<div ng-class="{'drop-down-block': !separateIcon}">
				<div ng-if="separateIcon" class="current fixed cell twelve" data-selected="[[current.id]]">
					<i class="[[current.icon]]"></i>
					<span translate content="[[current.text]]"></span>
				</div>
				<article ng-if="!separateIcon" class="current cell twelve medium-block-container" data-selected="[[current.id]]">
					<div class="flex-row drop-down-label no-margin no-border">
						<i class="arrow no-margin right-spacing"></i>
						<i class="[[current.icon]] cell no-2d no-margin right-spacing-twice"></i>
						<i class="[[current.icon === 'default' ? 'none' : current.icon]] cell no-1d no-margin right-spacing-twice"></i>
						<h2 class="top-spacing-twice cell-ellipsis"><a translate content="[[current.text]]"></a></h2>
					</div>
				</article>
				<div class="options-list icons-view">
				<div class="wrapper">
					<div class="cell three option" data-value="[[option.id]]" data-ng-repeat="option in options">
						<i class="[[option.icon]] no-2d"></i>
						<i class="[[option.icon === 'default' ? 'none' : option.icon]] no-1d"></i>
						<span translate content="[[option.text]]"></span>
					</div>
				</div>
			</div>
		`
	};
});

module.directive('preview', function(){
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
		link: function($scope, $element, $attributes){
				$scope.$watch('content', function(newValue){
					var fragment = $(newValue);
					$element.find('.image').html(fragment.find('img').first());

					var paragraph = _.find(fragment.find('p'), function(node){
						return $(node).text().length > 0;
					});
					$element.find('.paragraph').text($(paragraph).text());
				})
			}
		}
});

module.directive('portal', function(){
	return {
		restrict: 'E',
		transclude: true,
		templateUrl: skin.portalTemplate,
		compile: function(element, attributes, transclude){
			element.find('[logout]').attr('href', '/auth/logout?callback=' + skin.logoutCallback);
			ui.setStyle(skin.theme);
			Http.prototype.bind('disconnected', function(){
				window.location.href = '/';
			})
			return function postLink( scope, element, attributes, controller, transcludeFn ) {
				scope.template = template;
			};
		}
	}
});

module.directive('adminPortal', function(){
	skin.skin = 'admin';
	skin.theme = '/public/admin/default/';
	return {
		restrict: 'E',
		transclude: true,
		templateUrl: '/public/admin/portal.html',
		compile: function(element, attributes, transclude){
			$('[logout]').attr('href', '/auth/logout?callback=' + skin.logoutCallback);
			http().get('/userbook/preference/admin').done(function(data){
				var theme = data.preference ? JSON.parse(data.preference) : null

				if(!theme || !theme.path)
					ui.setStyle(skin.theme)
				else{
					ui.setStyle('/public/admin/'+theme.path+'/')
				}
			}).error(function(error){
				ui.setStyle(skin.theme)
			})
		}
	}
});

module.directive('portalStyles', function(){
	return {
		restrict: 'E',
		compile: function(element, attributes){
			$('[logout]').attr('href', '/auth/logout?callback=' + skin.logoutCallback);
			ui.setStyle(skin.theme);
		}
	}
});

module.directive('defaultStyles', function(){
	return {
		restrict: 'E',
		link: function(scope, element, attributes){
			ui.setStyle(skin.theme);
		}
	}
});

module.directive('skinSrc', function(){
	return {
		restrict: 'A',
		scope: '&',
		link: function($scope, $element, $attributes){
			if(!$('#theme').attr('href')){
				return;
			}
			var path = skin.basePath;
			$attributes.$observe('skinSrc', function(){
				if($attributes.skinSrc.indexOf('http://') === -1 && $attributes.skinSrc.indexOf('https://') === -1 && $attributes.skinSrc.indexOf('/workspace/') === -1){
					$element.attr('src', path + $attributes.skinSrc);
				}
				else{
					$element.attr('src', $attributes.skinSrc);
				}
			});

		}
	}
});

module.directive('defaultSrc', function(){
	return {
		restrict: 'A',
		scope: '&',
		link: function($scope, $element, $attributes){
			$element.bind('error', function(){
				if($attributes.defaultSrc != undefined){
					if($attributes.defaultSrc.indexOf('http://') === -1 && $attributes.defaultSrc.indexOf('https://') === -1 && $attributes.defaultSrc.indexOf('/workspace/') === -1){
						$element.attr('src', skin.basePath + $attributes.defaultSrc);
					}
					else{
						$element.attr('src', $attributes.defaultSrc);
					}
					$attributes.defaultSrc = undefined;
				}
			})
		}
	}
});

module.directive('localizedClass', function(){
	return {
		restrict: 'A',
		link: function($scope, $attributes, $element){
			$element.$addClass(currentLanguage);
		}
	}
});

module.directive('pullDownMenu', function(){
	return {
		restrict: 'E',
		transclude: true,
		template: '<div class="pull-down-menu hide" ng-transclude></div>',
		controller: function($scope){
		}
	}
});

module.directive('pullDownOpener', function(){
	return {
		restrict: 'E',
		require: '^pullDownMenu',
		transclude: true,
		template: '<div class="pull-down-opener" ng-transclude></div>',
		link: function(scope, element, attributes){
			element.find('.pull-down-opener').on('click', function(){
				var container = element.parents('.pull-down-menu');
				if(container.hasClass('hide')){
					setTimeout(function(){
						$('body').on('click.pulldown', function(){
							container.addClass('hide');
							$('body').unbind('click.pulldown');
						});
					}, 0);
					container.removeClass('hide');

				}
				else{
					$('body').unbind('click.pulldown');
					container.addClass('hide');
				}
			});
		}
	}
});

module.directive('pullDownContent', function(){
	return {
		restrict: 'E',
		require: '^pullDownMenu',
		transclude: true,
		template: '<div class="wrapper"><div class="arrow"></div><div class="pull-down-content" ng-transclude></div></div>',
		link: function(scope, element, attributes){
		}
	}
});

module.directive('topNotification', function(){
    return {
		restrict: 'E',
		template:
            '<div class="notify-top">'+
                '<div class="notify-top-content" ng-bind-html="content"></div>'+
                '<div class="notify-top-actions">'+
                    '<span ng-click="cancel()">[[doConfirm ? labels().cancel : labels().ok]]</span>'+
                    '<span ng-click="ok()" ng-show="doConfirm">[[labels().confirm]]</span> '+
                '</div>'+
            '</div>',
        scope: {
            trigger: '=',
            confirm: '=',
            content: '=',
            labels: '&'
        },
		link: function(scope, element, attributes){
            element.css('display', 'none')
            scope.doConfirm = false
            scope.cancel = function(){
                scope.trigger = false
            }
            scope.ok = function(){
                scope.trigger = false
                scope.confirm()
            }
            if(!scope.labels()){
                scope.labels = function(){
                    return {
                        confirm: lang.translate('confirm'),
                        cancel: lang.translate('cancel'),
                        ok: lang.translate('ok')
                    }
                }
            }
            scope.$watch('trigger', function(newVal){
                if(newVal)
                    element.slideDown()
                else
                    element.slideUp()
            });
            scope.$watch('confirm', function(newVal){
                scope.doConfirm = newVal ? true : false
            })
		}
	}
});

module.directive('dropDownButton', function(){
	return {
		restrict: 'E',
		transclude: 'true',
		controller: ['$scope', function($scope){
		}],
		template: '<div class="drop-down-button hidden"><div ng-transclude></div></div>',
		link: function(scope, element, attributes){
			element.on('click', '.opener', function(){
				element.find('.drop-down-button').removeClass('hidden');
				$(document).one('mousedown', function(e){
					setTimeout(function() {
						element.find('.drop-down-button').addClass('hidden');
					}, 200);
				});
			});
		}
	}
});

module.directive('opts', function(){
	return {
		restrict: 'E',
		require: '^dropDownButton',
		transclude: true,
		template: '<div class="options"><ul ng-transclude></ul></div>',
		link: function(scope, element, attributes){
			element.on('click', 'li', function(){
				element.parents('.drop-down-button').addClass('hidden');
			});
		}
	}
});

module.directive('loadingIcon', function(){
	return {
		restrict: 'E',
		link: function($scope, $element, $attributes){
			var addImage = function(){
                if($('#theme').length === 0)
                    return;
				var loadingIllustrationPath = skin.basePath + '/img/icons/anim_loading_small.gif';
				$('<img>')
					.attr('src', loadingIllustrationPath)
					.attr('class', $attributes.class)
					.addClass('loading-icon')
					.appendTo($element);
			};
			if($attributes.default=== 'loading'){
				addImage();
			}
			http().bind('request-started.' + $attributes.request, function(e){
				$element.find('img').remove();
				addImage();
			});

            if($attributes.onlyLoadingIcon === undefined){
    			http().bind('request-ended.' + $attributes.request, function(e){
    				var loadingDonePath = skin.basePath + '/img/icons/checkbox-checked.png';
    				$element.find('.loading-icon').remove();
    				$('<img>')
    					.attr('src', loadingDonePath)
    					.appendTo($element);
    			});
            } else {
                http().bind('request-ended.' + $attributes.request, function(e){
                    $element.find('img').remove();
                })
            }
		}
	}
})

module.directive('loadingPanel', function(){
	return {
		restrict: 'A',
		link: function($scope, $element, $attributes){
			$attributes.$observe('loadingPanel', function(val) {
				http().bind('request-started.' + $attributes.loadingPanel, function(e){
					var loadingIllustrationPath = skin.basePath + '/img/illustrations/loading.gif';
					if($element.children('.loading-panel').length === 0){
						$element.append('<div class="loading-panel">' +
							'<h1>' + lang.translate('loading') + '</h1>' +
							'<img src="' + loadingIllustrationPath + '" />' +
							'</div>');
					}

				})
				http().bind('request-ended.' + $attributes.loadingPanel, function(e){
					$element.find('.loading-panel').remove();
				})
			});
		}
	}
});

module.directive('behaviour', function(){
	return {
		restrict: 'E',
		template: '<div ng-transclude></div>',
		replace: false,
		transclude: true,
		scope: {
			resource: '='
		},
		link: function($scope, $element, $attributes){
			console.error('This directive is deprecated. Please use "authorize" instead.');
			if(!$attributes.name){
				throw "Behaviour name is required";
			}
			var content = $element.children('div');
			$scope.$watch('resource', function(newVal){
				var hide = ($scope.resource instanceof Array && _.find($scope.resource, function(resource){ return !resource.myRights || resource.myRights[$attributes.name] === undefined; }) !== undefined) ||
					($scope.resource instanceof Model && (!$scope.resource.myRights || $scope.resource.myRights[$attributes.name] === undefined));

				if(hide){
					content.hide();
				}
				else{
					content.show();
				}

			});
		}
	}
});

module.directive('authorize', function(){
	return {
		restrict: 'EA',
		link: function(scope, element, attributes){
			if(attributes.name === undefined && attributes.authorize === undefined){
				throw "Right name is required";
			}
			var content = element.children('div');

			var switchHide = function(){
				var resource = scope.$eval(attributes.resource);
				var name = attributes.name || attributes.authorize;
				var hide = name && (resource instanceof Array && _.find(resource, function(resource){ return !resource.myRights || resource.myRights[name] === undefined; }) !== undefined) ||
					(resource instanceof Model && (!resource.myRights || resource.myRights[name] === undefined));

				if(hide){
					content.remove();
					element.hide();
				}
				else{
					element.append(content);
					element.show();
				}
			};

			attributes.$observe('name', switchHide);
			attributes.$observe('authorize', switchHide);
			scope.$watch(function(){ return scope.$eval(attributes.resource); }, switchHide);
		}
	}
});

module.directive('drawingZone', function(){
	return function($scope, $element, $attributes){
		$element.addClass('drawing-zone');
	};
});

module.directive('resizable', function(){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){

			ui.extendElement.resizable(element, {
				lock: {
					horizontal: element.attr('horizontal-resize-lock'),
					vertical: element.attr('vertical-resize-lock')
				}
			});
		}
	}
});

module.directive('draggable', function(){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
			if(attributes.draggable == 'false' || attributes.native !== undefined){
				return;
			}
			ui.extendElement.draggable(element, {
				mouseUp: function(){
					element.on('click', function(){
						scope.$parent.$eval(attributes.ngClick);
					});
				}
			});
		}
	}
});

module.directive('progressBar', function(){
	return {
		restrict: 'E',
		scope: {
			max: '=',
			filled: '=',
			unit: '@'
		},
		template: '<div class="progress-bar">' +
			'<div class="filled" ng-style="{width: filledPercent + \'%\'}">[[filled]] <span translate content="[[unit]]"></span></div>[[max]] <span translate content="[[unit]]"></span>' +
			'</div>',
		link: function(scope, element, attributes){
			scope.filledPercent = 0;

			function updateBar(){
				scope.filledPercent = scope.filled * 100 / scope.max;

				if(scope.filledPercent < 10){
					element.find('.filled').addClass('small');
				}
				else{
					element.find('.filled').removeClass('small');
				}
			}

			scope.$watch('filled', function(newVal){
				updateBar();
			});

			scope.$watch('max', function(newVal){
				updateBar();
			});
		}
	}
});

module.directive('datePicker', ['$compile','$timeout',function($compile, $timeout){
	return {
		scope: {
			minDate: '=',
			ngModel: '=',
			ngChange: '&'
		},
		transclude: true,
		replace: true,
		restrict: 'E',
		template: '<input ng-transclude type="text" data-date-format="dd/mm/yyyy" ng-readonly="isreadonly" />',
		link: function(scope, element, attributes){
			scope.isreadonly = !!attributes.readonly;
			scope.$watch('ngModel', function(newVal){
				//parse strictly
				const parsed = moment(scope.ngModel,["DD/MM/YYYY","YYYY-MM-DD","YYYY-MM-DD[T]HH:mm:ss.SSS[Z]","YYYY-MM-DD[T]HH:mm:ss.SSS"],true);
				const formatted = parsed.format("DD/MM/YYYY");
				//change date only if value match format (when typing the value does not match)
				if(parsed.isValid()){
					element.val(formatted);
                	if(element.datepicker)
						element.datepicker('setValue', formatted);
				}
			});

			if(scope.minDate){
				scope.$watch('minDate', function(newVal){
					setNewDate();
				});
			}

			function setNewDate(){
				const minDate = scope.minDate;
				const dateStr = element.val();
				const parsed = moment(dateStr,["DD/MM/YYYY","YYYY-MM-DD"],true);
				//update model only if valid
				if(parsed.isValid()){
					scope.ngModel = parsed.toDate();
	
					if(scope.ngModel < minDate){
						scope.ngModel = minDate;
						element.val(moment(minDate).format('DD/MM/YYYY'));
					}
	
					$timeout(function() {
						scope.$apply('ngModel');
						scope.$parent.$eval(scope.ngChange);
						scope.$parent.$apply();
					});
				}
			}

			http().loadScript('/' + infraPrefix + '/public/js/bootstrap-datepicker.js').then(function(){
				element.datepicker({
						dates: {
							months: moment.months(),
							monthsShort: moment.monthsShort(),
							days: moment.weekdays(),
							daysShort: moment.weekdaysShort(),
							daysMin: moment.weekdaysMin()
						},
						weekStart: 1
					})
					.on('changeDate', function(){
						setTimeout(setNewDate, 10);

						$(this).datepicker('hide');
					});
				element.datepicker('hide');
			});

			var hideFunction = function(e){
				if(e.originalEvent && (element[0] === e.originalEvent.target || $('.datepicker').find(e.originalEvent.target).length !== 0)){
					return;
				}
				element.datepicker('hide');
			};
			$('body, lightbox').on('click', hideFunction);
			$('body, lightbox').on('focusin', hideFunction);

			element.on('focus', function(){
				var that = this;
				$(this).parents('form').on('submit', function(){
					$(that).datepicker('hide');
				});
				element.datepicker('show');
			});
			
			element.on('change', setNewDate);

			element.on('$destroy', function(){
				if(element.datepicker){
					element.datepicker('hide');
				}
			});
		}
	}
}]);

module.directive('datePickerIcon', function(){
	return {
		scope: {
			ngModel: '=',
			ngChange: '&'
		},
		replace: true,
		restrict: 'E',
		template: '<div class="date-picker-icon"> <input type="text" class="hiddendatepickerform" style="visibility: hidden; width: 0px; height: 0px; float: inherit" data-date-format="dd/mm/yyyy"/> <a ng-click="openDatepicker()"><i class="calendar"/></a> </div>',
		link: function($scope, $element, $attributes){
			http().loadScript('/' + infraPrefix + '/public/js/bootstrap-datepicker.js').then(() => {
				var input_element   = $element.find('.hiddendatepickerform')
				input_element.value = moment(new Date()).format('DD/MM/YYYY')

				input_element.datepicker({
					dates: {
						months: moment.months(),
						monthsShort: moment.monthsShort(),
						days: moment.weekdays(),
						daysShort: moment.weekdaysShort(),
						daysMin: moment.weekdaysMin()
					},
					weekStart: 1
				})
				.on('changeDate', function(event){
					$scope.ngModel = event.date
					$scope.$apply('ngModel')
					$(this).datepicker('hide');
					if(typeof $scope.ngChange === 'function'){
						$scope.ngChange();
					}
				});

				input_element.datepicker('hide')

				$scope.openDatepicker = function(){
					input_element.datepicker('show')
				}
			});
		}
	}
});

module.directive('filters', function(){
	return {
		restrict: 'E',
		template: '<div class="row line filters">' +
			'<div class="filters-icons">' +
					'<ul ng-transclude>' +
					'</ul></div>' +
				'</div><div class="row"></div> ',
		transclude: true,
		link: function(scope, element, attributes){
		}
	}
});

module.directive('alphabetical', ['$parse', function($parse){
	return {
		restrict: 'E',
		controller: ['$scope', function($scope){
			$scope.letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];
			$scope.matchingElements = {};
			$scope.matching = function(letter){
				return function(element){
					return element[$scope.title][0].toUpperCase() === letter || (letter === '#' && element[$scope.title][0].toLowerCase() === element[$scope.title][0].toUpperCase());
				}
			};

			$scope.updateElements = function(){
				$scope.letters.forEach(function(letter){
					$scope.matchingElements[letter] = _.filter($scope.collection($scope), function(element){
						return element[$scope.title][0].toUpperCase() === letter || (letter === '#' && element[$scope.title][0].toLowerCase() === element[$scope.title][0].toUpperCase());
					});
				});
			};

			if(!$scope.display){
				$scope.display = {};
			}
			$scope.display.pickLetter;
		}],
		compile: function(element, attributes){
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
			return function(scope, element, attributes){
				scope.title = attributes.title || 'title';
				element.removeAttr('title');
				scope.collection = $parse(collection);
				scope.$watchCollection(collection, function(newVal){
					scope.updateElements();
				});
				scope.updateElements();
				scope.viewLetter = function(letter){
					document.getElementById('alphabetical-' + letter).scrollIntoView();
					scope.display.pickLetter = false;
				};
			}
		}
	}
}]);

module.directive('completeClick', ['$parse', function($parse){
	return {
		compile: function(selement, attributes){
			var fn = $parse(attributes.completeClick);
			return function(scope, element, attributes) {
				element.on('click', function(event) {
					scope.$apply(function() {
						fn(scope, {$event:event});
					});
				});
			};
		}
	}
}]);

module.directive('dragstart', ['$parse', function($parse){
    return {
        restrict: 'A',
        link: function(scope, element, attributes){
			var dragStartFn = $parse(attributes.dragstart);
			var ngModel = $parse(attributes.ngModel);
            if(attributes.dragcondition !== undefined && scope.$eval(attributes.dragcondition) === false){
                element.attr("draggable", "false");
                return
            }

            element.attr("draggable", "true");
            element.attr("native", "");

            element.on("dragstart", function(event){
				if(ngModel && ngModel(scope)){
					try{
						event.originalEvent.dataTransfer.setData('application/json', JSON.stringify(ngModel(scope)));
					} catch(e) {
						event.originalEvent.dataTransfer.setData('Text', JSON.stringify(ngModel(scope)));
					}
				}
				if(attributes.dragstart === ''){

					return;
				}
                dragStartFn(scope, { $originalEvent: event.originalEvent });
            });

            element.on('$destroy', function() {
                element.off()
            })
        }
    }
}])


module.directive('dragend', ['$parse', function($parse){
    return {
        restrict: 'A',
        link: function(scope, element, attributes){
			const dragEndFn = $parse(attributes.dragend);
            element.on("dragend", function(event){
				if(attributes.dragend === ''){
					return;
				}
                dragEndFn(scope, { $originalEvent: event.originalEvent });
            });

            element.on('$destroy', function() {
                element.off()
            })
        }
    }
}])

module.directive('dragdrop', ['$parse', function($parse){
    return {
        restrict: 'A',
        link: function(scope, element, attributes){
			var dropFn = $parse(attributes.dragdrop);
			var dropConditionFn = $parse(attributes.dropcondition);
            element.on("dragover", function(event){
                if(attributes.dropcondition === undefined || dropConditionFn(scope, { $originalEvent: event.originalEvent })){
                   event.preventDefault();
                   event.stopPropagation();
				   scope.$eval(attributes.onDragover);
                   element.addClass("droptarget")
                }
            });

            element.on("dragleave", function(event){
                event.preventDefault();
                event.stopPropagation();
                element.removeClass("droptarget");
            });

            element.on("drop", function(event){
				event.originalEvent.preventDefault();
                element.removeClass("droptarget");
				var item;
				try{
					item = JSON.parse(event.originalEvent.dataTransfer.getData('application/json'));
				}
				catch(e){
					item = JSON.parse(event.originalEvent.dataTransfer.getData('Text'));
				}
				dropFn(scope, { $originalEvent: event.originalEvent, $item: item });
            });

            element.on('$destroy', function() {
                element.off()
            });
        }
    }
}]);

module.directive('dropFiles', ['$parse', function($parse){
	return {
		link: function(scope, element, attributes){
			var ngModel = $parse(attributes.dropFiles);
			element.on('dragover', function(e){
				e.preventDefault();
				scope.$eval(attributes.onDrag);
				element.addClass('droptarget');
			});

			element.on('dragleave', function(e){
				e.preventDefault();
				scope.$eval(attributes.onLeave);
				element.removeClass('droptarget');
			});

			element.on('drop', function(e){
				e.preventDefault();
				ngModel.assign(scope, e.originalEvent.dataTransfer.files);
				scope.$eval(attributes.onDrop);
				scope.$apply();
				element.removeClass('droptarget');
			});
		}
	}
}]);

module.directive('attachments', ['$parse', function($parse){
	return {
		scope: true,
		restrict: 'E',
		templateUrl: '/' + appPrefix + '/public/template/entcore/attachments.html',
		controller: ['$scope', function($scope){
			$scope.linker = {
				resource: {}
			}
			$scope.attachments = {
				me: model.me,
				display: {
					search: { text: '', application: {} },
					pickFile: false
				},
				addAttachment: function(resource){
					resource.provider = $scope.attachments.display.search.application;
					if($scope.ngModel($scope) instanceof Array){
						$scope.ngModel($scope).push(resource);
					}
					else{
						$scope.ngModel.assign($scope, [resource]);
					}
					$scope.attachments.display.pickFile = false;
				},
				removeAttachment: function(resource){
					$scope.ngModel.assign($scope, _.reject($scope.ngModel($scope), function(item){
						return item === resource;
					}));
				},
				attachmentsList: function(){
					$scope.list = $scope.ngModel($scope);
					return $scope.list;
				}
			};
		}],
		link: function(scope, element, attributes){
			scope.ngModel = $parse(attributes.ngModel);
			scope.attachments.onChange = function(){
				scope.$eval(attributes.onChange);
			};
			scope.apps = scope.$eval(attributes.apps);
			scope.$watch(
				function(){
					return scope.attachments.display.pickFile
				},
				function(newVal){
					if(newVal){
						scope.attachments.loadApplicationResources(function(){
							scope.attachments.searchApplication();
							scope.attachments.display.search.text = ' ';
							scope.$apply('attachments');
						});
					}
					else{
						scope.attachments.display.search.text = '';
					}
				},
				true
			);

			http().get('/resources-applications').done(function(apps){
				scope.attachments.apps = _.filter(model.me.apps, function(app){
					return _.find(apps, function(match){
						return app.address.indexOf(match) !== -1 && app.icon
					}) && _.find(scope.apps, function(match){
						return app.address.indexOf(match) !== -1
					});
				});

				scope.attachments.display.search.application = scope.attachments.apps[0];
				scope.attachments.loadApplicationResources(function(){});

				scope.$apply('attachments');
			});

			scope.attachments.loadApplicationResources = function(cb){
				if(!cb){
					cb = function(){
						scope.attachments.display.searchApplication();
						scope.$apply('attachments');
					};
				}

				var split = scope.attachments.display.search.application.address.split('/');
				scope.prefix = split[split.length - 1];

				Behaviours.loadBehaviours(scope.prefix, function(appBehaviour){
					appBehaviour.loadResources(cb);
					scope.attachments.addResource = appBehaviour.create;
				});
			};

			scope.attachments.searchApplication = function(){
				var split = scope.attachments.display.search.application.address.split('/');
				scope.prefix = split[split.length - 1];

				Behaviours.loadBehaviours(scope.prefix, function(appBehaviour){
					scope.attachments.resources = _.filter(appBehaviour.resources, function(resource) {
						return scope.attachments.display.search.text !== '' && (lang.removeAccents(resource.title.toLowerCase()).indexOf(lang.removeAccents(scope.attachments.display.search.text).toLowerCase()) !== -1 ||
							resource._id === scope.attachments.display.search.text);
					});
				});
			};

			scope.linker.createResource = function(){
				var split = scope.attachments.display.search.application.address.split('/');
				var prefix = split[split.length - 1];

				Behaviours.loadBehaviours(prefix, function(appBehaviour){
					appBehaviour.create(scope.linker.resource, function(resources, newResource){
						if(!(scope.ngModel(scope) instanceof Array)){
							scope.ngModel.assign(scope, []);
						}
						scope.attachments.display.pickFile = false;
						var resource = _.find(resources, function(resource){
							return resource._id === newResource._id;
						})
						resource.provider = scope.attachments.display.search.application;
						scope.ngModel(scope).push(resource);
						scope.$apply();
					});
				});
			};
		}
	}
}]);

module.directive('ngTouchstart', function(){
	return {
		restrict: 'A',
		scope: true,
		link: function(scope, element, attributes){
			element.on('touchstart', function(){
				scope.$eval(attributes['ngTouchstart']);
			});

			if(attributes['ngTouchend']){
				$('body').on('touchend', function(){
					scope.$eval(attributes['ngTouchend']);
				});
			}
		}
	}
})

module.directive('sidePanel', function(){
	return{
		restrict: 'E',
		transclude: true,
		template: '<div class="opener"></div>' +
		'<div class="toggle">' +
			'<div class="content" ng-transclude></div>' +
		'</div>',
		link: function(scope, element, attributes){
			element.addClass('hidden');
			element.children('.opener').on('click', function(e){
				if(!element.hasClass('hidden')){
					return;
				}
				element.removeClass('hidden');
				setTimeout(function(){
					$('body').on('click.switch-side-panel', function(e){
						if(!(element.children('.toggle').find(e.originalEvent.target).length)){
							element.addClass('hidden');
							$('body').off('click.switch-side-panel');
						}
					});
				}, 0);
			});
		}
	};
});

module.directive('plus', function(){
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
		link: function(scope, element, attributes){
			element.children('.toggle-buttons').addClass('hide');
			element.children('.opener').addClass('plus');
			element.children('.opener').on('click', function(e) {
				if(!element.children('.toggle-buttons').hasClass('hide')){
					return;
				}
				element.children('.toggle-buttons').removeClass('hide');
				element.children('.opener').removeClass('plus').addClass('minus');
				setTimeout(function(){
					$('body').on('click.switch-plus-buttons', function(e){
						//if(!(element.children('.toggle-buttons').find(e.originalEvent.target).length)){
							element.children('.toggle-buttons').addClass('hide');
							element.children('.opener').removeClass('minus').addClass('plus');
							$('body').off('click.switch-plus-buttons');
						//}
					});
				}, 0);
			});
		}
	}
});

module.directive('help', function(){
	var helpText;
	return {
		restrict: 'E',
		scope: {},
		template: '<i class="navbar-help" ></i>' +
		'<lightbox show="display.read" on-close="display.read = false"><div></div></lightbox>',
		link: async function(scope, element){
			let helpPath = await skin.getHelpPath();
			scope.display = {};
			scope.helpPath = helpPath + '/application/' + appPrefix + '/';
			if(appPrefix === '.' && window.location.pathname !== '/adapter') {
				scope.helpPath = helpPath + '/application/portal/';
			}
			else if(window.location.pathname === '/adapter'){
				scope.helpPath = helpPath + '/application/' + window.location.search.split('eliot=')[1].split('&')[0] + '/'
			}
			else if (window.location.pathname.includes("/directory/class-admin")){
				scope.helpPath = helpPath + '/application/parametrage-de-la-classe/';
			}

			var helpContent;

			var setHtml = function(content){
				helpContent = $('<div>' + content + '</div>');
				// Swap ToC and introduction paragraphs
				helpContent.find('> p').prev().insertAfter(helpContent.find('> p'));
				helpContent.find('img').each(function(index, item){
                    $(item).attr('src', scope.helpPath + "../.." + $(item).attr('src'));
				});
				element.find('div.content > div[ng-transclude]').html(helpContent.html());
				element.find('li a').on('click', function(e){
					element.find('.section').slideUp();
                    $('div#' + $(e.target).attr('href').split('#')[1]).slideDown();
				});
				element.find('div.paragraph a').on('click', function(e){
					window.open($(e.target).closest('a').attr('href'), "_newtab" ); 
				});
				element.find('li a').first().click();
				scope.display.read = true;
				scope.$apply('display');
			};

			element.children('i.navbar-help').on('click', function () {
			    if (helpText) {
			        setHtml(helpText);
			    }
			    else {
			        http().get(scope.helpPath)
                        .done(function (content) {
                            helpText = content;
                            setHtml(helpText);
                        })
                        .e404(function () {
                            helpText = '<h2>' + lang.translate('help.notfound.title') + '</h2><p>' + lang.translate('help.notfound.text') + '</p>';
                            setHtml(helpText);
                        });
			    }
			});
		}
	}
});

module.directive('stickToTop', function() {
    return {
        restrict: 'EA',
        link: function(scope, element, attributes) {
			if ("noStickMobile" in attributes && ui.breakpoints.checkMaxWidth("wideScreen"))
				return;
			var initialPosition = null;
            var scrollTop = $(window).scrollTop()
            var actualScrollTop = $(window).scrollTop()

            var animation = function() {
				element.addClass('scrolling')
                   element.offset({
                       top: element.offset().top + (actualScrollTop + $('.height-marker').height() - (element.offset().top)) / 20
                   });
                requestAnimationFrame(animation)
            }

            var scrolls = false;
				$(window).scroll(function() {
					if (!initialPosition)
						initialPosition = element.offset().top;
	                actualScrollTop = $(window).scrollTop()
					if(actualScrollTop <= initialPosition - $('.height-marker').height()){
						actualScrollTop = initialPosition - $('.height-marker').height();
					}
	                if (!scrolls) {
	                    animation();
	                }
	                scrolls = true;
	            })

        }
    }
});

module.directive('floatingNavigation', function(){
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
		link: function(scope, element, attributes){

			var initialPosition;
			scope.step = 0;
			setTimeout(function(){
				initialPosition = element.offset();
				element.height($(window).height() - parseInt(element.css('margin-bottom'))-100);
				scope.stepsLength = parseInt(element.find('.content')[0].scrollHeight / element.height());
			}, 800);
			element.find('.arrow.next').on('click', function(){
				scope.step ++;
				scope.$apply();
				element.find('.content').animate({
					scrollTop: element.height() * scope.step
				}, 450);
			});
			element.find('.arrow.previous').on('click', function(){
				scope.step --;
				scope.$apply();
				element.find('.content').animate({
					scrollTop: element.height() * scope.step
				}, 450);
			});
		}
	}
});

module.directive('multiCombo', function() {
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
		templateUrl: '/' + appPrefix + '/public/template/entcore/multi-combo.html',
        controller: ['$scope', '$filter', '$timeout', function($scope, $filter, $timeout) {
            /* Search input */
            $scope.search = {
                input: '',
				reset: function(){ this.input = "" }
            }

            /* Combo box visibility */
            $scope.show = false
            $scope.toggleVisibility = function() {
                $scope.show = !$scope.show
                if ($scope.show) {
                    $scope.addClickEvent()
                    $scope.search.reset()
                    $timeout(function() {
                        $scope.setComboPosition()
                    }, 1)
                }
            }

            /* Item list selection & filtering */
            if (!$scope.filteredModel || !($scope.filteredModel instanceof Array))
                $scope.filteredModel = []

            $scope.isSelected = function(item) {
                return $scope.filteredModel.indexOf(item) >= 0
            }

            $scope.toggleItem = function(item) {
                var idx = $scope.filteredModel.indexOf(item)
                if (idx >= 0) {
                    $scope.filteredModel.splice(idx, 1);
                    if ($scope.deselectionEvent() instanceof Function)
                        $scope.deselectionEvent()()
                } else if (!$scope.maxSelected || $scope.filteredModel.length < $scope.maxSelected) {
                    $scope.filteredModel.push(item);
                    if ($scope.selectionEvent() instanceof Function)
                        $scope.selectionEvent()()
                }
            }

            $scope.selectAll = function() {
                $scope.filteredModel.length = 0
                for (var i = 0; i < $scope.filteredComboModel.length; i++) {
                    $scope.filteredModel.push($scope.filteredComboModel[i])
                }
                if ($scope.selectionEvent() instanceof Function)
                    $scope.selectionEvent()()
            }

            $scope.deselectAll = function() {
                $scope.filteredModel.length = 0
                if ($scope.deselectionEvent() instanceof Function)
                    $scope.deselectionEvent()()
            }

            $scope.fairInclusion = function(anyString, challenger) {
                return lang.removeAccents(anyString.toLowerCase()).indexOf(lang.removeAccents(challenger.toLowerCase())) >= 0
            }

            $scope.filteringFun = function(item) {
                var precondition = $scope.filterModel() ? $scope.filterModel()(item) : true
                if ($scope.searchOn && item instanceof Object)
                    return precondition && $scope.fairInclusion(item[$scope.searchOn], $scope.search.input)
                return precondition && $scope.fairInclusion(item, $scope.search.input)
            }

            /* Item display */
            $scope.display = function(item) {
                return item instanceof Object ? item.toString() : item
            }

            /* Ensure that filtered elements are not obsolete */
            $scope.$watchCollection('comboModel', function() {
                if (!$scope.comboModel) {
                    $scope.filteredModel = []
                    return
                }

                for (var i = 0; i < $scope.filteredModel.length; i++) {
                    var idx = $scope.comboModel.indexOf($scope.filteredModel[i])
                    if (idx < 0) {
                        $scope.filteredModel.splice(idx, 1)
                        i--
                    }
                }
            })
        }],
        link: function(scope, element, attributes) {
            if (!attributes.comboModel || !attributes.filteredModel) {
                throw '[<multi-combo> directive] Error: combo-model & filtered-model attributes are required.'
            }

            /* Max n° of elements selected limit */
            scope.maxSelected = parseInt(scope.maxSelected)
            if (!isNaN(scope.maxSelected) && scope.maxSelected < 1) {
                throw '[<multi-combo> directive] Error: max-selected must be an integer greater than 0.'
            }

            /* Visibility mouse click event */
            scope.addClickEvent = function() {
                if (!scope.show)
                    return

                var timeId = new Date().getTime()
                $('body').on('click.multi-combo' + timeId, function(e) {
                    if (!(element.find(e.originalEvent.target).length)) {
                        scope.show = false
                        $('body').off('click.multi-combo' + timeId)
                        scope.$apply()
                    }
                })
            }

            /* Drop down position */
            scope.setComboPosition = function() {
                element.css('position', 'relative')
                element.find('.multi-combo-root-panel').css('top',
                    element.find('.multi-combo-root-button').outerHeight()
                )
            }
            scope.setComboPosition()
        }
    }
});

module.directive('slide', function () {
	return {
		restrict: 'A',
		scope: false,
		link: function (scope, element, attributes) {
			scope.$watch(
				function(){
					return scope.$eval(attributes.slide);
				},
				function(newVal) {
					if (newVal) {
						element.slideDown();
					} else {
						element.slideUp();
					}
				}
			)

			if(!scope.$eval(attributes.slide)){
				element.hide();
			}
		}
	}
});

module.directive('sideNav', function(){
	return {
		restrict: 'AE',
		link: function(scope, element, attributes){
			var body = $('body');;
			$('.mobile-nav-opener').addClass('visible');
			var maxWidth = ui.breakpoints.tablette;
			var target = attributes.targetElement || '.navbar';

			element.addClass('side-nav');
			$('body').addClass('transition');

			var opener = $('.mobile-nav-opener');
			opener.on('click', function(){
				if(!element.hasClass('slide')){
					element.addClass('slide');
					$('body').addClass('point-out');
				}
				else{
					element.removeClass('slide');
					$('body').removeClass('point-out');
				}

			});

			$('body').on('click', function(e){
				if(element[0] === e.target || element.find(e.target).length || $('.mobile-nav-opener')[0] === e.target){
					return;
				}
				element.removeClass('slide');
				$('body').removeClass('point-out');

			})

			if(attributes.maxWidth){
				maxWidth = parseInt(attributes.maxWidth);
			}
			function addRemoveEvents(){
				if(ui.breakpoints.checkMaxWidth(maxWidth)){
					element.height($(window).height());

					if($('.mobile-nav-opener').hasClass('visible')){
						body.find('.application-title').addClass('move-right');
					}

					ui.extendElement.touchEvents(body, {
                        exclude: ['longclick'],
                        allowDefault: true
                    });

					ui.extendElement.touchEvents(element, {
                        exclude: ['longclick']
                    });

					body.on('swipe-right', function(){
						element.addClass('slide');
					});
					element.on('swipe-left', function(){
						element.removeClass('slide');
						$('body').removeClass('point-out');
					});
				}else {
					element.height('auto');
				}
			}
			addRemoveEvents();
			$(window).on('resize', addRemoveEvents);

			scope.$on("$destroy", function() {
				$('.mobile-nav-opener').removeClass('visible');
				body.find('.application-title').removeClass('move-right');
			});

		}
	}
});

module.directive('appTitle', ['$compile', function($compile){
	return {
		restrict: 'E',
		link: function(scope, element, attributes){
			element.addClass('zero-mobile');
			element.find('h1').addClass('application-title');

			function setHeader(){
				var header = $('app-title').html();
				var mobileheader = $('header.main .application-title');

				if(ui.breakpoints.checkMaxWidth("tablette")){
					if(!mobileheader.length)
						$('header.main').append($compile(header)(scope));
				} else {
					mobileheader.remove();
				}
			}
			setHeader();
			$(window).on('resize', setHeader);

			scope.$on("$destroy", function() {
				$('body').find('header.main .application-title').remove();
			});
		}
	}
}]);

module.directive('microbox', ['$compile', function($compile){
	return {
		restrict: 'E',
		compile: function(element, attributes, transclude){
			var content = element.html();

			return function(scope, element, attributes){
				var microtitle = lang.translate(attributes.microtitle);
				var closeBox = lang.translate(attributes.close);
				element.addClass('zero-mobile');

				function setBox(apply?){
					if(ui.breakpoints.checkMaxWidth("tablette")){

						if (!$('.microbox-wrapper').length){
							//creer la box
							$('body').append('<div class="microbox-wrapper zero">'+
								'<div class="microbox-content">'+
								'<i class="close-2x"></i>'+
								'<div class="microbox-material"></div>'+
								'<button class="microbox-close">'+ closeBox +'</button>'+
								'</div></div>');

							$('.microbox-material').html($compile(content)(scope));
							element.after('<button class="microbox">'+ microtitle +'</button>');

							$('button.microbox').on('click', function(){
								if($('.microbox-wrapper').hasClass('zero')){
									$('.microbox-wrapper').removeClass('zero');
								}
							});

							$('button.microbox-close, .microbox-content i.close-2x').on('click', function(){
								if(!$('.microbox-wrapper').hasClass('zero')){
									$('.microbox-wrapper').addClass('zero');
								}
							});

							if(apply){
								scope.$apply();
							}
						}
					}else{
						$('.microbox-wrapper').remove();
						$('button.microbox').remove();
					}
				}

				setBox();
				$(window).on('resize', function(){ setBox(true) });

				scope.$on("$destroy", function() {
					$('body').find('button.microbox').remove();
					$('body').find('.microbox-content').remove();
				});
			}
		}
	}
}]);

module.directive('subtitle', function () {
	return {
		restrict: 'A',
		scope: false,
		link: function (scope, element, attributes) {
			$('section.main').addClass('subtitle-push');

			scope.$on("$destroy", function() {
				$('section.main').removeClass('subtitle-push');
			});
		}
	}
});

module.directive('whereami', function () {
	return {
		restrict: 'A',
		scope: false,
		link: function (scope, element, attributes) {
			element.addClass('whereami');
			var current = $('nav.side-nav a.selected').html();
			$('body').on('whereami.update', function(){
				element.html($('nav.side-nav a.selected').html());
			})
			element.html(current);			
		}
	}
});




var checkToolDelay = (function(){
    var applyAllowed = true;

	return function checkApplication(scope){
    	if(applyAllowed){
			applyAllowed = false;

			setTimeout(function(){
				scope.$apply();
				applyAllowed = true;
			}, 200);
		}

	}
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
			element.on('click', function(){
				scope.ngModel = !scope.ngModel;
				checkToolDelay(scope)

				if (scope.ngModel) {
					element.addClass('selected')
				}else {
					element.removeClass('selected')
				}
				if (scope.ngClick) {
					scope.ngClick();
				}
				if (scope.ngChange) {
					scope.ngChange();
				}
				checkToolDelay(scope)
			});

			$('body').on('click', function(e){
				if($(e.target).parents('.check-tool, .toggle, .lightbox').length ===0 && e.target.nodeName!=="CHECK-TOOL" && $('body').find(e.target).length !== 0){
					scope.ngModel = false;
					element.removeClass('selected');
					checkToolDelay(scope)
					if(scope.ngChange){
                        scope.ngChange();
						checkToolDelay(scope)
                    }
				}
			})
		}
	}
});

module.directive('subtitle', function () {
	return {
		restrict: 'A',
		scope: false,
		link: function (scope, element, attributes) {
			$('section.main').addClass('subtitle-push');

			scope.$on("$destroy", function() {
				$('section.main').removeClass('subtitle-push');
			});
		}
	}
});

module.directive('whereami', function () {
	//only on mailboxes
	return {
		restrict: 'A',
		scope: false,
		link: function (scope, element, attributes) {
			var current = $('nav.side-nav a.selected').text();
			$('body').on('whereami.update', function(){
				element.text($('nav.side-nav a.selected').text());
			})
			element.text(current);
		}
	}
});


module.controller('Account', ['$scope', function($scope) {
	$scope.nbNewMessages = 0;
	$scope.me = model.me;
	$scope.rand = Math.random();
	$scope.skin = skin;
	$scope.lang = lang;
	$scope.currentLanguage = currentLanguage;
	$scope.refreshAvatar = function(){
		http().get('/userbook/api/person', {}, {requestName: "refreshAvatar"}).done(function(result){
			$scope.avatar = result.result['0'].photo;
			if (!$scope.avatar || $scope.avatar === 'no-avatar.jpg' || $scope.avatar === 'no-avatar.svg') {
                $scope.avatar = skin.basePath + '/img/illustrations/no-avatar.svg';
            }
			$scope.username = result.result['0'].displayName;
			model.me.profiles = result.result['0'].type;
			$scope.$apply();
		});
	};

	$scope.refreshMails = function(){
		http().get('/conversation/count/INBOX', { unread: true }).done(function(nbMessages){
			$scope.nbNewMessages = nbMessages.count;
			$scope.$apply('nbNewMessages');
		});
	};

	$scope.openApps = function(event){
		if($(window).width() <= 700){
			event.preventDefault();
		}
	}

	http().get('/directory/userbook/' + model.me.userId).done(function(data){
		model.me.userbook = data;
		$scope.$apply('me');
	});

	skin.listThemes(function(themes){
		$scope.themes = themes;
		$scope.$apply('themes');
	});

	$scope.$root.$on('refreshMails', $scope.refreshMails);

	$scope.refreshMails();
	$scope.refreshAvatar();
	$scope.currentURL = window.location.href;
}]);

module.controller('Admin', ['$scope', function($scope){
	$scope.urls = [];
	http().get('/admin-urls').done(function(urls){
		$scope.urls = urls;
		$scope.$apply('urls');
	});
    $scope.getHighlight = function(url){
        return window.location.href.indexOf(url.url) >= 0
    }
    $scope.orderUrls = function(url){
        return !$scope.getHighlight(url) ? 1 : 0
    }
    $scope.filterUrls = function(url){
        return !url.allowed || !(url.allowed instanceof Array) ? true : _.find(model.me.functions, function(f){ return _.contains(url.allowed, f.code) })
    }

	$scope.scrollUp = ui.scrollToTop;
}]);

$(document).ready(function(){
	setTimeout(function(){
		//routing
		if(routes.routing){
			module.config(routes.routing);
		}
		bootstrap(function(){
		    RTE.addDirectives(module);
            if (window.entcore.ng.init) {
                window.entcore.ng.init(module);
		    }
			model.build();

			lang.addDirectives(module);


			function start(){
				lang.addBundle('/i18n', function(){
					lang.addBundle('/' + appPrefix + '/i18n', function(){
						 if (currentLanguage === 'fr') {
							moment.locale(currentLanguage);
							moment.updateLocale(currentLanguage, frLocales);
						}
						else {
							moment.locale(currentLanguage);
						}
                        angular.bootstrap($('html'), ['app']);
                        model.trigger('bootstrap');
						model.bootstrapped = true;
						model.sync();
					});
				});
			}

            http().get(skin.basePath + 'js/directives.js').done((d) => {
                eval(d);

                if(typeof skin.addDirectives === 'function'){
                    skin.addDirectives(module, start);
                }
                else{
                    start();
                }
            })
            .error(() => {
                start();
            });
		});
	}, 10);
});

module.controller('SearchPortal', ['$scope', function($scope) {
	$scope.launchSearch = function(event) {
		var words = $scope.mysearch;
		if (event != "link") event.stopPropagation();
		if ((event == "link" ||  event.keyCode == 13)) {
			words = (!words || words === '') ? ' ' : words;
			$scope.mysearch = "";
			window.location.href = '/searchengine#/' + words;
		}
	};
}]);
