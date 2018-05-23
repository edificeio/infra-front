import { ng } from '../ng-start';

export const Switch = ng.directive('switch', () => {
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            ngChange: '&',
            ngDisabled: '@'
        },
        template: '<label class="switch">' +
        '<input type="checkbox" ng-model="ngModel" ng-change="valueChange()" ng-disabled="ngDisabled"/>' +
        '<span class="tick cell"></span>' +
        '</label>',
        link: function ($scope, $element, $attrs, ngModel) {
            $scope.valueChange = function () {
                setTimeout(function () {
                    if ($attrs.ngChange) $scope.$parent.$eval($attrs.ngChange);
                }, 0);
            };
        }
    };
});