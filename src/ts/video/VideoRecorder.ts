import { http } from "../http";

type MediaRecorderImpl = {
    start(time: number): void;
    stop(): void;
    onstop(event: MediaStreamEvent): void;
    ondataavailable(event: any): void;
}
declare var MediaRecorder: {
    new(stream: MediaStream, options: { mimeType: string }): MediaRecorderImpl
    isTypeSupported: (mime: string) => boolean
};

export class VideoRecorder {
    private stream: MediaStream;
    private gumVideo: HTMLMediaElement
    private mediasource: MediaSource;
    private mediaRecorder: MediaRecorderImpl;
    private recorded: Blob[];
    private id: string;
    public constraints: MediaStreamConstraints & { facingMode?: string } = {
        audio: {
            channelCount: 0,
            facingMode: 'user'
        },
        video: {
            width: 640,
            height: 360,
            facingMode: 'user'
        },
        facingMode: 'user'
    } as MediaStreamConstraints;
    constructor(private videoSelector: string, private handleDuration: (event: Event) => void) {

    }
    doPlay(){
        if(!this.gumVideo)return;
        this.gumVideo.play();
    }
    play() {
        let buffer = this.getBuffer();
        this.gumVideo.muted = false;
        this.gumVideo.src = null;
        this.gumVideo.srcObject = null;
        this.gumVideo.src = window.URL.createObjectURL(buffer);
        this.gumVideo.controls = true;
    }
    stopStreaming(){
        if(this.gumVideo){
            this.gumVideo.removeEventListener('timeupdate', this.handleDuration);
        }
        if(this.stream){
            try{
                this.stopRecording();
            }catch(e){}
            const tracks = this.stream.getTracks();
            for (const track of tracks) {
                try {
                    track.stop();
                } catch (e) { }
            }
            this.gumVideo.srcObject = undefined;
            this.stream = undefined;
        }
    }
    async startStreaming() {
        try {
            if (this.stream) return;
            const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            if (!this.gumVideo) {
                this.gumVideo = document.querySelector(this.videoSelector) as HTMLMediaElement;
            }
            this.gumVideo.addEventListener('timeupdate', this.handleDuration);
            this.gumVideo.muted = true;
            this.gumVideo.volume = 1;
            this.gumVideo.src = null;
            this.gumVideo.srcObject = null;
            this.gumVideo.srcObject = stream;
            this.stream = stream;
            console.log('VIDEO STREAM STARTED', this.gumVideo);
        } catch (e) {
            alert(e);
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

    public async startRecording() {
        await this.startStreaming();
        this.recorded = new Array();
        this.id = this.uuid();
        let that = this;
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (MediaRecorder.isTypeSupported) { // SAFARI TEST
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not Supported`);
                options = { mimeType: 'video/mp4; codecs="avc1.424028, mp4a.40.2"' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error(`${options.mimeType} is not Supported`);
                    options = { mimeType: 'video/webm;codecs=vp8,opus' };

                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.error(`${options.mimeType} is not Supported`);
                        options = { mimeType: 'video/webm' };

                        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                            console.error(`${options.mimeType} is not Supported`);
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
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }

        console.log('Created MediaRecorder', this.mediaRecorder, 'with options', options);
        this.mediaRecorder.onstop = (event) => {
            console.log('Recorder stopped: ', event);
        };
        this.mediaRecorder.ondataavailable = function (event) {
            if (event.data && event.data.size > 0) {
                that.recorded.push(event.data);
            }
        };
        this.mediaRecorder.start(1000); // collect 1000ms of data
        console.log('MediaRecorder started', this.mediaRecorder);
    }

    public stopRecording() {
        this.mediaRecorder.stop();
    }

    public getBuffer() {
        return new Blob(this.recorded, { type: 'video/webm' });
    }

    public clearBuffer() {
        this.recorded = null;
    }

    public upload(filename, callback) {
        if (!filename) {
            filename = "video-" + this.id;
        }

        let formData = new FormData();
        formData.append("file", this.getBuffer(), filename);
        http().postFile("/video/upload", formData).done(function (data) {
            if (typeof callback === 'function') {
                callback(data);
            }
        });
    }

}
