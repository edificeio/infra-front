import axios from "axios";
import { ng } from "../ng-start";
import { VideoEventTrackerService } from "./VideoEventTrackerService";

export type UploadResult = {
    data:{
        processid:string;
        state:"running"|"succeed"|"error";
        /** ID of the video file. */
        videoid?: string;
        /** size of the video, in bytes. */
        videosize:number;
        /** ID of the video document in Workspace. */
        videoworkspaceid: string;
        /** Error code (i18n key), when state==="error" */
        code?:string;
    }
    status: number;
    statusText: string;
    headers: any;
};

/**
 * This utility class allows uploading videos to the server, as documents.
 * Each video can be either recorded (Blob) or chosen from the local storage (File).
 * The server will process each uploaded video and convert them to a streamable format.
 */
export class VideoUploadService {
    private _maxWeight   = 50;  // in Mbytes. Applies to uploaded videos.
    private _maxDuration =  3;  // in minutes. Applies to recorded videos.
    private _acceptVideoUploadExtensions = ["MP4", "MOV", "AVI"];
    private _initialized = false;

    public get maxWeight():number {
        return this._maxWeight;
    }

    public get maxDuration():number {
        return this._maxDuration;
    }

    private safeValueOf(obj:any, key:string, defaultValue:number) {
        try { 
            const value = parseInt( obj[key] );
            return typeof value!=="number" || isNaN(value) ? defaultValue : value;
        }
        catch(e) { 
            return defaultValue;
         }
    }

    /** Awaits for loading the video public configuration. */
    public async initialize() {
        if( this._initialized ) {
            return;
        }
        try {
            await axios.get('/video/conf/public')
            .then( response => {
                this._maxWeight = this.safeValueOf(response.data, "max-videosize-mbytes", this._maxWeight);
                this._maxDuration = this.safeValueOf(response.data, "max-videoduration-minutes", this._maxDuration);
                let exts = response.data["accept-videoupload-extensions"];
                if( exts ) {
                    if( typeof exts==="string" ) {
                        exts = [exts];
                    }
                    this._acceptVideoUploadExtensions = exts || this._acceptVideoUploadExtensions;
                    // Force to upper case
                    this._acceptVideoUploadExtensions = this._acceptVideoUploadExtensions.map( e => e.toUpperCase() );
                }
            });
        } finally {
            this._initialized = true;
        }
    }

    public getValidExtensions():string[] {
        return this._acceptVideoUploadExtensions;
    }

    public checkValidExtension(ext:string) {
        ext = ext.toUpperCase();
        return this._acceptVideoUploadExtensions.findIndex(e => ext===e) !== -1;
    }

    public async upload(file:Blob, filename:string, captation:boolean, duration?:string|number):Promise<UploadResult> {
        if (!file) {
            throw new Error("Invalid video file.");
        }
        if (!filename) {
            throw new Error("Invalid video filename.");
        }
        
        let uploadUrl = "/video/encode?captation="+captation;

        // Add some metadata for the event layer.
        let formData = VideoEventTrackerService.asFormData();
        formData.append("file", file, filename);
        formData.append("weight", ''+file.size );
        formData.append("captation", ''+captation);
        if( duration ) {
            formData.append("duration", ''+duration);
            uploadUrl += "&duration="+duration;
        }
        
        const uploadRes = await axios.post(uploadUrl, formData);
        if(uploadRes.status==202){
            const id = uploadRes.data.processid;
            console.log("[VideoUploadService] start fetching status for :", id, uploadRes.data);
            let status = uploadRes.status;
            let statusRes = null;
            let seconds = 1;
            while(status == 202){
                statusRes = await axios.get('/video/status/'+id);
                status = statusRes.status;
                await new Promise((resolve)=> setTimeout(resolve, seconds * 1000));
                seconds = Math.min(15, seconds * 2);
            }
            if(status==201){
                return statusRes;
            }
        }
        throw new Error("Video cannot be uploaded.");
    }

/*
    async createDocument(file: File | Blob, document: Document, parent?: workspaceModel.Element, params?: { visibility?: "public" | "protected", application?: string }): Promise<Document> {
        document.eType = workspaceModel.FILE_TYPE;
        document.eParent = parent ? parent._id : null;
        document.uploadStatus = "loading";
        document.fromFile(file);
        //
        const fullname = document.metadata.extension ? document.name + "." + document.metadata.extension : document.name;
        let formData = new FormData();
        formData.append('file', file, fullname);
        document.uploadXhr = new XMLHttpRequest();
        //
        const args = [];
        if (params) {
            if (params.visibility === 'public' || params.visibility === 'protected') {
                args.push(`${params.visibility}=true`)
            }
            if (params.application) {
                args.push(`application=${params.application}`)
            }
        }
        if (document.role() === 'img') {
            args.push(`quality=1`);
        }
        if (document.eParent) {
            args.push(`parentId=${document.eParent}`)
        }
        let path = `/workspace/document?${args.join("&")}`;
        document.uploadXhr.open('POST', path);
        if (xsrfCookie) {
            document.uploadXhr.setRequestHeader('X-XSRF-TOKEN', xsrfCookie.val);
        }

        document.uploadXhr.send(formData);
        document.uploadXhr.onprogress = (e) => {
            document.eventer.trigger('progress', e);
        }

        const res = new Promise<Document>((resolve, reject) => {
            document.uploadXhr.onload = async () => {
                if (document.uploadXhr.status >= 200 && document.uploadXhr.status < 400) {
                    document.eventer.trigger('loaded');
                    document.uploadStatus = "loaded";
                    const result = JSON.parse(document.uploadXhr.responseText);
                    document.uploadXhr = null;
                    if (parent && parent.isShared) {
                        document._isShared = parent.isShared;
                    }
                    resolve(document);
                    document._id = result._id;
                    document.name = result.name;
                    document.updateProps();
                    document.fromMe();//make behaviour working
                    //load behaviours and myRights
                    document.behaviours("workspace");
                    workspaceService.onChange.next({ action: "add", elements: [document], dest: parent })
                }
                else {
                    if (document.uploadXhr.status === 413) {

                        if (!MAX_FILE_SIZE)
                            MAX_FILE_SIZE = parseInt(lang.translate('max.file.size'));
                        notify.error(lang.translate('file.too.large.limit') + (MAX_FILE_SIZE / 1024 / 1024) + lang.translate('mb'));
                    } else if (document.uploadXhr.status === 403) {
                        notify.error("upload.forbidden")
                    }
                    else {
                        const error = JSON.parse(document.uploadXhr.responseText);
                        notify.error(error.error);
                    }
                    document.eventer.trigger('error');
                    document.uploadStatus = "failed";
                    document.uploadXhr = null;
                    reject()
                }
            }
        });
        return res;
    }
*/
}
ng.services.push( ng.service("VideoUploadService", [VideoUploadService]) );
