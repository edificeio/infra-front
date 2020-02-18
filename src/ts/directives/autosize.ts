import { ng } from "../ng-start";



export const autosize = ng.directive('autosize', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            const autoHeight = (element:JQuery) => {
                return jQuery(element).css({
                    'height': 'auto',
                    'overflow-y': 'hidden'
                }).css({'height':element[0].scrollHeight});
            }
            autoHeight(element).on('input', function () {
                autoHeight(element);
            });
        }
    }
}]);
