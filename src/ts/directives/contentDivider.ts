import { ng, _ } from '../entcore';

/**
 * @description A component separating multiple content with a divider.
 * @param ngModel The contents list.
 * @param order [attr] The attribute used for ordering content.
 * @example
 *  <content-divider
        ng-model="<array>"
        order="<string>">
        <div>
            [[content]]
        </div>
    </content-divider>
 */

export const contentDivider = ng.directive('contentDivider', () => {
    return {
        restrict: 'E',
        template: function(tElement, tAttrs) {
            return `
            <div class="zero-mobile-fat-mobile flex-row reduce-block-eight scroll-x">
                <div class="flex-row" ng-repeat="content in getModel() track by $index">`
                + 
                    tElement.children()[0].outerHTML
                +
                    `<div class="horizontal-margin-twice divider-border" ng-if="$index < ngModel.length - 1"></div>
                </div>
            </div>
            <div class="mobile-fat-mobile flex-row f-column reduce-block-eight">
                <div class="flex-row f-column" ng-repeat="content in getModel() track by $index">`
                + 
                    tElement.children()[0].outerHTML
                +
                    `<div class="vertical-spacing-six divider-border-horizontal" ng-if="$index < ngModel.length - 1"></div>
                </div>
            </div>
        `},

        scope: {
            callback: '=',
        },
        require: "ngModel",

        link: (scope, element, attributes, ngModel,transclude) => {
            scope.order = attributes.order;

            scope.getModel = function()
            {
                let m = ngModel.$viewValue;
                return  m == null ? [] : typeof m == "string" ? JSON.parse(m) : m;
            }
        }
    };
});