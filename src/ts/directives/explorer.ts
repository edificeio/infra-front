import { ng } from '../ng-start';
import { ui } from '../ui';
import { $ } from '../libs/jquery/jquery';

//=== utils
function isTouchDevice() {
    try{
        return (('ontouchstart' in window)
         || ((navigator as any).MaxTouchPoints > 0)
         || (navigator.msMaxTouchPoints > 0));
    }catch(e){
        return false;
    }
}

//===directive
export let explorer = ng.directive('explorer', () => {
    return {
        restrict: 'EA',
        transclude: true,
        scope: {
            ngModel: '=',
            ngClick: '&',
            ngChange: '&',
            onOpen: '&',
        },
        template: '<div class="explorer" ng-transclude></div>',
        link: function (scope, element, attributes) {
            if(isTouchDevice()){
                //double tap
                element.bind('touchstart', function preventZoom(e) {
                    const t2 = e.timeStamp
                        , t1 = element.data('lastTouch') || t2
                        , dt = t2 - t1
                        , fingers = e.originalEvent.touches.length;
                        element.data('lastTouch', t2);
                    //not a double tap
                    if (!dt || dt > 500 || fingers > 1) 
                        return;
                    //double tap
                    e.preventDefault(); 
                    element.trigger('dblclick');
                });     
            }
            //
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
                if ($(e.target).parents('explorer, .explorer, .toggle, .lightbox').length === 0
                    && !$(e.target).is('.lightbox') 
					&& e.target.nodeName !== "EXPLORER"
                    && ($(e.target).parents('body').length || e.target.nodeName === 'BODY')
                ) {
                    let old = scope.ngModel;
                    scope.ngModel = false;
                    scope.$apply('ngModel');

                    if (scope.ngChange && old == true) {
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
                        if ($(e.target).parents('editor').length === 0) {
                            select(e);
                            scope.$apply('ngModel');
                        }
                    })

                    element.on('doubletap dblclick', function (e) {
                        scope.ngModel = false;
                        scope.onOpen({'$event':e});
                        scope.$apply('ngModel');
                    });
                } else {
                    element.off('click dblclick doubletap contextmenu')

                    element.on('click', function (e) {
                        if ($(e.target).parents('editor').length === 0) {
                            select(e);
                            scope.$apply('ngModel');
                        }
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
