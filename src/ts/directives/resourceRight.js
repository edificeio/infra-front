"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var modelDefinitions_1 = require("../modelDefinitions");
exports.resourceRight = ng_start_1.ng.directive('resourceRight', function () {
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
                var hide = true;
                if (scope.resource !== undefined) {
                    hide = attributes.name &&
                        ((scope.resource instanceof Array &&
                            scope.resource.find(function (resource) {
                                return !resource.myRights ||
                                    (resource.myRights[attributes.name] !== true &&
                                        !(resource.myRights[attributes.name] && resource.myRights[attributes.name].right));
                            }) !== undefined)
                            ||
                                (scope.resource instanceof modelDefinitions_1.Model &&
                                    (!scope.resource.myRights || scope.resource.myRights[attributes.name] === undefined))
                            ||
                                (scope.resource.myRights && scope.resource.myRights[attributes.name] === undefined));
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
    };
});
//# sourceMappingURL=resourceRight.js.map