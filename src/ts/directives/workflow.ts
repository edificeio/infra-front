import { ng } from '../ng-start';
import { model } from '../modelDefinitions';
import { Behaviours } from '../behaviours';

const workflowDirectiveLinkBuilder = (name:string) =>
	(func: (right: boolean, content: any, element: any) => void) =>
		function (scope, element, attributes) {
			attributes.$observe(name, async () => {
				const content = element.children();
				try{
					if (!attributes[name]) {
						func(true, content, element);
						return;
					}
					
					const auth = attributes[name].split('.');
					if (!Behaviours.applicationsBehaviours[auth[0]]) {
						throw "Behaviours from application " + auth[0] + " missing";
					}
					if (Behaviours.applicationsBehaviours[auth[0]].callbacks) {
						await Behaviours.load(auth[0]);
					}
					let right = model.me && model.me.workflow;
					const workflow = !!(right && right[auth[0]]);
					if(model.me.functions["SUPER_ADMIN"]) {
						func(true, content, element);
						return;
					}
					if (!right || !workflow) {
						func(false, content, element);
						return;
					}
					auth.forEach(function (prop) {
						right = right[prop];
					});
					func(right, content, element);
				}catch(e){
					func(false, content, element);
					throw e;
				}
			});
		};

export let workflow = ng.directive('workflow', ['$compile', function($compile){
	return {
		restrict: 'A',
		link: workflowDirectiveLinkBuilder('workflow')(
			(right, content, element) => {
				if (!right) {
					content.remove();
					element.hide();
				}
				else {
					element.show();
					element.append(content);
				}
			}
		)
	}
}]);

export let workflowNot = ng.directive('workflowNot', ['$compile', function ($compile) {
	return {
		restrict: 'A',
		link: workflowDirectiveLinkBuilder('workflowNot')(
			(right, content, element) => {
				if (right) {
					content.remove();
					element.hide();
				}
				else {
					element.show();
					element.append(content);
				}
			}
		)
	}
}]);