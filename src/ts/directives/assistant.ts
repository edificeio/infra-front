import { ng } from '../ng-start';
import { quickstart } from '../quickstart';
import { ui } from '../ui';
import { $ } from '../libs/jquery/jquery';

export let assistant = ng.directive('assistant', function(){
    return {
        restrict: 'E',
        templateUrl: '/infra/public/template/assistant.html',
        link: function(scope, element, attributes){

            if($(window).width() <= ui.breakpoints.fatMobile){
                return;
            }

            scope.show = { assistant: false };

            var token;
            var hidePulsars = function(){
                $('.pulsar-button').addClass('hidden');
                token = setTimeout(hidePulsars, 50);
                // cache TOUS les pulsars
            }

            quickstart.load(function(){
                if(quickstart.state.assistant === -1 || quickstart.mySteps.length === 0){
                    return;
                }

                hidePulsars();
                scope.show.assistant = true;
                scope.currentStep = quickstart.assistantIndex;
                scope.steps = quickstart.mySteps;
                scope.$apply();
            });

            scope.goTo = function(step){
                quickstart.goTo(step.index);
                scope.currentStep = quickstart.assistantIndex;
            };

            scope.next = function(){
                quickstart.nextAssistantStep();
                scope.currentStep = quickstart.assistantIndex;
                if(!quickstart.assistantIndex){
                    scope.show.assistant = false;
                    $('.pulsar-button').removeClass('hidden');
                    clearTimeout(token);
                }
            };

            scope.previous = function(){
                quickstart.previousAssistantStep();
                scope.currentStep = quickstart.assistantIndex;
            };

            scope.seeLater = function(){
                scope.show.assistant = false;
                $('.pulsar-button').removeClass('hidden');
                clearTimeout(token);
            };

            scope.closeAssistant = function(){
                scope.show.assistant = false;
                $('.pulsar-button').removeClass('hidden');
                clearTimeout(token);
                quickstart.state.assistant = -1;
                quickstart.save();
            };
        }
    }
});