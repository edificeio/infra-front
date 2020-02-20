import { template } from "../template";
import { notify } from "../notify";
import { ng } from "../ng-start";
import { VideoRecorder } from "./VideoRecorder";
import { model } from "../modelDefinitions";
import { devices } from "../globals";

interface VideoControllerScope {
    RECORD_MAX_TIME: number;
    template: typeof template
    me: typeof model.me
    recorder: VideoRecorder;
    display: {}
    authorized: boolean
    videoState: 'idle' | 'starting' | 'ready' | 'recording' | 'recorded' | 'incompatible' | 'uploading'
    videofile: { name?: string }
    action: 'videorecorder'
    notFound: boolean
    currentDuration: number
    recordStartTime: number
    recordTime: string
    recordMaxTime: number
    isIncompatibleDevice(): boolean
    isIncompatible(): boolean
    startCamera(): void
    stopRecord(pause?: boolean): void
    startRecord(resume?: boolean): Promise<void>
    switchRecording(): void
    redo(): void;
    play(): void;
    upload(): void;
    pad(num: number): string;
    openMainPage(): void
    showActions(): boolean
    isCameraVisible(): boolean;
    isReady(): boolean
    isRecorded(): boolean;
    isRecording(): boolean;
    website: any;
    selectedWebsite: any;
    $apply: any
    $emit: any
    $on: any;
    $root: any
}

export const VideoController = ng.controller('VideoController', ['$scope', 'model', 'route', '$element',
    ($scope: VideoControllerScope, model, route, $element) => {
        $scope.RECORD_MAX_TIME = 5; // MAX TIME OF RECORDING IN MINUTES
        $scope.template = template;
        $scope.me = model.me;
        $scope.recorder = new VideoRecorder(() => {
            return jQuery($element).find('video')[0] as HTMLMediaElement;
        }, (e) => {
            handleDuration(e);
        });
        $scope.display = {};
        $scope.authorized = false;
        $scope.videoState = 'idle';
        $scope.videofile = {};
        $scope.action = 'videorecorder';
        $scope.notFound = false;
        $scope.currentDuration = 0;
        $scope.recordStartTime = 0;
        $scope.recordTime = '00:00';
        $scope.recordMaxTime = $scope.RECORD_MAX_TIME * 60000;
        $scope.$on("$destroy", () => {
            console.log("[VideoController.destroy] release video....")
            release();
        })
        $scope.$on("releaseVideo", () => {
            console.log("[VideoController.releaseVideo] release video because of event....")
            release();
        })
        $scope.$on("displayVideoRecorder", () => {
            console.log("[VideoController.displayVideoRecorder] display video because of event....")
            tryStartStreaming();
        })
        // By default open the website list
        template.open('video', 'videorecorder');
        //===private function
        const safeApply = (fn?: any) => {
            try {
                const phase = $scope.$root && $scope.$root.$$phase;
                if (phase == '$apply' || phase == '$digest') {
                    if (fn && (typeof (fn) === 'function')) {
                        fn();
                    }
                } else {
                    $scope.$apply(fn);
                }
            } catch (e) { }
        };

        let _lastRecordDuration = 0;
        let _currentRecordDuration = 0;
        const handleDuration = (event: Event) => {
            $scope.currentDuration = event.timeStamp;
            if ($scope.videoState == 'recording') {
                const realTime = event.timeStamp - $scope.recordStartTime;
                _currentRecordDuration = realTime;
                onTrackedVideoFrame(realTime + _lastRecordDuration);
            }
        }
        const setCookie = (cvalue: boolean, exdays: number) => {
            var d = new Date();
            d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            var expires = "expires=" + d.toUTCString();
            document.cookie = "camera-auth=" + cvalue + ";" + expires;
        }
        const onTrackedVideoFrame = (time: number) => {
            // console.log('TIME', time);
            if (time > $scope.recordMaxTime) {
                $scope.stopRecord();
            } else {
                $scope.recordTime = msToTime(time);
                safeApply();
            }
        }
        const msToTime = (s: number): string => {
            var ms = s % 1000;
            s = (s - ms) / 1000;
            var secs = s % 60;
            s = (s - secs) / 60;
            var mins = s % 60;

            return $scope.pad(mins) + ':' + $scope.pad(secs);
        }
        const getCookie = (): string => {
            var name = "camera-auth" + "=";
            var decodedCookie = decodeURIComponent(document.cookie);
            var ca = decodedCookie.split(';');
            for (var i = 0; i < ca.length; i++) {
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
        const release = (): void => {
            $scope.recorder.stopStreaming();
            $scope.videoState = 'idle';
        }
        const showCamera = async (notAllowedCb?: () => void): Promise<void> => {
            try {
                $scope.recordTime = msToTime(0);
                $scope.videoState = 'starting';
                safeApply();
                console.log('[VideoController.showCamera] Using media constraints:', $scope.recorder.constraints);
                await $scope.recorder.startStreaming(notAllowedCb);
                $scope.videoState = 'ready';
            } catch (e) {
                console.error('[VideoController.showCamera] Failed to start:', e);
                $scope.videoState = 'idle';
            }
            safeApply()
        }
        const tryStartStreaming = () => {
            const browser = devices.getBrowserInfo();
            const incompatibleBrowser = browser.name != 'Firefox' && browser.name != 'Chrome';
            if (incompatibleBrowser || $scope.isIncompatibleDevice()) {
                $scope.videoState = 'incompatible';
                safeApply();
                console.warn('[VideoController.tryStartStreaming] browser incompatible:', browser)
                return;
            }
            if ($scope.videoState != 'idle') {
                console.warn('[VideoController.tryStartStreaming] already start');
                return;
            }
            console.log('[VideoController] try start streaming: ');
            showCamera(() => {
                $scope.videoState = 'idle';
            });

        }
        //public
        $scope.startCamera = () => {
            setCookie(true, 30);
            showCamera();
        }

        $scope.isIncompatibleDevice = () => devices.isIphone() || devices.isIpad() || devices.isIpod();

        $scope.isIncompatible = () => $scope.videoState == 'incompatible';

        $scope.isReady = () => $scope.videoState == 'ready';

        $scope.isCameraVisible = () => $scope.videoState == 'starting'
            || $scope.videoState == 'ready'
            || $scope.videoState == 'recording'
            || $scope.videoState == 'recorded'
            || $scope.videoState == 'uploading';

        $scope.showActions = () => $scope.videoState == 'recording' || $scope.videoState == 'recorded' || $scope.videoState == 'uploading';

        $scope.isRecording = () => $scope.videoState == 'recording';

        $scope.isRecorded = () => $scope.videoState == 'recorded';

        $scope.startRecord = async (resume = false) => {
            console.log('[VideoController.startRecord] START RECORD', $scope.currentDuration);
            $scope.recordStartTime = $scope.currentDuration;
            if (resume) {
                _lastRecordDuration = _currentRecordDuration;
            } else {
                _lastRecordDuration = 0;
            }
            _currentRecordDuration = 0;
            $scope.videoState = 'recording'
            if (resume) {
                $scope.recorder.resume();
            } else {
                $scope.recorder.startRecording();
            }
        }

        $scope.stopRecord = (pause = false) => {
            console.log('[VideoController.stopRecord] STOP RECORD');
            $scope.videoState = 'recorded'
            if (pause) {
                $scope.recorder.pause(true);
            } else {
                $scope.recorder.stopRecording(true);
            }
        }

        $scope.switchRecording = () => {
            console.log('[VideoController.switchRecording] switching state:', $scope.videoState);
            if ($scope.videoState == 'recorded') {
                $scope.startRecord(false);
            } else {
                $scope.stopRecord(false);
            }
        }

        $scope.play = () => {
            $scope.recorder.play();
        }

        $scope.redo = () => {
            console.log('[VideoController.redo] redoing...');
            $scope.videoState = 'ready';
            $scope.currentDuration = 0;
            $scope.recorder.clearBuffer(true);
            safeApply();
        }

        $scope.upload = () => {
            $scope.videoState = 'uploading';
            $scope.videofile = {}
            $scope.videofile.name = `Capture Vidéo ${new Date().toLocaleDateString('fr-FR')}`;
            safeApply();
            $scope.recorder.upload($scope.videofile.name, function (response) {
                if (response.error) {
                    notify.error("video.file.error");
                } else {

                    notify.success("video.file.saved");
                    $scope.$emit("video-upload", "");
                }
                $scope.videoState = 'recorded';
                safeApply();
            });
        }

        $scope.pad = (num) => {
            if (('' + num).length >= 2) return num + '';
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
        tryStartStreaming();

    }]);

