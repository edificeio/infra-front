import { ng, Directive } from '../ng-start';

export const inputPassword = ng.directive('inputPassword', function(){
	return {
		restrict: 'E',
		replace: false,
		template:
			'<input type="password"/>' +
			'<button type="button" \
				ng-mousedown="show(true)" \
				ng-touchstart="show(true)" \
				ng-touchend="show(false)" \
				ng-mouseup="show(false)" \
				ng-mouseleave="show(false)"></button>',
		scope: true,
		compile: function(element, attributes){
			element.addClass('toggleable-password');
			var passwordInput = element.children('input[type=password]');
			for(var prop in attributes.$attr){
				passwordInput.attr(attributes.$attr[prop], attributes[prop]);
				element.removeAttr(attributes.$attr[prop]);
			}
			return function(scope){
				scope.show = function(bool){
					passwordInput[0].type = bool ? "text" : "password";
				}
			};
		}
	}
});