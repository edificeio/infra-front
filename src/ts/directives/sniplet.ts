import { ng } from '../ng-start';
import { Behaviours } from '../behaviours';

export let sniplet = ng.directive('sniplet', function(){
	return {
		restrict: 'E',
		scope: true,
		controller: function($scope, $timeout){
			$timeout(function(){
				Behaviours.loadBehaviours($scope.application, function(behaviours){
					var snipletControllerExpansion = behaviours.sniplets[$scope.template].controller;
					for(var prop in snipletControllerExpansion){
						$scope[prop] = snipletControllerExpansion[prop];
					}
					if(typeof $scope.init === 'function'){
						$scope.init();
					}
				});
			}, 1);
		},
		template: "<div ng-include=\"'/' + application + '/public/template/behaviours/sniplet-' + template + '.html'\"></div>",
		link: function(scope, element, attributes){
			scope.application = attributes.application;
			scope.template = attributes.template;
			scope.source = scope.$eval(attributes.source);
		}
	}
});

export let snipletSource = ng.directive('snipletSource', ['$parse', function($parse){
	return {
		restrict: 'E',
		scope: true,
		template: "<div ng-include=\"'/' + application + '/public/template/behaviours/sniplet-source-' + template + '.html'\"></div>",
		controller: function($scope, $timeout){
			$scope.setSnipletSource = function(source){
				$scope.ngModel.assign($scope, source);
                $scope.ngChange();
                $scope.snipletResource.save();
			};

			$timeout(function(){
				Behaviours.loadBehaviours($scope.application, function(behaviours){
					var snipletControllerExpansion = behaviours.sniplets[$scope.template].controller;
					for(var prop in snipletControllerExpansion){
						$scope[prop] = snipletControllerExpansion[prop];
					}

					if(typeof $scope.initSource === 'function'){
						$scope.initSource();
					}
				});
			}, 1);
		},
		link: function(scope, element, attributes){
			scope.application = attributes.application;
			scope.template = attributes.template;
			scope.ngModel = $parse(attributes.ngModel);
			scope.ngChange = function(){
				scope.$eval(attributes.ngChange);
			}
		}
	}
}]);