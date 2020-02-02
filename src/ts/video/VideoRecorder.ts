import {http} from "../http";

declare var MediaRecorder: any;

export class VideoRecorder {

    private mediasource: MediaSource;
    private mediaRecorder: any;
    private recorded: Blob[];
    private id: string;

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

    public startRecording() {
        this.recorded = new Array();
        this.id = this.uuid();
        let that = this;
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (MediaRecorder.isTypeSupported) { // SAFARI TEST
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not Supported`);
                options = {mimeType: 'video/mp4; codecs="avc1.424028, mp4a.40.2"'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.error(`${options.mimeType} is not Supported`);
                    options = {mimeType: 'video/webm;codecs=vp8,opus'};

                    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                        console.error(`${options.mimeType} is not Supported`);
                        options = {mimeType: 'video/webm'};

                        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                            console.error(`${options.mimeType} is not Supported`);
                            options = {mimeType: 'video/ogg'};
                        }

                    }
                }
            }
        } else {
            options = {mimeType: 'video/webm;codecs=vp8,opus'};
        }

        try {
            this.mediaRecorder = new MediaRecorder((<any>window).stream, options);
        } catch (e) {
            console.error('Exception while creating MediaRecorder:', e);
            return;
        }

        console.log('Created MediaRecorder', this.mediaRecorder, 'with options', options);
        this.mediaRecorder.onstop = (event) => {
            console.log('Recorder stopped: ', event);
        };
        this.mediaRecorder.ondataavailable = function(event) {
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
        return new Blob(this.recorded, {type: 'video/webm'});
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
        http().postFile("/video/upload", formData).done(function(data){
            if(typeof callback === 'function'){
                callback(data);
            }
        });
    }

}
