import { Directive, ng } from "../ng-start";
import { INavigationGuard, InputGuard, navigationGuardService, AngularJSRouteChangeListener, DOMRouteChangeListener, ObjectGuard, ManualChangeListener, TemplateRouteChangeListener } from "../navigationGuard";
import { Element } from "../workspace/model";


export const guardRootDirective: Directive = ng.directive('guardRoot', () => {
    return {
        restrict: 'A',
        controller: ["$scope", "$attrs", function ($scope, $attrs) {

            let rootID: string;
            if ($attrs.guardRoot != null && $attrs.guardRoot != "")
                rootID = $attrs.guardRoot;
            else
                rootID = navigationGuardService.generateID();

            let angularRCL = AngularJSRouteChangeListener.getInstance($scope.$root);
            navigationGuardService.registerListener(angularRCL);
            navigationGuardService.registerListener(DOMRouteChangeListener.getInstance());
            navigationGuardService.registerListener(TemplateRouteChangeListener.getInstance());

            $scope.$on("$destroy", function () {
                navigationGuardService.unregisterListener(angularRCL);
                navigationGuardService.unregisterListener(DOMRouteChangeListener.getInstance());
                navigationGuardService.unregisterListener(TemplateRouteChangeListener.getInstance());
                navigationGuardService.unregisterRoot(rootID);
            });

            this.registerGuard = function (guard: INavigationGuard) {
                navigationGuardService.registerGuard(rootID, guard);
            };

            this.unregisterGuard = function (guard: INavigationGuard) {
                navigationGuardService.unregisterGuard(rootID, guard);
            };

            this.reset = function () {
                navigationGuardService.reset(rootID);
            };
        }],
    }
});

function generateGuardDirective(directiveName: string, guardFactory: (scope, element, attrs, ngModel) => INavigationGuard): Directive {
    return ng.directive(directiveName, () => {
        return {
            require: ['?ngModel', '?^^guardRoot'],
            restrict: 'A',
            link: function (scope, element, attrs, requires) {
                let ngModel = requires[0];
                let root = requires[1];
                const guard = guardFactory(scope, element, attrs, ngModel);
                let count = 0;
                if (guard != null) {
                    if (ngModel) {
                        ngModel.$formatters.push((value) => {
                            if (count == 0) {
                                setTimeout(() => guard.reset());
                                count++;
                            }
                            return value;
                        });
                    } else {
                        setTimeout(() => guard.reset());
                    }
                    if (root != null) {
                        root.registerGuard(guard);
                        scope.$on("$destroy", function () {
                            root.unregisterGuard(guard);
                        });
                    }
                    else {
                        let id: string = navigationGuardService.registerIndependantGuard(guard);
                        scope.$on("$destroy", function () {
                            navigationGuardService.unregisterIndependantGuard(id);
                        });
                    }
                }
            },
        };
    });
};

export const resetGuardDirective: Directive = ng.directive('resetGuard', () => {
    return {
        require: '?^guardRoot',
        restrict: 'A',
        link: function (scope, element, attrs, root) {
            let resetID = attrs.resetGuardId;
            const submit = async () => {
                const promise: Promise<any> = scope.$eval(attrs.resetGuard)
                if (promise instanceof Promise) {
                    await promise;//reset if promise return success
                } else {
                    console.warn("[resetGuard] result is not instance of Promise");
                }
                if (resetID != null && resetID != "") {
                    navigationGuardService.reset(resetID);
                }
                else if (root != null) {
                    root.reset();
                }
                else {
                    console.warn("[resetGuard] A reset directive has no root, resetting all guards...");
                    navigationGuardService.resetAll();
                }
            }
            const bind = () => {
                let event: string = attrs.resetGuardEvent;
                if(typeof event != "string" || !event.trim())
                {
                    const tagname = (element.prop("tagName") as string || "").toLowerCase();
                    if (tagname == "form") {
                        event = "submit";
                    } else {
                        event = "click";
                    }
                }

                element.on(event, submit);
                return () => element.off(event, submit);
            }
            const unbind = bind();
            scope.$on("$destroy", function () {
                unbind();
            });
        }
    };
});

export const guardIgnoreTemplate: Directive = ng.directive('guardIgnoreTemplate', function () {
    return {
        require: ['?container', '?guardRoot'],
        restrict: "A",
        link: function (scope, element, attrs, requires) {
            const container = requires[0];
            const guardRoot = requires[1];
            const instance = TemplateRouteChangeListener.getInstance();
            if(guardRoot){
                instance.setTriggerByDefault(false);
                return;
            }
            let templateName = container.template;

            if (templateName == null)
                console.error("Container directive doesn't have a template attribute. Did its implementation change ?");
            else {
                instance.addIgnoreContainer(templateName);
                scope.$on("$destroy", function () { instance.removeIgnoreContainer(templateName); });
            }
        }
    };
});

export const guardTriggerTemplate: Directive = ng.directive('guardTriggerTemplate', function () {
    return {
        require: ['?container', '?guardRoot'],
        restrict: "A",
        link: function (scope, element, attrs, requires) {
            const container = requires[0];
            const guardRoot = requires[1];
            const instance = TemplateRouteChangeListener.getInstance();

            if(guardRoot){
                instance.setTriggerByDefault(true);
                return;
            }

            let templateName = container.template;

            if (templateName == null)
                console.error("Container directive doesn't have a template attribute. Did its implementation change ?");
            else {
                instance.addTriggerContainer(templateName);
                scope.$on("$destroy", function () { instance.removeTriggerContainer(templateName); });
            }
        }
    };
});

export const inputGuardDirective: Directive = generateGuardDirective('inputGuard', (scope, element, attrs, ngModel) => {
    return new InputGuard<any>(() => ngModel.$viewValue || "", () => ngModel.$viewValue || "");
});

export const dirtyGuardDirective: Directive = generateGuardDirective('dirtyGuard', (scope, element, attrs, ngModel) => {
    return new InputGuard<any>(() => ngModel.$dirty, () => false);
});

export const documentGuardDirective: Directive = generateGuardDirective('documentGuard', (scope, element, attrs, ngModel) => {
    return new InputGuard<Element>(() => typeof ngModel.$modelValue == "object" ? ngModel.$modelValue.id || "" : "",
        () => typeof ngModel.$modelValue == "object" ? ngModel.$modelValue.id || "" : "",
        (a, b) => {
            if (a && b) {
                return a._id == b._id;
            } else {
                return !a && !b;
            }
        });
});

export const customGuardDirective: Directive = generateGuardDirective('customGuard', (scope, element, attrs) => {
    const temp = new ObjectGuard(() => scope.$eval(attrs.customGuard));
    scope.$watch(function() {
        return scope.$eval(attrs.customGuard);
    }, function(){
        temp.reset();
    });
    return temp;
});

interface INavigationTriggerParam {
    onEvent?:string|Array<string>;
    rootGuardId?:string;
    guardMessageKey?:string;
};

class NavigationTriggerDirective {
    restrict: "A";
    link(scope, element, attrs) {
        const params:INavigationTriggerParam =  scope.$eval(attrs['navigationTriggerParam'] || "{onEvent:'click'}");
        params.rootGuardId = params.rootGuardId || '*';
        const listener = new ManualChangeListener;
        navigationGuardService.registerListener(listener);
        let unbinds:Array<Function> = [];
        const trigger = (e: Event) => {
            e && e.preventDefault();
            listener.onChange.next({
                checkGuardId: params.rootGuardId, // Can be null or undefined
                confirmMessageKey: params.guardMessageKey, // Defaults to 'navigation.guard.text' when null or undefined, see navigationGuardService
                accept() {
                    scope.$eval(attrs.navigationTrigger)
                },
                reject() { }
            })
        }

        const bind = (element, eventName:string, listener:Function):void => {
            element.on(eventName, listener);
            unbinds.push( () => element.off(eventName, listener) );
        }

        const unbindAll = ():void => {
            for( let off of unbinds ) {
                off();
            }
            unbinds = [];
        }

        if( angular.isString(params.onEvent) ) {
            bind( element, params.onEvent as string, trigger );
        } else if( angular.isArray(params.onEvent) ) {
            (params.onEvent as Array<string>).forEach( (n, idx, arr) => {
                // listen to distinct event only once.
                if( angular.isString(n) && arr.lastIndexOf(n)===idx ) {
                    bind( element, n, trigger );
                }
            });
        }
        scope.$on("$destroy", () => {
            unbindAll();
            navigationGuardService.unregisterListener(listener);
        });
    }
};

/**
 * Usage:
 * 
 * &lt;div  navigation-trigger="doSomethingUsefulWhenNavigationConfirmed()" 
 * 
 *   navigation-trigger-param="{onEvent:['click','focus'], confirmMessageKey:'my.msg.key', rootGuardId:'myGuardId'}"&gt;
 * 
 * &lt;/div&gt; 
 * 
 * @param navigation-trigger-param [optional]
 * @values onEvent to specify one or more event that effectively trigger the guard,
 * Set confirmMessageKey to set a i18n for the confirm dialog message,
 * Set rootGuardId to trigger only the guard with specified the ID (useful when nesting guards).
 */
export const navigationTrigger: Directive = ng.directive('navigationTrigger', () => new NavigationTriggerDirective());