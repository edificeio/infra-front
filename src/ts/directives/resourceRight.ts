import { ng } from '../ng-start';
import { Model } from '../modelDefinitions';
import { _ } from '../libs/underscore/underscore';

export let resourceRight = ng.directive('resourceRight', ($compile) => {
    return {
        restrict: 'EA',
        template: '<div></div>',
        replace: false,
        transclude: true,
        scope: {
            resource: '=',
            name: '@'
        },
        controller: function ($scope, $transclude) {
            this.transclude = $transclude;
        },
        link: function (scope, element, attributes, controller) {
            if (attributes.name === undefined) {
                throw "Right name is required";
            }
            var content = element.children('div');
            var transcludeScope;

            var switchHide = function () {
                let hide = true;
                if (scope.resource !== undefined) {
                    hide = attributes.name && 
                    (
                        (
                            scope.resource instanceof Array && 
                            scope.resource.find(resource => !resource.myRights || resource.myRights[attributes.name] !== true ) !== undefined
                        )
                            ||
                        (
                            scope.resource instanceof Model && 
                            (
                                !scope.resource.myRights || scope.resource.myRights[attributes.name] === undefined
                            )
                        )
                        || 
                        (
                            scope.resource.myRights && scope.resource.myRights[attributes.name] === undefined
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
                        controller.transclude(function (clone, newScope) {
                            transcludeScope = newScope;
                            content.append(clone);
                        });
                    }
                    element.show();
                }
            };

            attributes.$observe('name', switchHide);
            scope.$watchCollection('resource', switchHide);
        }
    }
});