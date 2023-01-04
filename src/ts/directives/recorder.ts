import { appPrefix } from '../globals';
import { model } from '../modelDefinitions';
import { ng } from '../ng-start';
import { recorder } from '../recorder';
import { template } from '../template';
import { VideoRecorder } from '../video';

export let recorderComponent = ng.directive('recorder', function () {
    function safeApply($scope, fn?:()=>void) {
        const phase = $scope.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            $scope.$apply(fn);
        }
    };

    return {
        restrict: 'E',
        scope: {
            format: '@',
            onUpload: '&'
        },
        templateUrl: function(element, attributes) {
            return attributes.templateUrl || '/assets/js/entcore/template/recorder.html'
        },
        link: function (scope, element, attributes) {
            // video stuff
            scope.showCamera = false;
            scope.isVideoCompatible = () => VideoRecorder.isCompatible() && model.me.hasWorkflow("com.opendigitaleducation.video.controllers.VideoController|capture");
            if(scope.isVideoCompatible() ) {
                scope.onShowCamera = async () => {
                    const resetHandlers = [
                        scope.$on("video-upload", (event, docId) => resetCameraFlow(docId)),
                        scope.$on("video-redo", (event) => resetCameraFlow())
                    ];
                    function resetCameraFlow(docId = null) {
                        try {
                            resetHandlers.forEach( handler => typeof handler === 'function' && handler() );
                        } finally {
                            scope.showCamera = false;
                        }
                    }

                    await template.open("entcore/video/record");
                    scope.showCamera = true;
                    safeApply(scope);
                }
            }

            // audio stuff
            scope.recorder = recorder;
            recorder.state(function (eventName:string) {
                if(eventName.startsWith('saved-')){
                    let id = eventName.substring(6);
                    scope.onUpload && scope.onUpload()(id);
                }
                safeApply(scope); // Force reevaluation of the recorder's field
            });
            scope.switchRecord = function () {
                if (recorder.status === 'recording') {
                    recorder.suspend();
                }
                else {
                    recorder.record();
                }
            };
            scope.time = function () {
                var minutes = parseInt(recorder.elapsedTime / 60);
                if (minutes < 10) {
                    minutes = '0' + minutes;
                }
                var seconds = parseInt(recorder.elapsedTime % 60);
                if (seconds < 10) {
                    seconds = '0' + seconds;
                }
                return minutes + ':' + seconds;
            };
            scope.switchPlay = function () {
                if (recorder.status === 'playing') {
                    recorder.pause();
                }
                else {
                    recorder.play();
                }
            };
            scope.saveRecord = function () {
                recorder.save();
            };

            scope.redo = () => {
                recorder.flush();
                recorder.record();
            }

            scope.isIdle = () => recorder.status === 'idle';
            scope.isPreparing = () => recorder.status === 'preparing';
            scope.isRecording = () => recorder.status === 'recording';
            scope.isSuspended = () => recorder.status === 'suspended';
            scope.isPaused = () => recorder.status === 'paused';
            scope.isPlaying = () => recorder.status === 'playing';
            scope.isStopped = () => recorder.status === 'stop';
            scope.isEncoding = () => recorder.status === 'encoding';
            scope.isUploading = () => recorder.status === 'uploading';
            scope.showActionButtons = () => recorder.elapsedTime > 0 && recorder.status !== 'stop' && !scope.showCamera;
        }
    }
});