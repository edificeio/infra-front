import { model } from "../modelDefinitions";
import {EditTrackingEvent,TrackingEvent} from "./trackingEvents";

export type TrackingType = "matomo" | "internal" | "multiple";

export interface TrackingParams {
    trackOnly: string[]
    doNotTrack: string[]
    detailApps: boolean
}

export type TrackingApp = { address: string, name: string };

export abstract class Tracking {
    params: TrackingParams;
    initStatus: "void" | "pending" | "ready" | "failed" = "void";
    onReady: Promise<void>;
    disabled:boolean = false;
    protected abstract doInit(params: TrackingParams): Promise<void>;
    protected abstract doTrackEvent(event: TrackingEvent): void;
    abstract trackPage(title: string, url: string): void;
    abstract saveOptIn(): void;

    get isReady() { return this.initStatus == "ready"; }

    async init(params: TrackingParams): Promise<void> {
        try {
            this.params = params || {trackOnly:[],detailApps:false,doNotTrack:[]};
            this.onReady = this.doInit(params);
            this.initStatus = "pending";
            await this.onReady;
            this.initStatus = "ready";
        } catch (e) {
            this.initStatus = "failed";
            console.debug(`[${this.constructor.name}] could not init `, e);
        }
    }
    shouldTrackCurrentApp(): boolean {
        const params = this.params;
        if (params.doNotTrack) {
            const apps = this.getCurrentMatchingApps();
            for (const app of apps) {
                if (params.doNotTrack.indexOf(app.name) !== -1) {
                    // Don't intercept calls to th template's engine, see below.
                    return false;
                }
            }
        }
        return true;
    }
    shouldTrackEvent(eventName: string): boolean {
        if(this.disabled){
            return false;
        }
        const params = this.params;
        const apps = this.getCurrentMatchingApps();
        //check included first
        if (params.trackOnly && params.trackOnly.length > 0) {
            for (const app of apps) {
                if (params.trackOnly.indexOf(`${app.name}.${eventName}`) !== -1 || params.trackOnly.indexOf(`*.${eventName}`) !== -1) {
                    return true;
                }
            }
            //if not in whitelist return false
            return false;
        }
        //check excluded then
        if (params.doNotTrack instanceof Array && params.doNotTrack.length > 0) {
            for (const app of apps) {
                if (params.doNotTrack.indexOf(`${app.name}.${eventName}`) !== -1 || params.doNotTrack.indexOf(`*.${eventName}`) !== -1) {
                    return false;
                }
            }
        }
        //if not blacklist return true
        return true;
    }
    trackEvent(event: TrackingEvent): void {
        if(event.disabled){
            return;
        }
        this.onReady && this.onReady.then(()=>{
            if (this.shouldTrackEvent(event.type)) {
                this.doTrackEvent(event);
            }
        })
    }
    trackEdition(data: { resourceUri?: string, resourceId?: string }): EditTrackingEvent {
        return new EditTrackingEvent(data, (event) => {
            this.trackEvent(event);
        })
    }
    protected getCurrentMatchingApps(): TrackingApp[] {
        const all: TrackingApp[] = []
        if (model && model.me && model.me.apps instanceof Array) {
            // Retrieve app from current URL.
            for (let i = 0; i < model.me.apps.length; i++) {
                const app = model.me.apps[i];
                if (app && app.address && app.name
                    && location.href.indexOf(app.address) !== -1) {
                    // Don't intercept calls to th template's engine, see below.
                    all.push(app);
                }
            }
        }
        return all;
    }
}
