import { ng } from '../ng-start';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';
import { ui } from '../ui';

export let slider = ng.directive('slider', ['$compile', '$parse', function ($compile, $parse) {
    return {
        restrict: 'E',
        scope: true,
        template: '<div class="bar"></div><div class="filled"></div><div class="cursor"></div><legend class="min"></legend><legend class="max"></legend>',
        link: function (scope, element, attributes) {
            element.addClass('drawing-zone');
            var cursor = element.children('.cursor');
            var max = parseInt(attributes.max);
            var min = parseInt(attributes.min);

            var ngModel = $parse(attributes.ngModel);

            var applyValue = function (newVal) {
                var pos = parseInt((newVal - min) * element.children('.bar').width() / (max - min));
                cursor.css({
                    left: pos + 'px',
                    position: 'absolute'
                });
                element.children('.filled').width(cursor.position().left);
            };

            $(window).on('resize', function () {
                applyValue(ngModel(scope));
            });

            scope.$watch(function () {
                return ngModel(scope);
            }, applyValue);

            if (typeof ngModel(scope) !== 'number') {
                ngModel.assign(scope, parseInt(attributes.default));
                applyValue(ngModel(scope));
            }

            element.children('legend.min').html(idiom.translate(attributes.minLegend));
            element.children('legend.max').html(idiom.translate(attributes.maxLegend));

            element.children('.bar, .filled').on('click', function (e) {
                var newPos = e.clientX - element.children('.bar').offset().left;
                var newVal = (newPos * (max - min) / element.children('.bar').width()) + min;
                ngModel.assign(scope, newVal);
                scope.$apply();
            });

            ui.extendElement.draggable(cursor, {
                lock: {
                    vertical: true
                },
                mouseUp: function () {
                    var cursorPosition = cursor.position().left;
                    var newVal = (cursorPosition * (max - min) / element.children('.bar').width()) + min;
                    ngModel.assign(scope, newVal);
                    scope.$apply();
                },
                tick: function () {
                    var cursorPosition = cursor.position().left;
                    element.children('.filled').width(cursorPosition);
                }
            });
        }
    }
}]);
