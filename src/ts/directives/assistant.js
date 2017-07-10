"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var quickstart_1 = require("../quickstart");
var ui_1 = require("../ui");
var jquery_1 = require("../libs/jquery/jquery");
exports.assistant = ng_start_1.ng.directive('assistant', function () {
    return {
        restrict: 'E',
        templateUrl: '/infra/public/template/assistant.html',
        link: function (scope, element, attributes) {
            if (jquery_1.$(window).width() <= ui_1.ui.breakpoints.fatMobile) {
                return;
            }
            scope.show = { assistant: false };
            var token;
            var hidePulsars = function () {
                jquery_1.$('.pulsar-button').addClass('hidden');
                token = setTimeout(hidePulsars, 50);
                // cache TOUS les pulsars
            };
            quickstart_1.quickstart.load(function () {
                if (quickstart_1.quickstart.state.assistant === -1 || quickstart_1.quickstart.mySteps.length === 0) {
                    return;
                }
                hidePulsars();
                scope.show.assistant = true;
                scope.currentStep = quickstart_1.quickstart.assistantIndex;
                scope.steps = quickstart_1.quickstart.mySteps;
                scope.$apply();
            });
            scope.goTo = function (step) {
                quickstart_1.quickstart.goTo(step.index);
                scope.currentStep = quickstart_1.quickstart.assistantIndex;
            };
            scope.next = function () {
                quickstart_1.quickstart.nextAssistantStep();
                scope.currentStep = quickstart_1.quickstart.assistantIndex;
                if (!quickstart_1.quickstart.assistantIndex) {
                    scope.show.assistant = false;
                    jquery_1.$('.pulsar-button').removeClass('hidden');
                    clearTimeout(token);
                }
            };
            scope.previous = function () {
                quickstart_1.quickstart.previousAssistantStep();
                scope.currentStep = quickstart_1.quickstart.assistantIndex;
            };
            scope.seeLater = function () {
                scope.show.assistant = false;
                jquery_1.$('.pulsar-button').removeClass('hidden');
                clearTimeout(token);
                quickstart_1.quickstart.seeAssistantLater();
            };
            scope.closeAssistant = function () {
                scope.show.assistant = false;
                jquery_1.$('.pulsar-button').removeClass('hidden');
                clearTimeout(token);
                quickstart_1.quickstart.state.assistant = -1;
                quickstart_1.quickstart.save();
            };
        }
    };
});
//# sourceMappingURL=assistant.js.map