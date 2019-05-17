import { ng } from '../ng-start';

declare var window: any
let logged = false;
function imageLazyLoadFunc() {
    return {
        restrict: 'A',
        scope: {
            imageLazyLoad: "="
        },
        link: function (scope, element, attrs) {
            const win = window as any;
            if (!win.IntersectionObserver ||
                !win.IntersectionObserverEntry ||
                !win.IntersectionObserverEntry.prototype) {
                // load polyfill 
                if (!logged){
                    console.warn("lazy load is disabled")
                }
                logged = true;
                //set src on img
                const img = angular.element(element)[0];
                img.src = scope.imageLazyLoad;
            } else {
                if (!logged){
                    console.info("lazy load is enabled")
                }
                logged = true;
                //
                const loadImg = (changes) => {
                    changes.forEach(change => {
                        if (change.intersectionRatio > 0) {
                            if(!change.target.src || change.target.src.indexOf(scope.imageLazyLoad)==-1){
                                change.target.src = scope.imageLazyLoad;
                            }
                        }
                    })
                }
                const observer = new IntersectionObserver(loadImg)
                const img = angular.element(element)[0];
                observer.observe(img)
            }
        }
    }
}
export const imageLazyLoad = ng.directive('imageLazyLoad', imageLazyLoadFunc)