import { ng } from '../ng-start';
import { ui } from '../ui';
import { $ } from '../libs/jquery/jquery';

export let explorer = ng.directive('explorer', () => {
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

            function select(e) {
                scope.ngModel = !scope.ngModel;
                scope.$apply('ngModel');

                if (scope.ngClick) {
                    scope.ngClick({'$event':e});
                }
                if (scope.ngChange) {
                    scope.ngChange({'$event':e});
                }
                scope.$apply();
            }

            $('body').on('click.explorer', function (e) {
                if ($(e.target).parents('explorer, .toggle, .lightbox').length === 0
                    && e.target.nodeName !== "EXPLORER"
                    && ($(e.target).parents('body').length || e.target.nodeName === 'BODY')
                ) {
                    scope.ngModel = false;
                    scope.$apply('ngModel');

                    if (scope.ngChange) {
                        scope.ngChange({'$event':e});
                    }

                    scope.$apply();
                    element.removeClass('selected');

                }
            })

            function setGest(apply?) {
                if (ui.breakpoints.checkMaxWidth("tablette")) {

                    element.off('click dblclick')
                    ui.extendElement.touchEvents(element);

                    element.on('contextmenu', function (event) {
                        event.preventDefault()
                    })

                    element.on('click', function (e, position) {
                        select(e);
                        scope.$apply('ngModel');
                    })

                    element.on('doubletap dblclick', function (e) {
                        scope.ngModel = false;
                        scope.onOpen({'$event':e});
                        scope.$apply('ngModel');
                    });
                } else {
                    element.off('click dblclick doubletap contextmenu')

                    element.on('click', function (e) {
                        select(e);
                        scope.$apply('ngModel');
                    });
                    element.on('dblclick', function (e) {
                        scope.onOpen({'$event':e});
                        scope.ngModel = false;
                        scope.$apply('ngModel');
                    })

                }
            }
            setGest();
            $(window).on('resize', function () { setGest(true) });

            scope.$watch('ngModel', (newVal) => {
                if (newVal) {
                    element.addClass('selected')
                } else {
                    element.removeClass('selected')
                }
            });

            scope.$on('$destroy', function () {
                $('body').off('click.explorer');
            });
        }
    }
});
