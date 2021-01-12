import http from "axios";
import { model } from "../modelDefinitions";
import { TrackingType, Tracking, TrackingParams } from "./trackingCommon";
import { TrackingEvent } from "./trackingEvents";

const _typeMapping = {
    "ENSEIGNANT": "Teacher",
    "ELEVE": "Student",
    "PERSRELELEVE": "Relative",
    "SUPERADMIN": "SuperAdmin",
    "PERSEDUCNAT": "Personnel",
}

export class TrackingInternal extends Tracking {
    async doInit(): Promise<void> {
        //nothing to do
    }
    trackPage(title: string, url: string): void {
        //already done on backend
    }
    saveOptIn(): void {
        //already done on backend
    }
    protected doTrackEvent(event: TrackingEvent): void {
        try {
            const apps = this.getCurrentMatchingApps();
            const type = _typeMapping[model.me.type] || model.me.type;
            //retrocompat names with mongo....
            const eventJson: any = {
                "event-type": event.type,
                userId: model.me.userId,
                profil: type,
                "resource-type": event.resourceType,
                date: (event.date || new Date).getTime(),
                ua: navigator.userAgent
            };
            (apps.length) && (eventJson.module = apps[0].name);
            if (event.internal) {
                for (const key in event.internal) {
                    eventJson[key] = event.internal[key];
                }
            }
            http.post("/infra/event/web/store", eventJson).catch((e) => {
                console.debug('[TrackingInternal] failed to trackEvent: ', e)
            })
        } catch (e) {
            console.debug('[TrackingInternal] failed to trackEvent: ', e)
        }
    }

}