import { Directive, ng } from "../ng-start";
import { INavigationGuard, InputGuard, navigationGuardService, AngularJSRouteChangeListener, DOMRouteChangeListener } from "../navigationGuard";
import { Element } from "../workspace/model";


export const guardRootDirective: Directive = ng.directive('guardRoot', () => {
    return {
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            navigationGuardService.registerListener(new AngularJSRouteChangeListener(scope.$root));
            navigationGuardService.registerListener(new DOMRouteChangeListener());

        }
    }
});

function generateGuardDirective(directiveName: string, guardFactory: (scope, element, attrs, ngModel) => INavigationGuard): Directive
{
    return ng.directive(directiveName, () =>
    {
        return {
            require: 'ngModel',
            restrict: 'A',
            link: function(scope, element, attrs, ngModel)
            {
                const guard = guardFactory(scope, element, attrs, ngModel);

                if(guard != null)
                {
                    navigationGuardService.registerGuard(guard);
                    scope.$on("$destroy", function()
                    {
                        navigationGuardService.unregisterGuard(guard);
                    });   
                }
            },
        };
    });
};

export const resetGuardDirective: Directive = generateGuardDirective('resetGuard', () => {
    return null;
});

export const inputGuardDirective: Directive = generateGuardDirective('inputGuard', (scope, element, attrs, ngModel) => {
    return new InputGuard<any>(() => ngModel.$viewValue, () => ngModel.$viewValue);
});

export const documentGuardDirective: Directive = generateGuardDirective('documentGuard', (scope, element, attrs, ngModel) => {
    return new InputGuard<Element>(() => ngModel.$modelValue && ngModel.$modelValue.id,
        () => ngModel.$modelValue ? ngModel.$modelValue.id : undefined,
        (a, b) => {
            if (a && b) {
                return a._id == b._id;
            } else {
                return !a && !b;
            }
        });
});