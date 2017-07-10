"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var globals_1 = require("../globals");
var jquery_1 = require("../libs/jquery/jquery");
var modelDefinitions_1 = require("../modelDefinitions");
var underscore_1 = require("../libs/underscore/underscore");
exports.wizard = ng_start_1.ng.directive('wizard', function () {
    return {
        restrict: 'E',
        templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/wizard.html',
        scope: {
            onCancel: '&',
            onFinish: '&',
            finishCondition: '&'
        },
        transclude: true,
        compile: function (element, attributes, transclude) {
            return function (scope, element, attributes) {
                element.find('div.steps step').each(function (index, step) {
                    if (jquery_1.$(step).attr('workflow')) {
                        var auth = jquery_1.$(step).attr('workflow').split('.');
                        var right_1 = modelDefinitions_1.model.me.workflow;
                        auth.forEach(function (prop) {
                            right_1 = right_1[prop];
                        });
                        if (!right_1) {
                            jquery_1.$(step).remove();
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
                steps.each(function (index, item) {
                    nav.children('ul').append('<li>' + jquery_1.$(item).find('h1').html() + '</li>');
                });
                function displayCurrentStep() {
                    transclude(scope.$parent.$new(), function (content) {
                        currentStepContent = underscore_1._.filter(content, function (el) {
                            return el.tagName === 'STEP';
                        })[scope.currentStep];
                        scope.internalNext = jquery_1.$(currentStepContent).attr('internal-next') !== undefined;
                        currentStepContent = jquery_1.$(currentStepContent);
                        element
                            .find('.current-step .step-content')
                            .html('')
                            .append(currentStepContent);
                    });
                    element.find('.current-step .step-content step [internal-next]').on('click', function () {
                        scope.nextStep();
                    });
                    jquery_1.$('nav.steps li').removeClass('active');
                    jquery_1.$(element.find('nav.steps li')[scope.currentStep]).addClass('active');
                }
                scope.nextCondition = function () {
                    var stepScope = angular.element(currentStepContent[0]).scope();
                    if (typeof stepScope.nextCondition() === 'undefined')
                        return true;
                    return stepScope.nextCondition();
                };
                scope.nextStep = function () {
                    if (!scope.nextCondition())
                        return;
                    var stepScope = angular.element(currentStepContent[0]).scope();
                    stepScope.onNext();
                    scope.currentStep++;
                    displayCurrentStep();
                };
                scope.previousStep = function () {
                    var stepScope = angular.element(currentStepContent[0]).scope();
                    stepScope.onPrevious();
                    scope.currentStep--;
                    displayCurrentStep();
                };
                scope.cancel = function () {
                    scope.currentStep = 0;
                    displayCurrentStep();
                    scope.onCancel();
                };
                scope.checkFinishCondition = function () {
                    if (typeof scope.finishCondition() === 'undefined')
                        return true;
                    return scope.finishCondition();
                };
                scope.finish = function () {
                    if (!scope.checkFinishCondition())
                        return;
                    scope.currentStep = 0;
                    displayCurrentStep();
                    scope.onFinish();
                };
                displayCurrentStep();
            };
        }
    };
});
exports.wizardStep = ng_start_1.ng.directive('step', function () {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            onNext: '&',
            onPrevious: '&',
            nextCondition: '&'
        },
        template: '<div class="step" ng-transclude></div>'
    };
});
//# sourceMappingURL=wizard.js.map