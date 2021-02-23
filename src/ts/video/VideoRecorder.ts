import { http } from "../http";
import { Subject } from "rxjs";
import { model } from '../modelDefinitions';
import axios from "axios";
import { appPrefix, devices, deviceType } from "../globals";

type MediaRecorderImpl = {
    start(time: number): void;
    stop(): void;
    pause(): void;
    onstop(event: MediaStreamEvent): void;
    ondataavailable(event: any): void;
    resume(): void;
    requestData(): void;
}
declare var MediaRecorder: {
    new(stream: MediaStream, options: { mimeType: string }): MediaRecorderImpl
    isTypeSupported: (mime: string) => boolean
};
type FacingMode = 'user' | 'environment';

export class VideoRecorder {
    private stream: MediaStream;
    private gumVideo: HTMLMediaElement
    private mediaRecorder: MediaRecorderImpl;
    private recordMimeType: string;
    private recorded: Blob[];
    private id: string;
    private mode: 'idle' | 'play' | 'record' | 'playing' = 'idle';
    public constraints: MediaStreamConstraints = {
        audio: true,
        video: {
            width: 640,
            height: 360,
            facingMode: 'environment'
        }
    };
    public onPlayChanged = new Subject<Event>();
    constructor(private videoFactory: () => HTMLMediaElement, private handleDuration: (event: Event) => void) { }
    private bindPlayEvents() {
        if (!this.gumVideo) return;
        this.unbindPlayEvents();
        this.gumVideo.addEventListener('play', this.videoPausePlayHandler, false);
        this.gumVideo.addEventListener('pause', this.videoPausePlayHandler, false);
    }
    private unbindPlayEvents() {
        if (!this.gumVideo) return;
        this.gumVideo.removeEventListener('play', this.videoPausePlayHandler, false);
        this.gumVideo.removeEventListener('pause', this.videoPausePlayHandler, false);
    }
    private videoPausePlayHandler = (e: Event) => {
        this.onPlayChanged.next(e)
    }
    private unbindRecordEvent(){
        if (!this.gumVideo) return;
        this.gumVideo.removeEventListener('timeupdate', this.handleDuration);
    }
    private bindRecordEvent(){
        if (!this.gumVideo) return;
        this.unbindRecordEvent();
        this.gumVideo.addEventListener('timeupdate', this.handleDuration);
    }
    async switchCamera( id ) {
        if( id==='environment' || id==='user' ) {
            delete (this.constraints.video as MediaTrackConstraints).deviceId;
            (this.constraints.video as MediaTrackConstraints).facingMode = id;
        } else if( id ) {
            delete (this.constraints.video as MediaTrackConstraints).facingMode;
            (this.constraints.video as MediaTrackConstraints).deviceId = id;
        }
        this.stopStreaming();
        await this.startStreaming();
    }
    play() {
        if (!this.gumVideo) {
            console.warn('[VideoRecorder.play] stream not init');
            return;
        }

        if (this.mode == 'playing') {
            this.gumVideo.pause();
            this.mode = 'play';
        } else {
            this.preparePlay();
            this.gumVideo.play();
            this.mode = 'playing';
        }
    }
    private preparePlay() {
        if (this.mode != 'play') {
            this.unbindRecordEvent();
            this.bindPlayEvents();
            let buffer = this.getBuffer();
            //console.log('[VideoRecorder.preparePlay] buffer size: ', buffer.size)
            this.gumVideo.muted = false;
            this.gumVideo.src = null;
            this.gumVideo.srcObject = null;
            this.gumVideo.autoplay = false;
            this.gumVideo.src = window.URL.createObjectURL(buffer);
            this.gumVideo.controls = true;
            this.mode = 'play';
        } else {
            //console.log('[VideoRecorder.preparePlay] already in play mode')
        }
    }
    private prepareRecord() {
        if (!this.stream) {
            console.warn('[VideoRecorder.prepareRecord] stream not init')
            return;
        }
        if (this.mode != 'record') {
            this.gumVideo.muted = true;
            this.gumVideo.volume = 1;
            this.gumVideo.src = null;
            this.gumVideo.srcObject = null;
            this.gumVideo.autoplay = true;
            this.gumVideo.srcObject = this.stream;
            this.gumVideo.controls = false;
            this.unbindPlayEvents();
            this.bindRecordEvent();
            this.mode = 'record';
        } else {
            //console.log('[VideoRecorder.prepareRecord] already in record mode')
        }
    }
    stopStreaming() {
        if (this.gumVideo) {
            this.unbindPlayEvents();
            this.unbindRecordEvent();
        }
        if (this.stream) {
            try {
                this.stopRecording(false);
            } catch (e) { }
            const tracks = this.stream.getTracks();
            for (const track of tracks) {
                try {
                    track.stop();
                } catch (e) { }
            }
            this.stream = undefined;
        }
        this.gumVideo = undefined;
        this.mode = 'idle';
    }
    async startStreaming(notAllowedCb?: () => void) {
        try {
            if (this.stream) return;
            const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            if (!this.gumVideo) {
                this.gumVideo = this.videoFactory();
            }
            this.stream = stream;
            this.prepareRecord();
            //console.log('[VideoRecorder.startStreaming] VIDEO STREAM STARTED', this.gumVideo);
        } catch (e) {
            if( e ) {
                // Case when a cam is not authorized/found/matching/available
                // See https://developer.mozilla.org/fr/docs/Web/API/MediaDevices/getUserMedia#erreurs
                if ( e.name == 'NotAllowedError' 
//                    || e.name == 'NotFoundError'
//                    || e.name == 'OverConstrainedError'
//                    || e.name == 'TypeError'
                    ) {
                    if (notAllowedCb) {
                        return notAllowedCb();
                    }
                }else if (e.name == 'NotReadableError'){
                    try{
                        //try without constraint
                        const stream = await navigator.mediaDevices.getUserMedia({});
                        if (!this.gumVideo) {
                            this.gumVideo = this.videoFactory();
                        }
                        this.stream = stream;
                        this.prepareRecord();
                    }catch(e){
                        alert(e);
                    }
                    return;
                }
                alert(e);
            }
        }
    }
    private uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // private handleDataAvailable(event) {
    //     if (event.data && event.data.size > 0) {
    //         this.recorded.push(event.data);
    //     }
    // }
    public resume() {
        this.prepareRecord();
        this.mediaRecorder.resume();
    }
    public async canStartRecording(callback) {
        http().get(`/workspace/quota/user/${model.me.userId}`).done(result => {
            let res = result.quota > result.storage;
            callback(res)
        }).error(err => {
            callback(false);
        });
    }
    public async startRecording() {
        await this.startStreaming();
        this.prepareRecord();
        this.recorded = new Array();
        this.id = this.uuid();
        let that = this;
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (MediaRecorder.isTypeSupported) { // SAFARI TEST
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`[VideoRecorder.startRecording] ${options.mimeType} is not Supported`);
                options = { mimeType: 'video/mp4; codecs="avc1.424028, mp4a.40.2"' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error(`[VideoRecorder.startRecording] ${options.mimeType} is not Supported`);
                    options = { mimeType: 'video/webm;codecs=vp8,opus' };

                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.error(`[VideoRecorder.startRecording] ${options.mimeType} is not Supported`);
                        options = { mimeType: 'video/webm' };

                        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                            console.error(`[VideoRecorder.startRecording] ${options.mimeType} is not Supported`);
                            options = { mimeType: 'video/ogg' };
                        }

                    }
                }
            }
        } else {
            options = { mimeType: 'video/webm;codecs=vp8,opus' };
        }

        try {
            this.mediaRecorder = new MediaRecorder(this.stream, options);
            // Memorize which MIME type is being recorded.
            this.recordMimeType = options.mimeType;
        } catch (e) {
            console.error('[VideoRecorder.startRecording] Exception while creating MediaRecorder:', e);
            return;
        }

        //console.log('[VideoRecorder.startRecording] Created MediaRecorder', this.mediaRecorder, 'with options', options);
        this.mediaRecorder.onstop = (event) => {
            //console.log('[VideoRecorder.onstop] Recorder stopped: ', event);
        };
        this.mediaRecorder.ondataavailable = function (event) {
            if (event.data && event.data.size > 0) {
                that.recorded.push(event.data);
            }
        };
        this.mediaRecorder.start(1000); // collect 1000ms of data
        //console.log('[VideoRecorder.startRecording] MediaRecorder started', this.mediaRecorder);
    }

    public pause(preparePlay: boolean) {
        this.mediaRecorder.pause();
        preparePlay && this.preparePlay();
    }

    public stopRecording(preparePlay: boolean) {
        this.mediaRecorder.requestData(); // get last recorded data slice
        this.mediaRecorder.stop();
        if (preparePlay) {
            setTimeout(() => this.preparePlay(), 0);
        }
    }

    public getBuffer() {
        return new Blob(this.recorded, { type: this.recordMimeType /*'video/webm'*/ });
    }

    public clearBuffer(prepareRecord: boolean) {
        this.recorded = null;
        prepareRecord && this.prepareRecord();
    }

    public async upload(filename, recordTime, callback,errCallback) {
        if (!filename) {
            filename = "video-" + this.id;
        }

        let formData = new FormData();
        formData.append("file", this.getBuffer(), filename);
        // Also report useful contextual data
        let browserInfo = devices.getBrowserInfo();
        formData.append("device", deviceType);
        formData.append("browser", browserInfo.name + ' ' + browserInfo.version);
        formData.append("duration", recordTime);
        formData.append("weight", ''+this.getBuffer().size);
        formData.append("url", window.location.hostname);
        formData.append("app", appPrefix);
        try{
            const uploadRes = await axios.post("/video/upload?duration="+recordTime, formData);
            if(uploadRes.status==202){
                const id = uploadRes.data.processid;
                console.log("[VideoRecorder] start fetching status for :", id, uploadRes.data)
                let status = uploadRes.status;
                let statusRes = null;
                let seconds = 1;
                while(status == 202){
                    statusRes = await axios.get('/video/status/'+id);
                    status = statusRes.status;
                    await new Promise((resolve)=> setTimeout(resolve, seconds * 1000))
                    seconds = Math.min(15, seconds * 2);
                }
                if(status==201){
                    callback && callback(statusRes);
                } else{
                    console.warn("[VideoRecorder] Bad status while checking : ", uploadRes.status, uploadRes.data);
                    errCallback && errCallback();
                }
            }else{
                console.warn("[VideoRecorder] Bad status while uploading : ", uploadRes.status, uploadRes.data);
                errCallback && errCallback();
            }
        }catch(e){
            console.warn(e)
            errCallback && errCallback();
        }
    }

}
