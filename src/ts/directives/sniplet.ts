import { ng, Directive } from '../ng-start';
import { Behaviours } from '../behaviours';

export let sniplet = ng.directive('sniplet', ['$timeout', function($timeout){
	return {
		restrict: 'E',
		scope: true,
		template: "<div ng-include=\"'/' + application + '/public/template/behaviours/sniplet-' + template + '.html'\"></div>",
		link: function(scope, element, attributes){
			const refresh = () => {
				$timeout(function(){
					Behaviours.loadBehaviours(scope.application, function(behaviours){
						const sniplet = behaviours.sniplets[scope.template];
						
						const snipletControllerExpansion = behaviours.sniplets[scope.template].controller;
						for(var prop in snipletControllerExpansion){
							scope[prop] = snipletControllerExpansion[prop];
						}
						if(typeof scope.init === 'function'){
							scope.init();
						}
					});
				}, 10);
			};

			attributes.$observe('application', () => {
				scope.application = attributes.application;
				scope.source = scope.$eval(attributes.source);
				refresh();
			});
			attributes.$observe('template', () => {
				scope.template = attributes.template;
			});
		}
	}
}]);

export let snipletSource = ng.directive('snipletSource', ['$parse', '$timeout', function($parse, $timeout){
	return {
		restrict: 'E',
		scope: true,
		template: "<div ng-include=\"'/' + application + '/public/template/behaviours/sniplet-source-' + template + '.html'\"></div>",
		controller: ['$scope', '$timeout', function($scope, $timeout){
			$scope.setSnipletSource = function(source){
				$scope.ngModel.assign($scope, source);
                $scope.ngChange();
                $scope.snipletResource.save();
			};
		}],
		link: function(scope, element, attributes){
			const refresh = () => {
				$timeout(function(){
					Behaviours.loadBehaviours(scope.application, function(behaviours){
						const sniplet = behaviours.sniplets[scope.template];
						if(!sniplet){
							return;
						}

						const snipletControllerExpansion = behaviours.sniplets[scope.template].controller;
						for(var prop in snipletControllerExpansion){
							scope[prop] = snipletControllerExpansion[prop];
						}
						if(typeof scope.initSource === 'function'){
							scope.initSource();
						}
					});
				}, 10);
			};

			attributes.$observe('application', () => {
				scope.application = attributes.application;
				refresh();
			});
			attributes.$observe('template', () => {
				scope.template = attributes.template;
			});

			scope.template = attributes.template;
			scope.ngModel = $parse(attributes.ngModel);
			scope.ngChange = function(){
				scope.$eval(attributes.ngChange);
			}
		}
	}
}]);