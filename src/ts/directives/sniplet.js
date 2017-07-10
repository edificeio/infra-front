"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var behaviours_1 = require("../behaviours");
exports.sniplet = ng_start_1.ng.directive('sniplet', function () {
    return {
        restrict: 'E',
        scope: true,
        controller: function ($scope, $timeout) {
            $timeout(function () {
                behaviours_1.Behaviours.loadBehaviours($scope.application, function (behaviours) {
                    var snipletControllerExpansion = behaviours.sniplets[$scope.template].controller;
                    for (var prop in snipletControllerExpansion) {
                        $scope[prop] = snipletControllerExpansion[prop];
                    }
                    if (typeof $scope.init === 'function') {
                        $scope.init();
                    }
                });
            }, 1);
        },
        template: "<div ng-include=\"'/' + application + '/public/template/behaviours/sniplet-' + template + '.html'\"></div>",
        link: function (scope, element, attributes) {
            scope.application = attributes.application;
            scope.template = attributes.template;
            scope.source = scope.$eval(attributes.source);
        }
    };
});
exports.snipletSource = ng_start_1.ng.directive('snipletSource', ['$parse', function ($parse) {
        return {
            restrict: 'E',
            scope: true,
            template: "<div ng-include=\"'/' + application + '/public/template/behaviours/sniplet-source-' + template + '.html'\"></div>",
            controller: function ($scope, $timeout) {
                $scope.setSnipletSource = function (source) {
                    $scope.ngModel.assign($scope, source);
                    $scope.ngChange();
                    $scope.snipletResource.save();
                };
                $timeout(function () {
                    behaviours_1.Behaviours.loadBehaviours($scope.application, function (behaviours) {
                        var snipletControllerExpansion = behaviours.sniplets[$scope.template].controller;
                        for (var prop in snipletControllerExpansion) {
                            $scope[prop] = snipletControllerExpansion[prop];
                        }
                        if (typeof $scope.initSource === 'function') {
                            $scope.initSource();
                        }
                    });
                }, 1);
            },
            link: function (scope, element, attributes) {
                scope.application = attributes.application;
                scope.template = attributes.template;
                scope.ngModel = $parse(attributes.ngModel);
                scope.ngChange = function () {
                    scope.$eval(attributes.ngChange);
                };
            }
        };
    }]);
//# sourceMappingURL=sniplet.js.map