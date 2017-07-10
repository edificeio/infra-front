"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var ui_1 = require("../ui");
var jquery_1 = require("../libs/jquery/jquery");
exports.explorer = ng_start_1.ng.directive('explorer', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            ngModel: '=',
            ngClick: '&',
            ngChange: '&',
            onOpen: '&',
        },
        template: '<div class="explorer" ng-transclude></div>',
        link: function (scope, element, attributes) {
            function select() {
                scope.ngModel = !scope.ngModel;
                scope.$apply('ngModel');
                if (scope.ngClick) {
                    scope.ngClick();
                }
                if (scope.ngChange) {
                    scope.ngChange();
                }
                scope.$apply();
            }
            jquery_1.$('body').on('click', function (e) {
                if (jquery_1.$(e.target).parents('explorer, .toggle, .lightbox').length === 0
                    && e.target.nodeName !== "EXPLORER"
                    && (jquery_1.$(e.target).parents('body').length || e.target.nodeName === 'BODY')) {
                    scope.ngModel = false;
                    scope.$apply('ngModel');
                    if (scope.ngChange) {
                        scope.ngChange();
                    }
                    scope.$apply();
                    element.removeClass('selected');
                }
            });
            function setGest(apply) {
                if (ui_1.ui.breakpoints.checkMaxWidth("tablette")) {
                    element.off('click dblclick');
                    ui_1.ui.extendElement.touchEvents(element);
                    element.on('contextmenu', function (event) {
                        event.preventDefault();
                    });
                    element.on('click', function (e, position) {
                        select();
                        scope.$apply('ngModel');
                    });
                    element.on('doubletap dblclick', function () {
                        scope.ngModel = false;
                        scope.onOpen();
                        scope.$apply('ngModel');
                    });
                }
                else {
                    element.off('click dblclick doubletap contextmenu');
                    element.on('click', function () {
                        select();
                        scope.$apply('ngModel');
                    });
                    element.on('dblclick', function () {
                        scope.onOpen();
                        scope.ngModel = false;
                        scope.$apply('ngModel');
                    });
                }
            }
            setGest();
            jquery_1.$(window).on('resize', function () { setGest(true); });
            scope.$watch('ngModel', function (newVal) {
                if (newVal) {
                    element.addClass('selected');
                }
                else {
                    element.removeClass('selected');
                }
            });
        }
    };
});
//# sourceMappingURL=explorer.js.map