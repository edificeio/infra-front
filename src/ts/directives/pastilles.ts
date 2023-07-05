import { ng, _, angular } from '../entcore';
import { idiom } from "../idiom";

/**
 * @description Display pastilles that can be used as tabs.
 * @param ngModel The activated pastille index.
 * @param images An array of objects { img: string, visible: bool } containing the list of images paths and indicating if they are visible or not.
 * @example
 *  <pastilles 
        ng-model="<index>"
        images="<images>">
    </pastilles>
 */

export const pastilles = ng.directive('pastilles', ['$window', ($window) => {
    return {
        restrict: 'E',
        template: `
            <div class="pastilles-container">
                <a ng-if="image.visible" class="pastilles-item inactive" ng-click="" ng-repeat="image in images track by $index">
                    <svg class="pastilles-icon" width="32" height="32">
                        <title>[[translate(image.img)]]</title>
                        <use href="/directory/public/assets/icons/icons.svg#[[image.img]]"></use>
                    </svg>
                    <span>[[translate(image.i18n)]]</span>
                </a>
            </div>
        `,

        scope: {
            ngModel: '=',
            images: '=',
        },

        link: (scope, element, attributes) => {

            scope.translate = idiom.translate;

            // Waiting for pastilles to be created
            setTimeout(function () {
                var i, l, count;
                var pastilles, totalWidth, pastilleWidth, leftOffset, offset, pastilleOffset, nbPastilles;
                scope.index = scope.ngModel;

                var updatePastilles = function() {
                    pastilles = element.find("div").children();
                    nbPastilles = pastilles.length;
                }
                updatePastilles();

                var updateImages = function() {
                    if (scope.index < nbPastilles) {
                        pastilles.eq(scope.index).removeClass("inactive");
                        pastilles.eq(scope.index).addClass("active");
                    }

                    // Set active on click
                    element.find('.pastilles-item').on('click', function() {
                        updatePastilles();
                        if (nbPastilles === 0)
                            return;
                        element.find(".active").addClass("inactive");
                        element.find(".active").removeClass("active");
                        this.classList.remove("inactive");
                        this.classList.add("active");
                        scope.index = Array.prototype.slice.call(element.find("div")[0].children).indexOf(this);
                        var c = 0;
                        for (var i = 0, l = scope.images.length; i < l; i++) {
                            if (scope.images[i].visible) {
                                if (scope.index === c) {
                                    scope.ngModel = i;
                                    break;
                                }
                                else
                                    c++;
                            }
                        }
                        scope.$apply();
                    });
                }

                scope.$watch('images', function(newValue) {
                    setTimeout(function () {
                        updateImages();
                    }, 0);
                }, true);
                updateImages();

                // Activate the first pastille
                scope.setActive(pastilles[scope.index]);
                pastilles.eq(scope.index).removeClass("inactive");
                pastilles.eq(scope.index).addClass("active");

                element.find("div").removeClass("invisible-content");

            }, 250);
        }
    };
}]);