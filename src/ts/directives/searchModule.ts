import { ng, _, angular } from '../entcore';

/**
 * @description Display pastilles and a particular search template according to the selected pastille.
 * @param ngModel The activated pastille index.
 * @param showClose bool indicating if the close button needs to be shown or not.
 * @param ngChange Function to call after the activated pastill changed.
 * @param search Function applying a search according to the selected pastille.
 * @param onClose Function to call after clicking on the close button.
 * @param images A string representing an array of string containing the list of images paths.
 * @example
 *  <search-module 
        search="<function>()"
        on-close="<function>()"
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
            <pastilles 
                ng-model="ngModel"
                images="images">
            </pastilles>
            <form name="searchForm" ng-submit="search()" novalidate>
                <article class="twelve cell reduce-block-six">
                    <div class="spacer-large"></div>
                    <a ng-click="onClose()" class="zero-large-desktop close-lightbox" ng-show="showClose">
                        <i class="close" />
                    </a>
                    <ng-transclude></ng-transclude>
                </article>
            </form>
        `,

        scope: {
            ngModel: '=',
            showClose: '=',
            ngChange: '&',
            search: '&',
            onClose: '&',
        },

        link: (scope, element, attributes) => {
            var imgs = typeof attributes.images === 'string' ? JSON.parse(attributes.images) : attributes.images;
            var pages = element.find("ng-transclude").children();
            var i, l = pages.length;
            scope.images = [];
            for (i = 0; i < l; i++) {
                scope.images[i] = {
                    img: imgs[i],
                    visible: true
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
