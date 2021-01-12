import * as tracking from "./tracking";
import {Tracking} from "./trackingCommon";
import {EditTrackingEvent} from "./trackingEvents";
/**
 * exports
 */
export * from "./tracking"; 
export {Tracking} from "./trackingCommon";
export {EditTrackingEvent} from "./trackingEvents";
/**
 * browser
 */
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.tracking = tracking;
window.entcore.trackingService = tracking.trackingService;
window.entcore.Tracking = Tracking;
window.entcore.EditTrackingEvent = EditTrackingEvent;