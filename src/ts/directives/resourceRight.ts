﻿import { ng } from '../ng-start';
import { Model } from '../modelDefinitions';
import { _ } from '../libs/underscore/underscore';

export let resourceRight = ng.directive('resourceRight', ['$parse', ($parse) => {
    return {
        restrict: 'EA',
        template: '<div></div>',
        replace: false,
        transclude: true,
        compile: function (element, attributes, transclude) {
            return function (scope, element, attributes) {
                const resource = $parse(attributes.resource);
                
                if (attributes.name === undefined) {
                    throw "Right name is required";
                }
                var content = element.children('div');
                var transcludeScope;

                var switchHide = function () {
                    let hide = true;
                    if (resource(scope) !== undefined) {
                        hide = attributes.name && 
                        (
                            (
                                resource(scope) instanceof Array && 
                                resource(scope).find(resource => 
                                    !resource.myRights || 
                                    (
                                        resource.myRights[attributes.name] !== true && 
                                        !(resource.myRights[attributes.name] && resource.myRights[attributes.name].right)
                                    )
                                ) !== undefined
                            )
                                ||
                            (
                                resource(scope) instanceof Model && 
                                (
                                    !resource(scope).myRights || resource(scope).myRights[attributes.name] === undefined
                                )
                            )
                            || 
                            (
                                resource(scope).myRights && resource(scope).myRights[attributes.name] === undefined
                            )
                        );
                    }

                    if (hide) {
                        if (transcludeScope) {
                            transcludeScope.$destroy();
                            transcludeScope = null;
                        }
                        content.children().remove();
                        element.hide();
                    }
                    else {
                        if (!transcludeScope) {
                            transclude(scope, function (clone, newScope) {
                                transcludeScope = newScope;
                                content.append(clone);
                            });
                        }
                        element.show();
                    }
                };

                attributes.$observe('name', () => switchHide);
                scope.$watch(() => resource(scope), () => switchHide());
            }
        }
    }
}]);