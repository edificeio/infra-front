import { ng } from '../ng-start';
import { devices } from '../globals';

export const completeChange = ng.directive('completeChange', function() {
	return {
		restrict: 'A',
		scope:{
			exec: '&completeChange',
			field: '=ngModel'
		},
		link: function(scope, element, attributes) {
			scope.$watch('field', function(newVal) {
				element.val(newVal);
				if(element[0].type === 'textarea' && element.hasClass('inline-editing')){
					setTimeout(function(){
						element.height(1);
						element.height(element[0].scrollHeight - 1);
					}, 100);

				}
			});

            let event = "change";
            if(devices.isIE){
                event = "blur";
            }

			element.on(event, function() {
				scope.field = element.val();
				if(!scope.$$phase){
					scope.$apply('field');
				}
				scope.$parent.$eval(scope.exec);
				if(!scope.$$phase){
					scope.$apply('field');
				}
			});
		}
	};
});