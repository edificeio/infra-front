import { Directive, ng } from "../ng-start";
import { InputGuard, navigationGuardService } from "../navigationGuard";
import { Element } from "../workspace/model";


export const initGuardDirective: Directive = ng.directive('initGuard', () => {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
        }
    }
});



export const resetGuardDirective: Directive = ng.directive('resetGuard', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
        }
    }
});

export const inputGuardDirective: Directive = ng.directive('inputGuard', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            const guard = new InputGuard<any>(() => ngModel.$viewValue, () => ngModel.$viewValue);
            navigationGuardService.registerGuard(guard);
            scope.$on("$destroy", function () {
                navigationGuardService.unregisterGuard(guard);
            });
        }
    }
});

export const documentGuardDirective: Directive = ng.directive('documentGuard', () => {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            const guard = new InputGuard<Element>(() => ngModel.$modelValue && ngModel.$modelValue.id,
                () => ngModel.$modelValue ? ngModel.$modelValue.id : undefined,
                (a, b) => {
                    if (a && b) {
                        return a._id == b._id;
                    } else {
                        return !a && !b;
                    }
                });
            navigationGuardService.registerGuard(guard);
            scope.$on("$destroy", function () {
                navigationGuardService.unregisterGuard(guard);
            });
        }
    }
});