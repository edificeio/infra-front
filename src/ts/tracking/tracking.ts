import http from "axios";
import { TrackingEvent } from "./trackingEvents";
import { Tracking, TrackingParams, TrackingType } from "./trackingCommon";
import { TrackingMatomo } from "./trackingMatomo";
import { TrackingInternal } from "./trackingInternal";



export class TrackingDefault extends Tracking {
    private trackings: Array<Tracking> = [];
    constructor() {
        super();
    }
    async doInit(_: TrackingParams): Promise<void> {
        const res = await http.get('/analyticsConf');
        const data = res.data;
        const all: Array<{ params: TrackingParams, tracker: Tracking }> = [];
        if (data) {
            if (data.matomo) {
                all.push({ params: data.matomo, tracker: new TrackingMatomo() });
            }
            if (data.internal) {
                all.push({ params: data.internal, tracker: new TrackingInternal() });
            }
        }
        const promises: Array<Promise<void>> = [];
        for (const tmp of all) {
            promises.push(tmp.tracker.init(tmp.params));
            this.trackings.push(tmp.tracker);
        }
        await Promise.all(promises);
    }
    trackPage(title: string, url: string): void {
        this.onReady && this.onReady.then(() => {
            for (const tr of this.trackings) {
                tr.trackPage(title, url);
            }
        })
    }
    saveOptIn(): void {
        this.onReady && this.onReady.then(() => {
            for (const tr of this.trackings) {
                tr.saveOptIn();
            }
        })
    }
    trackEvent(event: TrackingEvent): void {
        this.onReady && this.onReady.then(() => {
            for (const tr of this.trackings) {
                tr.trackEvent(event);
            }
        })
    }
    protected doTrackEvent(event: TrackingEvent): void {
        //do nothing
    }
}

export const trackingService = new TrackingDefault();
trackingService.init(null);