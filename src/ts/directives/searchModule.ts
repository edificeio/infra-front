import { ng, _, angular } from '../entcore';

/**
 * @description Display pastilles and a particular search template according to the selected pastille.
 * @param ngModel The activated pastille index.
 * @param ngChange Function to call after the activated pastill changed.
 * @param search Function applying a search according to the selected pastille.
 * @param images A string representing an array of string containing the list of images paths.
 * @example
 *  <search-module 
        search="<function>()"
        images="<images>">
        <div>
            Page 1
        </div>
        <div>
            Page 2
        </div>
        <!-- invisible pastille -->
        <div>
            <div style="display:none"> <!-- invisible pastille -->
                Page 3
            </div>
        </div>
    </search-module>
    
    How to hide a pastille : add a display none style to another div inside the page container.
 */

export const searchModule = ng.directive('searchModule', ['$window', ($window) => {
    return {
        restrict: 'E',
        transclude: true,
        template: `
            <form name="searchForm" ng-submit="search()" novalidate>
                <article class="twelve cell reduce-block-six">
                    <pastilles 
                        ng-model="ngModel"
                        images="images">
                    </pastilles>
                    <ng-transclude></ng-transclude>
                </article>
            </form>
        `,

        scope: {
            ngModel: '=',
            ngChange: '&',
            search: '&',
        },

        link: (scope, element, attributes) => {
            var imgs = typeof attributes.images === 'string' ? JSON.parse(attributes.images) : attributes.images;
            var i18ns = typeof attributes.i18n === 'string' ? JSON.parse(attributes.i18n) : attributes.i18n;
            if (!Array.isArray(i18ns)) i18ns = [i18ns];
            var pages = element.find("ng-transclude").children();
            var i, l = pages.length;
            scope.images = [];
            for (i = 0; i < l; i++) {
                scope.images[i] = {
                    img: imgs[i],
                    visible: true,
                    i18n: i18ns[i],
                };
            }

            var hideAll = () => {
                for (i = 0; i < l; i++) {
                    pages.eq(i).hide();
                }
            }
            hideAll();

            var fillImages = () => {
                for (i = 0; i < l; i++) {
                    scope.images[i].visible = pages.eq(i).children().eq(0).css("display") !== "none";
                }
                scope.$apply();
            }
            
            // Pastilles changing index
            scope.$watch("ngModel", function(newValue) {
                hideAll();
                pages.eq(newValue).show();
                scope.ngChange({ index: newValue });
            });

            angular.element($window).bind('resize', function() {
                fillImages();
            });

            setTimeout(function() {
                fillImages();
            }, 0);
        }
    };
}]);
