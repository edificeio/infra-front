import { Directive, ng } from "../ng-start";


export const initGuardDirective: Directive = ng.directive('init-guard', () => {
    return {
        restrict: 'A',
        link: function(scope, element, attrs, ngModel) {
        }
    }
});



export const resetGuardDirective: Directive = ng.directive('reset-guard', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, element, attrs, ngModel) {
        }
    }
});

export const inputGuardDirective: Directive = ng.directive('text-guard', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, element, attrs, ngModel) {
            //viewChangeListeners
        }
    }
});

export const imageGuardDirective: Directive = ng.directive('image-guard', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function(scope, element, attrs, ngModel) {
            //viewChangeListeners
        }
    }
});