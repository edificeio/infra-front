import { ng } from '../ng-start';
import { model } from '../modelDefinitions';
import { Behaviours } from '../behaviours';

export let workflow = ng.directive('workflow', ['$compile', function($compile){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
			attributes.$observe('workflow', async () => {
				const auth = attributes.workflow.split('.');
                if(!Behaviours.applicationsBehaviours[auth[0]]){
                    throw "Behaviours from application " + auth[0] + " missing";
                }
                if(Behaviours.applicationsBehaviours[auth[0]].callbacks){
                    await Behaviours.load(auth[0]);
                }
				let right = model.me && model.me.workflow;
				const content = element.children();

				if(!right){
					content.remove();
					element.hide();
					return;
				}
				auth.forEach(function(prop){
					right = right[prop];
				});
				
				if(!right){
					content.remove();
					element.hide();
				}
				else{
					element.show();
					element.append(content);
				}
			});
		}
	}
}]);