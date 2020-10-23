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

export interface ConnectorLightboxScope {
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
let _MUTEX = false;

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

const _onTriggerApp = new Subject<App>();

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
                element.on('click', function () {
                    _onTriggerApp.next(scope.connectorLightboxTrigger);
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
            let _app: App = null;
            //private functions
            const init = async () => {
                //event
                const sub = _onTriggerApp.subscribe((event) => {
                    if (_MUTEX == true) {
                        return;
                    }
                    _MUTEX = true;
                    _app = event;
                    openAppWithCheck(event);
                })
                scope.$on('$destroy', function () {
                    sub.unsubscribe();
                });
                scope.authenticatedConnectorsAccessed = await _getPreference();
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
                _MUTEX = false;
            }
            scope.onConfirm = function (): void {
                scope.onClose();
                if (scope.authenticatedConnectorsAccessed) {
                    scope.authenticatedConnectorsAccessed.push(_app.name);
                } else {
                    scope.authenticatedConnectorsAccessed = [_app.name];
                }

                http().putJson('/userbook/preference/authenticatedConnectorsAccessed', scope.authenticatedConnectorsAccessed);

                if (_app.target) {
                    window.open(_app.address, _app.target);
                } else {
                    window.open(_app.address, '_self');
                }
            };
            const openAppWithCheck = function (app: App): void {
                if (isAuthenticatedConnector(app) && isAuthenticatedConnectorFirstAccess(app)) {
                    scope.authenticatedConnectorClicked = app;
                    scope.display.showAuthenticatedConnectorLightbox = true;
                    scope.$apply();
                } else {
                    if (app.target) {
                        window.open(app.address, app.target);
                    } else {
                        window.open(app.address, '_self');
                    }
                }
            };
            //init
            init();
        }
    }
}]);
