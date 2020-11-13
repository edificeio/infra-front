import { http, httpPromisy } from '../http';
import { ng } from '../ng-start';
import { Subject } from "rxjs";

type App = {
    name: string,
    target: string,
    address: string,
    casType: string,
    scope: string[]
}
type AppEvent = {
    app:App,
    $mutex?:boolean,
    ctrlKey:boolean,   // Was CTRL key pressed ?
    metaKey: boolean // Was Command key pressed? (Apple keyboard)
}

export interface ConnectorLightboxScope {
    skipCheck: boolean;
    display: {
        showAuthenticatedConnectorLightbox: boolean
    }
    authenticatedConnectorClicked: App
    authenticatedConnectorsAccessed: string[]
    onClose(): void;
    onConfirm(): void;
    $on: any;
    $apply: any;
}

export interface ConnectorLightboxTriggerScope {
    connectorLightboxTrigger: App;
    $on: any;
}

let _CACHE = undefined;

const _getPreference = async () => {
    if (_CACHE) {
        return _CACHE;
    }
    try {
        const data = await httpPromisy<any>().get('/userbook/preference/authenticatedConnectorsAccessed');
        if (data.preference) {
            _CACHE = JSON.parse(data.preference);
        }
    } catch (e) {
        console.log('Error parsing authenticatedConnectorsAccessed preferences');
        _CACHE = {}
    }
    return _CACHE;
}

const _onTriggerApp = new Subject<AppEvent>();

export let connectorLightboxTrigger = ng.directive('connectorLightboxTrigger', ['$timeout', '$filter', function ($timeout, $filter) {
    return {
        restrict: 'A',
        scope: {
            connectorLightboxTrigger: "=",
        },
        link: function (scope: ConnectorLightboxTriggerScope, element, attributes) {
            //private functions

            const init = async () => {
                //event
                element.on('click', function (event: MouseEvent) {
                    const appEvent = { 
                        app: scope.connectorLightboxTrigger,
                        $mutex: false,
                        ctrlKey: !!event.ctrlKey,
                        metaKey: !!event.metaKey
                    } as AppEvent;
                    _onTriggerApp.next( appEvent );
                })
                scope.$on('$destroy', function () {
                    element.off('click');
                });
            }
            //init
            init();
        }
    }
}]);


export let connectorLightbox = ng.directive('connectorLightbox', ['$timeout', '$filter', function ($timeout, $filter) {
    return {
        restrict: 'E',
        scope: {
        },
        template: `
        <lightbox show="display.showAuthenticatedConnectorLightbox" on-close="onClose()">
            <h3><i18n>apps.authenticatedConnector.lightbox.title</i18n></h3>
            <div class="info vertical-spacing-twice"><i18n>apps.authenticatedConnector.lightbox.content</i18n></div>
            
            <div>
                <button class="horizontal-spacing" 
                        ng-click="onConfirm(authenticatedConnectorClicked)">
                    <i18n>confirm</i18n>
                </button>
                <button class="horizontal-spacing" 
                        ng-click="onClose()">
                    <i18n>cancel</i18n>
                </button>
            </div>
        </lightbox>

        `,
        link: function (scope: ConnectorLightboxScope, element, attributes) {
            scope.display = {
                showAuthenticatedConnectorLightbox: false
            };
            let _appEvent: AppEvent = null;
            //private functions
            const init = async () => {
                //event
                const sub = _onTriggerApp.subscribe((event) => {
                    _appEvent = event;
                    openAppWithCheck(_appEvent);
                })
                scope.$on('$destroy', function () {
                    sub.unsubscribe();
                });
                scope.authenticatedConnectorsAccessed = await _getPreference();
                try{
                    const conf = await httpPromisy<any>().get('/cas/conf/public');
                    scope.skipCheck = !!conf.skip;
                } catch(e){
                    console.warn("Failed to get public conf: ", e)
                }
            }
            const isAuthenticatedConnector = function (app: App): boolean {
                return !!app.casType || (app.scope && app.scope.length > 0 && !!app.scope[0]);
            };

            const isAuthenticatedConnectorFirstAccess = function (app: App): boolean {
                return !scope.authenticatedConnectorsAccessed
                    || (scope.authenticatedConnectorsAccessed && !scope.authenticatedConnectorsAccessed.includes(app.name));
            }
            //public functions
            scope.onClose = function () {
                scope.display.showAuthenticatedConnectorLightbox = false;
            }
            scope.onConfirm = function (): void {
                const _app = _appEvent.app;
                scope.onClose();
                if (scope.authenticatedConnectorsAccessed) {
                    scope.authenticatedConnectorsAccessed.push(_app.name);
                } else {
                    scope.authenticatedConnectorsAccessed = [_app.name];
                }

                const target = _appEvent.ctrlKey || _appEvent.metaKey ? '_blank' : !!_app.target ? _app.target : '_self';

                if (target !== '_self') {
                    http().putJson('/userbook/preference/authenticatedConnectorsAccessed', scope.authenticatedConnectorsAccessed);
                    window.open(_app.address, target);
                } else {
                    (async function()
                    {
                        await httpPromisy<any>().putJson('/userbook/preference/authenticatedConnectorsAccessed', scope.authenticatedConnectorsAccessed);
                        window.open(_app.address, target);
                    })();
                }
            };
            const openAppWithCheck = function (appEvent: AppEvent): void {
                if(appEvent.$mutex){
                    return;
                }
                appEvent.$mutex = true;

                // Sanity check
                const app = appEvent.app;
                if( typeof app === "undefined" )
                    throw "ConnectorLightboxScope.openAppWithCheck failed : target app is undefined";
                
                const target = _appEvent.ctrlKey || _appEvent.metaKey ? '_blank' : !!app.target ? app.target : '_self';

                if(scope.skipCheck){
                    window.open(app.address, target);
                    return;
                }
                if (isAuthenticatedConnector(app) && isAuthenticatedConnectorFirstAccess(app)) {
                    scope.authenticatedConnectorClicked = app;
                    scope.display.showAuthenticatedConnectorLightbox = true;
                    scope.$apply();
                } else {
                    window.open(app.address, target);
                }
            };
            //init
            init();
        }
    }
}]);
