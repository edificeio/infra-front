import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { $ } from "../libs/jquery/jquery";
import { model } from "../modelDefinitions";
import { _ } from "../libs/underscore/underscore";

export let wizard = ng.directive('wizard', () => {
	return {
		restrict: 'E',
		templateUrl: '/' + appPrefix + '/public/template/entcore/wizard.html',
		scope: {
			onCancel: '&',
			onFinish: '&',
			finishCondition: '&'
		},
		transclude: true,
		compile: function(element, attributes, transclude){
			return function(scope, element, attributes){
				element.find('div.steps step').each((index, step) => {
					if($(step).attr('workflow')){
                        let auth = $(step).attr('workflow').split('.');
                        let right = model.me.workflow;
                        auth.forEach(function (prop) {
                            right = right[prop];
                        });
                        if (!right) {
                            $(step).remove();
                        }
                    }
				});

				element.find('div.steps').hide();
				scope.currentStep = 0;

				var currentStepContent;
				var steps = element.find('div.steps step');
				scope.nbSteps = steps.length;

				var nav = element.find('nav.steps');
				nav.append('<ul></ul>');
				steps.each(function(index, item){
					nav.children('ul').append('<li>' + $(item).find('h1').html() + '</li>');
				});

				function displayCurrentStep(){
					transclude(scope.$parent.$new(), function(content){
						currentStepContent = _.filter(content, function(el){
							return el.tagName === 'STEP';
                        })[scope.currentStep];
                        scope.internalNext = $(currentStepContent).attr('internal-next') !== undefined;
						currentStepContent = $(currentStepContent);
						element
							.find('.current-step .step-content')
							.html('')
                            .append(currentStepContent);
					});

                    element.find('.current-step .step-content step [internal-next]').on('click', () => {
                        scope.nextStep();
                    });
					$('nav.steps li').removeClass('active');
					$(element.find('nav.steps li')[scope.currentStep]).addClass('active');
				}

				scope.nextCondition = function(){
					var stepScope = angular.element(currentStepContent[0]).scope();
					if(typeof stepScope.nextCondition() === 'undefined')
						return true;
					return stepScope.nextCondition();
				};

				scope.nextStep = function(){
					if(!scope.nextCondition())
						return

					var stepScope = angular.element(currentStepContent[0]).scope();
					stepScope.onNext();
					scope.currentStep++;
					displayCurrentStep();
				};

				scope.previousStep = function(){
					var stepScope = angular.element(currentStepContent[0]).scope();
					stepScope.onPrevious();
					scope.currentStep--;
					displayCurrentStep();
				};

				scope.cancel = function(){
					scope.currentStep = 0;
					displayCurrentStep();
					scope.onCancel();
				};

				scope.checkFinishCondition = function(){
					if(typeof scope.finishCondition() === 'undefined')
						return true;
					return scope.finishCondition();
				};

				scope.finish = function(){
					if(!scope.checkFinishCondition())
						return

					scope.currentStep = 0;
					displayCurrentStep();
					scope.onFinish();
				};

				displayCurrentStep();
			}
		}
	}
});

export let wizardStep = ng.directive('step', () => {
	return {
		restrict: 'E',
		transclude: true,
		scope: {
			onNext: '&',
			onPrevious: '&',
			nextCondition: '&'
		},
		template: '<div class="step" ng-transclude></div>'
	}
});