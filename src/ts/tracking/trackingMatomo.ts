import http from "axios";
import { model } from "../modelDefinitions";
import { TrackingType, Tracking, TrackingParams } from "./trackingCommon";
import { TrackingEvent } from "./trackingEvents";

interface TrackingParamsMatomo extends TrackingParams {
    url: string;
    siteId: string;
    UserId: string;
    Profile: string;
    School: string;
    Project: string;
}

const USE_NEW_SERVICE = false;
export class TrackingMatomo extends Tracking {
    hasOptedIn = false;

    async doInit(params: TrackingParamsMatomo): Promise<void> {
        try {
            //TODO migrate old angularjs service
            if(!USE_NEW_SERVICE){
                return;
            }
            const _paq = window["_paq"] || [];
            _paq.push(['setRequestMethod', 'POST']);
            if (params.UserId) _paq.push(['setUserId', params.UserId]);
            if (params.Profile) _paq.push(['setCustomDimension', 1, params.Profile]);
            if (params.School) _paq.push(['setCustomDimension', 2, params.School]);
            if (params.Project) _paq.push(['setCustomDimension', 3, params.Project]);
            /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
            _paq.push(['trackPageView']);
            _paq.push(['enableLinkTracking']);
            (() => {
                _paq.push(['setTrackerUrl', params.url + 'matomo.php']);
                _paq.push(['setSiteId', params.siteId]);
                const d = document, g = d.createElement('script'), s = d.getElementsByTagName('script')[0];
                g.type = 'text/javascript'; g.async = true; g.src = params.url + 'ode.js'; s.parentNode.insertBefore(g, s);
            })();

            // Retrieve current optin value
            const self = this;
            _paq.push([function () {
                self.hasOptedIn = !this.isUserOptedOut();
                //$rootScope digest
                const $body = angular.element(document.body);
                const $rootScope = $body.scope().$root;
                $rootScope && $rootScope.$digest();
            }]);

            if (params.detailApps && window.entcore.template) {
                // Check the doNotTrack apps filter.
                if (!this.shouldTrackCurrentApp()) {
                    return;
                }
                // BIG AWFUL HACK to intercept calls to the template engine's open function :
                const encapsulatedFunction = window.entcore.template.open;
                const self = this;
                // intercept calls to the template engine
                window.entcore.template.open = function (name, view) {
                    var ret = encapsulatedFunction.apply(window.entcore.template, arguments);
                    if ("main" === name) {
                        // Build a virtual URL for this template
                        view = view || "unknown";
                        const url = location.href.split("#")[0] + "/" + view;
                        self.trackPage(document.title + " - " + name, url);
                    }
                    return ret;
                }
                // END OF BIG AWFUL HACK
            }
        } catch (e) {
            console.error('[TrackingMatomo] Invalid tracker object. Should look like {"siteId": 99999, "url":"http://your.matomo.server.com/"}"', e);
            throw e;
        }
    }

    trackPage(title: string, url: string): void {
        this.onReady && this.onReady.then(()=>{
            // Then let's track single-page applications routes, too.
            var _paq = window["_paq"] || [];
            _paq.push(['setDocumentTitle', title]);
            _paq.push(['setCustomUrl', url]);
            _paq.push(['trackPageView']);
        })
    }
    saveOptIn(): void {
        this.onReady && this.onReady.then(()=>{
            try {
                const _paq = window["_paq"] || [];
                _paq.push(this.hasOptedIn ? ['forgetUserOptOut'] : ['optUserOut']);
            } catch (e) {
                console.debug("[TrackingMatomo] could not saveOptIn: ", e);
            }
        });
    }
    protected doTrackEvent(event: TrackingEvent): void {
        try {
            const body: any[] = ['trackEvent', event.type];
            if (event.matomo) {
                const mat = event.matomo;
                (mat.action) && body.push(mat.action);
                (mat.resourceUri) && body.push(mat.resourceUri);
                (mat.value) && body.push(mat.value);
            }
            const _paq = window["_paq"] || [];
            _paq.push(body);
        } catch (e) {
            console.debug("[TrackingMatomo] could not trackEvent: ", e);
        }
    }
}

