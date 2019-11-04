import { Directive, ng } from "../ng-start";



export const textGuardDirective: Directive = ng.directive('text-guard', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, element, attrs, ngModel) {
            //viewChangeListeners
        }
    }
});