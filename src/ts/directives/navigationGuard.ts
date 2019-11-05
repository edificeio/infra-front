import { Directive, ng } from "../ng-start";
import { INavigationGuard, InputGuard, navigationGuardService, AngularJSRouteChangeListener, DOMRouteChangeListener } from "../navigationGuard";
import { Element } from "../workspace/model";


export const guardRootDirective: Directive = ng.directive('guardRoot', () =>
{
    return {
        restrict: 'A',
        controller: ["$scope", "$attrs", function ($scope, $attrs)
        {

            let rootID: string;
            if($attrs.guardRoot != null && $attrs.guardRoot != "")
                rootID = $attrs.guardRoot;
            else
                rootID = navigationGuardService.generateID();

            let angularRCL = AngularJSRouteChangeListener.getInstance($scope.$root);
            navigationGuardService.registerListener(angularRCL);
            navigationGuardService.registerListener(DOMRouteChangeListener.getInstance());

            $scope.$on("$destroy", function()
            {
                navigationGuardService.unregisterListener(angularRCL);
                navigationGuardService.unregisterRoot(rootID);
            });

            this.registerGuard = function(guard: INavigationGuard)
            {
                navigationGuardService.registerGuard(rootID, guard);
            };

            this.unregisterGuard = function(guard: INavigationGuard)
            {
                navigationGuardService.unregisterGuard(rootID, guard);
            };

            this.reset = function()
            {
                navigationGuardService.reset(rootID);
            };
        }],
    }
});

function generateGuardDirective(directiveName: string, guardFactory: (scope, element, attrs, ngModel) => INavigationGuard): Directive
{
    return ng.directive(directiveName, () =>
    {
        return {
            require: [ 'ngModel', '?^^guardRoot' ],
            restrict: 'A',
            link: function(scope, element, attrs, requires)
            {
                let ngModel = requires[0];
                let root = requires[1];
                const guard = guardFactory(scope, element, attrs, ngModel);

                if(guard != null)
                {
                    if(root != null)
                    {
                        root.registerGuard(guard);
                        scope.$on("$destroy", function()
                        {
                            root.unregisterGuard(guard);
                        });
                    }
                    else
                    {
                        let id: string = navigationGuardService.registerIndependantGuard(guard);
                        scope.$on("$destroy", function()
                        {
                            navigationGuardService.unregisterIndependantGuard(id);
                        });
                    }
                }
            },
        };
    });
};

export const resetGuardDirective: Directive = ng.directive('resetGuard', () =>
{
    return {
        require: '?^^guardRoot',
        restrict: 'A',
        link: function(scope, element, attrs, root)
        {
            let resetID = attrs.resetGuard;
            element.on("click", function()
            {
                if(resetID != null && resetID != "")
                {
                    navigationGuardService.reset(resetID);
                }
                else if(root != null)
                {
                    root.reset();
                }
                else
                {
                    console.warn("A reset directive has no root, resetting all guards...");
                    navigationGuardService.resetAll();
                }
            });
        }
    };
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