import {template} from "../template";
import {notify} from "../notify";
import {ng} from "../ng-start";
import {VideoRecorder} from "./VideoRecorder";

export const VideoController = ng.controller('VideoController', ['$scope', 'model', 'route', '$timeout',
    ($scope, model, route, $timeout) => {
        $scope.RECORD_MAX_TIME = 5; // MAX TIME OF RECORDING IN MINUTES
        $scope.template = template;
        $scope.me = model.me;
        $scope.recorder = model.videoRecorder;
        $scope.display = {};
        $scope.cameraIsAuth = false;
        $scope.authorized = false;
        $scope.videoIsRecorded = false;
        $scope.videoIsRecording = false;
        $scope.uploadVideo = false;
        $scope.videofile = {};
        $scope.action = 'videorecorder';
        $scope.notFound = false;
        $scope.gumVideo = null;
        $scope.currentDuration = 0;
        $scope.recordStartTime = 0;
        $scope.recordTime = 0;
        $scope.recordMaxTime = $scope.RECORD_MAX_TIME * 60000;
        $scope.constraints = {
            audio: {
                channelCount: 0
            },
            video: {
                width: 640,
                height: 360
            },
            facingMode: 'user'
        };
        // By default open the website list
        template.open('video', 'videorecorder');


        $scope.init = () => {
            $scope.setCookie(true, 30);
            $scope.showCamera();
            console.log('CONSTRAINTS', navigator.mediaDevices.getSupportedConstraints())
        }


        $scope.showCamera = () => {
            $scope.cameraIsAuth = true;
            console.log('Using media constraints:', $scope.constraints);
            $scope.startStreaming();
        }

        $scope.startStreaming = () => {
            navigator.mediaDevices.getUserMedia($scope.constraints).then(stream => {
                (window as any).stream = stream;
                if (!$scope.gumVideo) {
                    $scope.gumVideo = document.querySelector('video#gum');
                }
                $scope.gumVideo.addEventListener('timeupdate', $scope.handleDuration);
                $scope.gumVideo.muted = true;
                $scope.gumVideo.volume = 1;
                $scope.gumVideo.src = null;
                $scope.gumVideo.srcObject = null;
                ($scope.gumVideo as any).srcObject = stream;
                console.log('VIDEO STREAM STARTED', $scope.gumVideo);
            }, error => {
                alert(error);
            });
        }


        $scope.onTrackedVideoFrame = (time) => {
            // console.log('TIME', time);
            if (time > $scope.recordMaxTime) {
                $scope.stopRecord();
            } else {
                $scope.recordTime =  $scope.msToTime(time);
                $scope.$apply();
            }
        }

        $scope.getCookie = () => {
            var name = "camera-auth" + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for(var i = 0; i <ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') {
                    c = c.substring(1);
                }
                if (c.indexOf(name) == 0) {
                    return c.substring(name.length, c.length);
                }
            }
            return null;
        }


        $scope.setCookie = (cvalue, exdays) => {
            var d = new Date();
            d.setTime(d.getTime() + (exdays*24*60*60*1000));
            var expires = "expires="+ d.toUTCString();
            document.cookie = "camera-auth=" + cvalue + ";" + expires;
        }


        $scope.startRecord = () => {
            console.log('VIDEO: START RECORD');
            $scope.videoIsRecorded = false;
            $scope.videoIsRecording = true;
            if ($scope.recorder) {
                console.log('NO MEDIA RECORDER', model);
                model.videoRecorder = new VideoRecorder();
                $scope.recorder = model.videoRecorder ;
            }
            $scope.recorder.startRecording();
            $scope.recordStartTime = $scope.currentDuration;
        }

        $scope.handleDuration = (event) => {
            $scope.currentDuration = event.timeStamp;
            if ($scope.videoIsRecording) {
                const realTime = event.timeStamp - $scope.recordStartTime;
                $scope.onTrackedVideoFrame(realTime);
            }

        }

        $scope.stopRecord = () => {
            console.log('VIDEO: STOP RECORD');
            $scope.videoIsRecording = false;
            $scope.videoIsRecorded = true;
            $scope.recorder.stopRecording();
            $scope.play();
        }

        $scope.switchRecording = () => {
            console.log('VIDEO: SWITCH RECORD', $scope.videoIsRecorded);
            if ($scope.videoIsRecorded) {
                $scope.redo();
                $scope.startRecord();
            } else {
                $scope.stopRecord();
            }
        }

        $scope.play =  () => {
            console.log('VIDEO: PLAY');
            let buffer = $scope.recorder.getBuffer();
            $scope.gumVideo.muted = false;
            $scope.gumVideo.src = null;
            $scope.gumVideo.srcObject = null;
            $scope.gumVideo.src = window.URL.createObjectURL(buffer);
            $scope.gumVideo.controls = true;
        }

        $scope.doPlay = () => {
            $scope.gumVideo.play();
        }

        $scope.redo = () => {
            console.log('VIDEO: REDO');
            $scope.videoIsRecording = false;
            $scope.videoIsRecorded = false;
            $scope.recorder.clearBuffer();
            $scope.startStreaming();
        }

        $scope.showUpload = () => {
            $scope.uploadVideo = true;
            $scope.videofile = {};
        }

        $scope.upload = () => {



            $scope.videofile.name = `Capture Vidéo ${new Date().toLocaleDateString('fr-FR')}`;
            $scope.recorder.upload($scope.videofile.name, function (response) {
                if (response.error) {
                    notify.error("video.file.error");
                } else {

                    notify.success("video.file.saved");
                    $scope.$emit("video-upload","");
                }
                $scope.uploadVideo = false;
                $scope.$apply();
            });
        }

        $scope.msToTime = (s) => {
            var ms = s % 1000;
            s = (s - ms) / 1000;
            var secs = s % 60;
            s = (s - secs) / 60;
            var mins = s % 60;

            return  $scope.pad(mins) + ':' + $scope.pad(secs) ;
        }

        $scope.pad = (num) => {
            if ((''+num).length >= 2) return num;
            var lead = '0' + new Array(2).join('0')
            return (lead + num).slice(-2);
        }
        /**
         * List of website objects
         */
        $scope.openMainPage = () => {
            delete $scope.website;
            delete $scope.selectedWebsite;
            $scope.action = 'videorecorder';
            template.open('video', 'videorecorder');
            window.location.hash = "";
        }



        // We check if camera is already authorized
        $scope.setCookie(false, 10)
        console.log('SCOPE GET COOKIE', $scope.getCookie() == 'true')
        if ($scope.getCookie() === 'true') {
            $scope.showCamera();
        }

    }]);

