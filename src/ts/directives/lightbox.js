"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
var underscore_1 = require("../libs/underscore/underscore");
exports.lightbox = ng_start_1.ng.directive('lightbox', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            show: '=',
            onClose: '&'
        },
        template: '<section class="lightbox">' +
            '<div class="background"></div>' +
            '<div class="content">' +
            '<div class="twelve cell" ng-transclude></div>' +
            '<div class="close-lightbox">' +
            '<i class="close-2x"></i>' +
            '</div>' +
            '</div>' +
            '</section>' +
            '</div>',
        link: function (scope, element, attributes) {
            var content = element.find('.content');
            element.children('.lightbox').find('> .background, > .content > .close-lightbox > i.close-2x').on('click', function (e) {
                element.children('.lightbox').first().fadeOut();
                jquery_1.$('body').css({ overflow: 'auto' });
                jquery_1.$('body').removeClass('lightbox-opened');
                scope.$eval(scope.onClose);
                scope.$apply();
                scope.show = false;
                if (!scope.$$phase) {
                    scope.$parent.$apply();
                }
            });
            element.children('.lightbox').on('mousedown', function (e) {
                e.stopPropagation();
            });
            scope.$watch('show', function (newVal) {
                if (newVal) {
                    var lightboxWindow = element.children('.lightbox');
                    //Backup overflow hidden elements + z-index of parents
                    var parentElements = element.parents();
                    scope.backup = {
                        overflow: underscore_1._.filter(parentElements, function (parent) {
                            return jquery_1.$(parent).css('overflow-x') !== 'visible' || jquery_1.$(parent).css('overflow-y') !== 'visible';
                        }),
                        zIndex: underscore_1._.map(parentElements, function (parent) {
                            var index = '';
                            if (jquery_1.$(parent).attr('style') && jquery_1.$(parent).attr('style').indexOf('z-index') !== -1) {
                                index = jquery_1.$(parent).css('z-index');
                            }
                            return {
                                element: jquery_1.$(parent),
                                index: index
                            };
                        })
                    };
                    //Removing overflow properties
                    scope.backup.overflow.forEach(function (element) {
                        jquery_1.$(element).css({ 'overflow': 'visible' });
                    });
                    //Ensuring proper z-index
                    scope.backup.zIndex.forEach(function (elementObj) {
                        elementObj.element.css('z-index', 99999);
                    });
                    setTimeout(function () {
                        jquery_1.$('body').addClass('lightbox-opened');
                        lightboxWindow.fadeIn();
                    }, 100);
                    jquery_1.$('body').css({ overflow: 'hidden' });
                }
                else {
                    var updateBody_1 = true;
                    jquery_1.$('lightbox .lightbox').each(function (index, item) {
                        if (item !== element.children('.lightbox')[0] && jquery_1.$(item).css('display') === 'block') {
                            updateBody_1 = false;
                        }
                    });
                    if (updateBody_1) {
                        jquery_1.$('body').removeClass('lightbox-opened');
                        jquery_1.$('body').css({ overflow: 'auto' });
                    }
                    if (scope.backup) {
                        //Restoring stored elements properties
                        scope.backup.overflow.forEach(function (element) {
                            jquery_1.$(element).css('overflow', '');
                        });
                        scope.backup.zIndex.forEach(function (elementObj) {
                            elementObj.element.css('z-index', elementObj.index);
                        });
                    }
                    element.children('.lightbox').fadeOut();
                }
            });
            scope.$on("$destroy", function () {
                jquery_1.$('body').removeClass('lightbox-opened');
                jquery_1.$('body').css({ overflow: 'auto' });
                if (scope.backup) {
                    //Restoring stored elements properties
                    underscore_1._.forEach(scope.backup.overflow, function (element) {
                        jquery_1.$(element).css('overflow', '');
                    });
                    underscore_1._.forEach(scope.backup.zIndex, function (elementObj) {
                        elementObj.element.css('z-index', elementObj.index);
                    });
                }
            });
        }
    };
});
//# sourceMappingURL=lightbox.js.map