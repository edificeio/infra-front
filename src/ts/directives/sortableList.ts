import { ng } from '../ng-start';
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
                    let noneAfter = true;
                    sortables.filter("[sortable-order='after']").first().each(function (index, sortable) {
                        el.detach().insertBefore(sortable);
                        noneAfter = false;
                    });
                    if (noneAfter) {
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
            var initialMarginTop = 0, 
                initialMarginBottom = 0;
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
                    initialMarginTop = parseInt(element.css('margin-top')) || 0;
                    initialMarginBottom = parseInt(element.css('margin-bottom')) || 0;
                },
                tick: function () {
                    const elementFullHeight = element.outerHeight();
                    const elementHalfHeight = elementFullHeight / 2;
                    const elementMidDistance = element.offset().top + elementHalfHeight + initialMarginTop;
                    let previousSortable = null;
                    let latestMidDistance = 0;
                    sortables.each(function (index, sortable) {
                        if (element[0] !== sortable) {  // don't care about the dragged element
                            const previousMidDistance = latestMidDistance;
                            latestMidDistance = $(sortable).offset().top + elementHalfHeight;
                            if ( (!previousSortable || previousMidDistance < elementMidDistance) && elementMidDistance <= latestMidDistance) {
                                // Dragged item is between the previous and the latest sortables
                                $(sortable).attr('sortable-order', 'after');
                                previousSortable && $(previousSortable).css({ 'margin-bottom': initialMarginBottom + elementHalfHeight +'px' });
                                $(sortable).css({ 'margin-top': initialMarginTop +(previousSortable ? elementHalfHeight : elementFullHeight) +'px' });
                            } else {
                                if( elementMidDistance > latestMidDistance ) {
                                    // Dragged item is after the latest sortable
                                    $(sortable).attr('sortable-order', 'before');
                                } else {
                                    // Dragged item is before the latest sortable
                                    $(sortable).attr('sortable-order', 'after');
                                }
                                previousSortable && $(previousSortable).css({ 'margin-bottom': initialMarginBottom +'px' });
                                $(sortable).css({ 'margin-top': initialMarginTop + 'px' });
                            }
                            previousSortable = sortable;
                        }
                    });
                    if( previousSortable ) { // last item
                        if ( elementMidDistance > latestMidDistance) {
                            $(previousSortable).css({ 'margin-bottom': initialMarginBottom + elementFullHeight +'px' });
                        } else {
                            $(previousSortable).css({ 'margin-bottom': initialMarginBottom + 'px' });
                        }
                    }
                }
            });
        }
    };
}]);