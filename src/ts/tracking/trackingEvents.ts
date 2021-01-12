import { navigationGuardService } from "../navigationGuard";

let _generateID = 0;
function generateID(): string {
    return "__new__" + (_generateID++);
};

export interface TrackingEvent {
    type: string;
    resourceType?: string
    date?: Date
    matomo?: {
        action: string;
        resourceUri: string;
        value?: number;
    };
    internal?: { [key: string]: any };
}
export type EditTrackingEventType = "void" | "editing" | "saving" | "success" | "fail" | "cancel";
export class EditTrackingEvent {
    status: EditTrackingEventType = "void";
    private startedAt: Date;
    private stoppedAt: Date;
    private finishedAt: Date;
    private id: string;
    private resourceUri: string;
    private matomoResourceUri: string;
    constructor(data: { resourceUri?: string, resourceId?: string }, private pushEvent: (event: TrackingEvent) => void) {
        const defautUri = window.location.pathname + window.location.hash;
        this.id = data.resourceId || generateID();
        this.resourceUri = data.resourceUri || defautUri;
        this.matomoResourceUri = window.location.pathname +"/"+this.id;
        navigationGuardService.onUserConfirmNavigate.push((can)=>{
            if(!can){
                this.onCancel();
            }
        })
    }
    onStart(onlyIfStopped: boolean): void {
        if (onlyIfStopped) {
            const forbiddenStatus: Array<EditTrackingEventType> = ['editing'];
            if (forbiddenStatus.includes(this.status)) {
                return;
            }
        }
        this.startedAt = new Date;
        this.stoppedAt = null;
        this.pushEvent({
            type: "edit",
            matomo: {
                action: "start",
                resourceUri: this.matomoResourceUri,
            },
            internal: {
                "event-type": "EDIT_START",
                resource_uri: this.resourceUri,
                resource_id: this.id,
            }
        })
        this.status = "editing";
    }
    onStop(): void {
        const forbiddenStatus: Array<EditTrackingEventType> = ['saving'];
        if (forbiddenStatus.includes(this.status)) {
            return;
        }
        this.stoppedAt = new Date;
        this.finishedAt = null;
        const duration = this.startedAt ? (this.stoppedAt.getTime() - this.startedAt.getTime()) : null;
        this.pushEvent({
            type: "edit",
            matomo: {
                action: "stop",
                resourceUri: this.matomoResourceUri,
            },
            internal: {
                "event-type": "EDIT_STOP",
                resource_uri: this.resourceUri,
                resource_id: this.id,
                duration: duration
            }
        })
        this.status = "saving";
    }
    onFinish(success: boolean, data?: { code: string }): void {
        //check last status
        const forbiddenStatus: Array<EditTrackingEventType> = ["success", "fail"];
        if (forbiddenStatus.includes(this.status)) {
            return;
        }
        //
        this.finishedAt = new Date;
        this.status = success ? "success" : "fail";
        const duration = this.stoppedAt ? (this.finishedAt.getTime() - this.stoppedAt.getTime()) : null;
        this.pushEvent({
            type: "edit",
            matomo: {
                action: success ? "success" : "fail",
                resourceUri: this.matomoResourceUri,
            },
            internal: {
                "event-type": "EDIT_FINISH",
                resource_uri: this.resourceUri,
                resource_id: this.id,
                duration: duration,
                status: success ? "success" : "fail",
                status_code: data ? data.code : null
            }
        })
    }
    onCancel(): void {
        //check status
        const forbiddenStatus: Array<EditTrackingEventType> = ['void', 'success', 'fail', 'cancel'];
        if (forbiddenStatus.includes(this.status)) {
            return;
        }
        //
        this.finishedAt = new Date;
        this.status = "cancel";
        const duration = this.stoppedAt ? (this.finishedAt.getTime() - this.stoppedAt.getTime()) : null;
        this.pushEvent({
            type: "edit",
            matomo: {
                action: "cancel",
                resourceUri: this.matomoResourceUri,
            },
            internal: {
                "event-type": "EDIT_FINISH",
                resource_uri: this.resourceUri,
                resource_id: this.id,
                duration: duration,
                status: "cancel",
                status_code: null
            }
        })
    }
}