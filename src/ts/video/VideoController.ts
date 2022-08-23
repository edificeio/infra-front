import { template } from "../template";
import { notify } from "../notify";
import { ng } from "../ng-start";
import { VideoRecorder } from "./VideoRecorder";
import { model } from "../modelDefinitions";
import {appPrefix, devices, deviceType} from '../globals';
import { IObjectGuardDelegate } from "../navigationGuard";
import { Me } from "../me";
import { http } from '../http';
import { idiom as lang } from "../idiom";
import { UploadResult, VideoUploadService } from "./VideoUploadService";


export class VideoRecordGuardModel implements IObjectGuardDelegate {
    hasRecorded = false;
    guardObjectIsDirty(): boolean{
        return this.hasRecorded;
    }
    guardObjectReset(): void{
        this.hasRecorded = false;
    }
}
interface VideoControllerScope {
    template: typeof template
    me: typeof model.me
    recorder: VideoRecorder;
    display: {}
    authorized: boolean
    hasRight:boolean
    videoState: 'idle' | 'starting' | 'ready' | 'recording' | 'recorded' | 'incompatible' | 'uploading'
    videofile: { name?: string }
    action: 'videorecorder'
    notFound: boolean
    currentDuration: number
    recordStartTime: number
    recordTimeInMs: number
    recordTime: string
    recordMaxTime: number
    videoInputDevices: MediaDeviceInfo[]
    selectedVid: MediaDeviceInfo;
    recordGuard: VideoRecordGuardModel;
    isIncompatible(): boolean
    isIncompatibleDevice(): boolean
    isIncompatibleBrowser(): boolean
    startCamera(): void
    stopRecord(pause?: boolean): void
    startRecord(resume?: boolean): Promise<void>
	switchCamera(id): void;
    switchRecording(): void
    redo(): void;
    play(): void;
    upload(): void;
    pad(num: number): string;
    openMainPage(): void
    showActions(): boolean
    isUploading():boolean;
    canPlay():boolean;
    isCameraVisible(): boolean;
    isReady(): boolean
    isRecorded(): boolean;
    isRecording(): boolean;
    isPlaying():boolean;
    isReplayAllowed: () => boolean;
    website: any;
    selectedWebsite: any;
    $apply: any
    $emit: any
    $on: any;
    $root: any
}

ng.controllers.push( ng.controller('VideoController', ['$scope', 'model', 'route', '$element', 'VideoUploadService',
    ($scope: VideoControllerScope, model, route, $element, VideoUploadService:VideoUploadService) => {

        $scope.hasRight = true;
        $scope.recordGuard = new VideoRecordGuardModel();
        $scope.recordMaxTime = 3; // MAX TIME OF RECORDING IN MINUTES
        VideoUploadService.initialize().then( () => {
            $scope.recordMaxTime = VideoUploadService.maxDuration;
        });
        $scope.template = template;
        $scope.me = model.me;
        $scope.recorder = new VideoRecorder(() => {
            return jQuery($element).find('video')[0] as HTMLMediaElement;
        }, (e) => {
            handleDuration(e);
        });
        let isPlaying = false;
        const sub = $scope.recorder.onPlayChanged.subscribe(e=>{
            isPlaying = e.type=='play';
            safeApply();
        })
        $scope.display = {};
        $scope.authorized = false;
        $scope.videoState = 'idle';
        $scope.videofile = {};
        $scope.action = 'videorecorder';
        $scope.notFound = false;
        $scope.currentDuration = 0;
        $scope.recordStartTime = 0;
        $scope.recordTime = '00:00';
        $scope.recordTimeInMs = 0;

        const backCameraChoice = {deviceId:"environment", label: lang.translate("video.back.camera"), groupId:'', kind:'videoinput'} as MediaDeviceInfo;
        const frontCameraChoice = {deviceId:"user", label: lang.translate("video.front.camera"), groupId:'', kind:'videoinput'} as MediaDeviceInfo;
        // First call to the API, so that the operating system ask for user's consent if needed, then enumerate video stream devices,
        Promise.resolve().then( () => {
            return navigator.mediaDevices.enumerateDevices();
        })// ...Filter on video inputs only,
        .then( devices => { 
            return devices.filter( device => { 
                //console.debug( JSON.stringify(device) );
                return device.kind === "videoinput";
            })
        })
        // ...Assemble the final cameras list,
        .then( videoinputs => {
            switch( deviceType ) {
                case "Mobile":
                case "Tablet":
                    if( videoinputs && videoinputs.length>1 ) {
                        // This mobile/tablet has more than 1 camera 
                        // => we assume at least one is on the front (user) and one is on the back (environment),
                        //    and let the system choose the best for us.
                        $scope.videoInputDevices = [backCameraChoice, frontCameraChoice];
                    } else {
                        // Else we let the system use the only one that exists (or none)
                        $scope.videoInputDevices = [backCameraChoice];
                    }
                    break;
                default: // "Desktop" or other future types => list all cameras without distinction.
                    $scope.videoInputDevices = videoinputs;
                    break;
            }
            $scope.selectedVid = $scope.videoInputDevices[0];
            tryStartStreaming();
        })
        .catch( () => {
            console.error('[VideoController.videoInputDevices] An error occured while detecting cameras.');
            $scope.videoInputDevices = [backCameraChoice];
            $scope.selectedVid = $scope.videoInputDevices[0];
            tryStartStreaming();
        })

        $scope.switchCamera = (info: MediaDeviceInfo) => {
            $scope.recorder.switchCamera( info.deviceId );
        }

        $scope.$on("$destroy", () => {
            //console.log("[VideoController.destroy] release video....")
            release();
        })
        $scope.$on("releaseVideo", () => {
            //console.log("[VideoController.releaseVideo] release video because of event....")
            release();
        })
        $scope.$on("displayVideoRecorder", () => {
            //console.log("[VideoController.displayVideoRecorder] display video because of event....")
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
            // //console.log('TIME', time);
            if (time > $scope.recordMaxTime * 60000) {
                $scope.stopRecord();
            } else {
                $scope.recordTime = msToTime(time);
                $scope.recordTimeInMs = time;
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
            sub.unsubscribe();
            $scope.recorder.stopStreaming();
            $scope.videoState = 'idle';
        }
        const showCamera = async (notAllowedCb?: () => void): Promise<void> => {
            try {
                $scope.recordTime = msToTime(0);
                $scope.recordTimeInMs = 0;
                $scope.videoState = 'starting';
                safeApply();
                //console.log('[VideoController.showCamera] Using media constraints:', $scope.recorder.constraints);
                await $scope.recorder.startStreaming(notAllowedCb);
                await $scope.switchCamera( $scope.selectedVid );
                $scope.videoState = 'ready';
            } catch (e) {
                console.error('[VideoController.showCamera] Failed to start:', e);
                $scope.videoState = 'idle';
            }
            safeApply()
        }
        const tryStartStreaming = async () => {
            if(!await Me.hasWorkflowRight("video.capture")){
                console.warn("[VideoController] missing workflow right video.capture")
                $scope.hasRight = false;
                safeApply();
                return;
            }
            if ($scope.isIncompatibleBrowser() || $scope.isIncompatibleDevice()) {
                $scope.videoState = 'incompatible';
                safeApply();
                console.warn('[VideoController.tryStartStreaming] browser incompatible:', browser)
                return;
            }
            if ($scope.videoState != 'idle') {
                console.warn('[VideoController.tryStartStreaming] already start');
                return;
            }
            //console.log('[VideoController] try start streaming: ');
            showCamera(() => {
                $scope.videoState = 'idle';
            });

        }
        //public
        $scope.startCamera = () => {
            setCookie(true, 30);
            showCamera();
        }

        $scope.canPlay=()=>{
            if($scope.isPlaying()) return false;
            return $scope.isRecorded();
        }

        $scope.isUploading = () => $scope.videoState == 'uploading';

        $scope.isPlaying = () => isPlaying;

        $scope.isIncompatibleDevice = () => {
            const os = devices.getOSInfo();
            /*
            console.log( "Actual OS="+ os.name +" version "+ os.version );
            let ios1 = devices.getOSInfo("Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1");
            console.log( "iOS1 OS="+ ios1.name +" version "+ ios1.version );
            let ios2 = devices.getOSInfo("Mozilla/5.0 (iPad; CPU OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1");
            console.log( "iOS2 OS="+ ios2.name +" version "+ ios2.version );
            let ios3 = devices.getOSInfo("Mozilla/5.0 (iPad; CPU OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1");
            console.log( "iOS3 OS="+ ios3.name +" version "+ ios3.version );
            */
            // iOS 14.3+ has built-in MediaRecorder capabilities.
            if( os && os.name==="iOS" && os.version>="14.3" )
                return false;

            return devices.isIphone() || devices.isIpad() || devices.isIpod();
        };

        $scope.isIncompatibleBrowser = () => {
            if(!(window as any).MediaRecorder){
                return true;
            }
            // Check against supported browsers.
            const browser = devices.getBrowserInfo();
            return ['Firefox', 'Chrome', 'Edge', 'Opera', 'Safari', 'CriOS', 'FxiOS'].findIndex( (item) => browser.name==item ) === -1;
        };

        /** Note 2021-01-11 : replaying a recorded stream does not work under iOS, even in version 14.3 */
        $scope.isReplayAllowed = () => {
            const os = devices.getOSInfo();
            return !(os && (os.name==="iOS" || os.name==="Mac OS"));
        };
        
        $scope.isIncompatible = () => $scope.videoState == 'incompatible';

        $scope.isReady = () => $scope.videoState == 'ready';

        $scope.isCameraVisible = () => $scope.videoState == 'ready'
            || $scope.videoState == 'recording'
            || $scope.videoState == 'recorded'
            || $scope.videoState == 'uploading';

        $scope.showActions = () => $scope.videoState == 'recording' || $scope.videoState == 'recorded' || $scope.videoState == 'uploading';

        $scope.isRecording = () => $scope.videoState == 'recording';

        $scope.isRecorded = () => $scope.videoState == 'recorded';

        $scope.startRecord = async (resume = false) => {
            //console.log('[VideoController.startRecord] START RECORD', $scope.currentDuration);
            $scope.recorder.canStartRecording(bool => {
                if (!bool) {
                    notify.error('video.file.too.large');
                } else {
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
                        $scope.recordGuard.hasRecorded = true;
                        //console.log($scope.recordGuard.hasRecorded);
                    }
                }
                safeApply();
            });
        }

        $scope.stopRecord = (pause = false) => {
            //console.log('[VideoController.stopRecord] STOP RECORD');
            $scope.videoState = 'recorded'
            if (pause) {
                $scope.recorder.pause(true);
            } else {
                $scope.recorder.stopRecording(true);
            }
            safeApply();
        }

        $scope.switchRecording = () => {
            //console.log('[VideoController.switchRecording] switching state:', $scope.videoState);
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
            //console.log('[VideoController.redo] redoing...');
            $scope.recordGuard.guardObjectReset();
            $scope.videoState = 'ready';
            isPlaying = false;
            $scope.currentDuration = 0;
            $scope.recordTime = '00:00';
            $scope.recordTimeInMs = 0;
            $scope.recorder.clearBuffer(true);
            safeApply();
            $scope.$emit("video-redo");
        }

        $scope.upload = () => {
            $scope.videoState = 'uploading';
            $scope.videofile = {}
            $scope.videofile.name = `Capture Vidéo ${new Date().toLocaleDateString('fr-FR')}`;
            safeApply();
            Promise.resolve().then( () => {
                let filename = $scope.videofile.name;
                let recordTime = Math.round($scope.recordTimeInMs);

                if (!filename) {
                    filename = "video-" + $scope.recorder.generateVideoId();
                }
                return VideoUploadService.upload( $scope.recorder.getBuffer(), filename, true, recordTime );
            })
            .then( (statusRes:UploadResult) => {
                if( !statusRes || (statusRes.data && statusRes.data.state==="error") ) {
                    throw ((statusRes && statusRes.data && statusRes.data.code) || null);
                }
                return statusRes;
            })
            .then( (response:UploadResult) => {
                $scope.recordGuard.guardObjectReset();
                notify.success("video.file.saved");
                if (response.data) {
                    $scope.$emit("video-upload", response.data.videoid);
                }
				
                let browserInfo = devices.getBrowserInfo();
                let videoEventData = {
                    videoId: response.data.videoworkspaceid,
                    userId: $scope.me.userId,
                    userProfile: $scope.me.profiles[0],
                    device: deviceType,
                    browser: browserInfo.name + ' ' + browserInfo.version,
                    structure: $scope.me.structureNames[0],
                    level: $scope.me.level,
                    duration: Math.round($scope.recordTimeInMs),
                    weight: response.data.videosize,
                    captation: true,
                    url: window.location.hostname,
                    app: appPrefix
                }
                http().postJson('/video/event/save', videoEventData).done(function(res){
                    //console.log(res);
                });
                $scope.videoState = 'recorded';
                $scope.recorder.turnOffCamera();
                safeApply();
            })
            .catch( (e)=>{
                e = e || "video.file.error";
                notify.error(e);
                $scope.videoState = 'recorded';
                $scope.recorder.turnOffCamera();
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

    }])
);

