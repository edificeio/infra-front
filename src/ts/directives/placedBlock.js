"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
exports.placedBlock = ng_start_1.ng.directive('placedBlock', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        scope: {
            x: '=',
            y: '=',
            z: '=',
            h: '=',
            w: '='
        },
        template: '<article ng-transclude ng-style="{\'z-index\': z }"></article>',
        link: function (scope, element) {
            element.css({ 'position': 'absolute' });
            scope.$watch('x', function (newVal) {
                element.offset({
                    top: element.offset().top,
                    left: parseInt(newVal) + element.parent().offset().left
                });
            });
            scope.$watch('y', function (newVal) {
                element.offset({
                    left: element.offset().left,
                    top: parseInt(newVal) + element.parent().offset().top
                });
            });
            var toTop = function () {
                jquery_1.$(':focus').blur();
                if (scope.z === undefined) {
                    return;
                }
                element.parents('.drawing-zone').find('article[draggable]').each(function (index, item) {
                    var zIndex = jquery_1.$(item).css('z-index');
                    if (!scope.z) {
                        scope.z = 1;
                    }
                    if (parseInt(zIndex) && parseInt(zIndex) >= scope.z) {
                        scope.z = parseInt(zIndex) + 1;
                    }
                });
                if (scope.z) {
                    scope.$apply('z');
                }
            };
            element.on('startDrag', toTop);
            element.on('startResize', function () {
                scope.w = element.width();
                scope.$apply('w');
                scope.h = element.height();
                scope.$apply('h');
                toTop();
            });
            var applyPosition = function () {
                scope.x = element.position().left;
                scope.$apply('x');
                scope.y = element.position().top;
                scope.$apply('y');
            };
            element.on('stopDrag', function () { return applyPosition(); });
            scope.$watch('z', function (newVal) {
                element.css({ 'z-index': scope.z });
            });
            scope.$watch('w', function (newVal) {
                element.width(newVal);
            });
            element.on('stopResize', function () {
                scope.w = element.width();
                scope.$apply('w');
                scope.h = element.height();
                scope.$apply('h');
                applyPosition();
            });
            scope.$watch('h', function (newVal) {
                element.height(newVal);
            });
        }
    };
});
//# sourceMappingURL=placedBlock.js.map