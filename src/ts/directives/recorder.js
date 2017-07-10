"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var globals_1 = require("../globals");
var ng_start_1 = require("../ng-start");
var recorder_1 = require("../recorder");
exports.recorderComponent = ng_start_1.ng.directive('recorder', function () {
    return {
        restrict: 'E',
        scope: {
            format: '@',
            onUpload: '&'
        },
        templateUrl: '/' + globals_1.appPrefix + '/public/template/entcore/recorder.html',
        link: function (scope, element, attributes) {
            scope.recorder = recorder_1.recorder;
            recorder_1.recorder.state(function (eventName) {
                if (eventName === 'saved') {
                    scope.onUpload();
                }
                scope.$apply('recorder');
            });
            scope.switchRecord = function () {
                if (recorder_1.recorder.status === 'recording') {
                    recorder_1.recorder.pause();
                }
                else {
                    recorder_1.recorder.record();
                }
            };
            scope.time = function () {
                var minutes = parseInt(recorder_1.recorder.elapsedTime / 60);
                if (minutes < 10) {
                    minutes = '0' + minutes;
                }
                var seconds = parseInt(recorder_1.recorder.elapsedTime % 60);
                if (seconds < 10) {
                    seconds = '0' + seconds;
                }
                return minutes + ':' + seconds;
            };
            scope.switchPlay = function () {
                if (recorder_1.recorder.status === 'playing') {
                    recorder_1.recorder.pause();
                }
                else {
                    recorder_1.recorder.play();
                }
            };
            scope.saveRecord = function () {
                recorder_1.recorder.save();
            };
        }
    };
});
//# sourceMappingURL=recorder.js.map