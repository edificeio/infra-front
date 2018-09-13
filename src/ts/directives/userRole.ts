import { model } from '../modelDefinitions';
import { ng, Directive } from '../ng-start';

export const userRole = ng.directive('userRole', function(){
	return {
		restrict: 'A',
		link: function($scope, $element, $attributes){
			var auth = $attributes.userRole;
			if(!model.me.functions[auth]){
				$element.hide();
			}
			else{
				$element.show();
			}
		}
	}
});

export const userMissingRole = ng.directive('userMissingRole', function(){
	return {
		restrict: 'A',
		link: function($scope, $element, $attributes){
			var auth = $attributes.userMissingRole;
			if(model.me.functions[auth]){
				$element.hide();
			}
			else{
				$element.show();
			}
		}
	}
});