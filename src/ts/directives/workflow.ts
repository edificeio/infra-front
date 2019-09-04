import { ng } from '../ng-start';
import { model } from '../modelDefinitions';
import { Behaviours } from '../behaviours';

const workflowDirectiveLinkBuilder = (name:string) =>
	(func: (right: boolean, content: any, element: any) => void) =>
		function (scope, element, attributes) {
			attributes.$observe(name, async () => {
				const auth = attributes[name].split('.');
				if (!Behaviours.applicationsBehaviours[auth[0]]) {
					throw "Behaviours from application " + auth[0] + " missing";
				}
				if (Behaviours.applicationsBehaviours[auth[0]].callbacks) {
					await Behaviours.load(auth[0]);
				}
				let right = model.me && model.me.workflow;
				const workflow = !!(right && right[auth[0]]);
				const content = element.children();
				if (!right || !workflow) {
					func(false, content, element);
					return;
				}
				auth.forEach(function (prop) {
					right = right[prop];
				});
				func(right, content, element);
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