import { ng, Directive } from '../ng-start';
import { ui } from '../ui';
import { $ } from '../libs/jquery/jquery';

export let sortableList = ng.directive('sortableList', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        controller: function () { },
        compile: function (element, attributes, transclude) {
            var initialHtml = element.html();
            return function (scope, element, attributes) {
                scope.updateElementsOrder = function (el) {
                    var sortables = element.find('[sortable-element]');
                    sortables.removeClass('animated');
                    sortables.each(function (index, item) {
                        if (parseInt($(item).css('margin-top')) > 0) {
                            el.detach().insertBefore(item);
                        }
                    });

                    if (el.offset().top > sortables.last().offset().top + sortables.last().height()) {
                        element.append(el.detach());
                    }

                    //get new elements order
                    sortables = element.find('[sortable-element] > div');
                    sortables.each(function (index, item) {
                        var itemScope = angular.element(item).scope();
                        if (index !== itemScope.ngModel) {
                            itemScope.ngModel = index;
                            itemScope.$apply();
                        }
                    });

                    if (attributes.onChange) {
                        scope.$eval(attributes.onChange);
                    }
                    sortables.attr('style', '');
                    element.html($compile(initialHtml)(scope));
                    scope.$apply();
                };
            }
        }
    }
}]);

export let sortableElement = ng.directive('sortableElement', ['$parse', function ($parse) {
    return {
        scope: {
            ngModel: '=',
            ngChange: '&'
        },
        require: '^sortableList',
        template: '<div ng-transclude></div>',
        transclude: true,
        link: function (scope, element, attributes) {
            var sortables;
            scope.$watch('ngModel', function (newVal, oldVal) {
                if (newVal !== oldVal && typeof scope.ngChange === 'function') {
                    scope.ngChange();
                }
            });
            ui.extendElement.draggable(element, {
                lock: {
                    horizontal: true
                },
                mouseUp: function () {
                    scope.$parent.updateElementsOrder(element);

                    element.on('click', function () {
                        scope.$parent.$eval(attributes.ngClick);
                    });

                },
                startDrag: function () {
                    sortables = element.parents('[sortable-list]').find('[sortable-element]');
                    sortables.attr('style', '');
                    setTimeout(function () {
                        sortables.addClass('animated');
                    }, 20);
                    element.css({ 'z-index': 1000 });
                },
                tick: function () {
                    var moved = [];
                    sortables.each(function (index, sortable) {
                        if (element[0] === sortable) {
                            return;
                        }
                        var sortableTopDistance = $(sortable).offset().top - parseInt($(sortable).css('margin-top'));
                        if (element.offset().top + element.outerHeight() / 2 > sortableTopDistance &&
                            element.offset().top + element.outerHeight() / 2 < sortableTopDistance + $(sortable).outerHeight()) {
                            $(sortable).css({ 'margin-top': element.outerHeight() });
                            moved.push(sortable);
                        }
                        //first widget case
                        if (element.offset().top + element.outerHeight() / 2 - 2 < sortableTopDistance && index === 0) {
                            $(sortable).css({ 'margin-top': element.outerHeight() });
                            moved.push(sortable);
                        }
                    });
                    sortables.each(function (index, sortable) {
                        if (moved.indexOf(sortable) === -1) {
                            $(sortable).css({ 'margin-top': 0 + 'px' });
                        }
                    })
                }
            });
        }
    };
}]);