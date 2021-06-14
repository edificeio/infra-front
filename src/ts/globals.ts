import { UAParser } from 'ua-parser-js';
require('core-js');
var _ = require('underscore');
(window as any)._ = _;

declare let moment: any;

if(!window.entcore){
	window.entcore = {};
}

if((window as any).appPrefix === undefined){
    if(!window.entcore){
        window.entcore = {};
    }
	if(window.location.pathname.split('/').length > 0){
		(window as any).appPrefix = window.location.pathname.split('/')[1];
        window.entcore.appPrefix = (window as any).appPrefix;
	}
}

var xsrfCookie;
if(document.cookie){
    var cookies = _.map(document.cookie.split(';'), function(c){
        return {
            name: c.split('=')[0].trim(), 
            val: c.split('=')[1].trim()
        };
    });
    xsrfCookie = _.findWhere(cookies, { name: 'XSRF-TOKEN' });
}

export var appPrefix: string = (window as any).appPrefix;

if((window as any).infraPrefix === undefined){
	(window as any).infraPrefix = 'infra';
}

export let infraPrefix: string = (window as any).infraPrefix;
export let currentLanguage = '';
export type BrowserInfo = {
    name:'MSIE'|'Edge'|'Chrome'|'Safari'|'Firefox'|'Opera'|'CriOS'|'FxiOS',
    version:number,
}
export type OSInfo = {
    name: string | undefined;
    version: string | undefined;
}
export const devices = {
    /* A few User Agent strings for testing purposes: 
    * iPod / iPad / iPhone
        Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1
        Mozilla/5.0 (iPad; CPU OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.1 Mobile/15E148 Safari/604.1
        Mozilla/5.0 (iPad; CPU OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1
    */
    getOSInfo: (uaString?: string): OSInfo => {
        let uaParser: UAParser = new UAParser(uaString);
        return uaParser.getOS();
    },
    isIE: () => navigator.userAgent.indexOf('Trident') !== -1,
    isiOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
    isIphone: () => navigator.userAgent.indexOf("iPhone") != -1,
    isIpod: () => navigator.userAgent.indexOf("iPod") != -1 ,
    isIpad: () =>navigator.userAgent.indexOf("iPad") != -1 ,
    getBrowserInfo ():BrowserInfo{
        const safeSplit = (str: string = "", pattern: string = "") => {
            if (typeof str == "string") {
                return str.split(pattern);
            } else {
                return [];
            }
        }
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('OPR') !== -1) {
			const operaVersion = safeSplit(userAgent, 'OPR/')[1];
			const version = parseInt(safeSplit(operaVersion, '.')[0]);
			return {
				name: 'Opera',
				version: version,
			}
        } else if (userAgent.indexOf('Edg') !== -1) {
			const edgeVersion = safeSplit(userAgent, 'Edg/')[1];
			const version = parseInt(safeSplit(edgeVersion, '.')[0]);
			return {
				name: 'Edge',
				version: version,
            }
        } else if (userAgent.indexOf('Chrome') !== -1) {
			const chromeVersion = safeSplit(userAgent, 'Chrome/')[1];
			const version = parseInt(safeSplit(chromeVersion, '.')[0]);
			return {
				name: 'Chrome',
				version: version,
			}
		}
		else if (userAgent.indexOf('IEMobile') !== -1) {
			const ieVersion = safeSplit(userAgent, 'IEMobile/')[1];
			const version = parseInt(safeSplit(ieVersion, ';')[0]);
			return {
				name: 'MSIE',
				version: version,
			}
		}
        else if (userAgent.indexOf('AppleWebKit') !== -1 
            && userAgent.indexOf('Chrome') === -1
            && userAgent.indexOf('CriOS') === -1
            && userAgent.indexOf('FxiOS') === -1) {
			const safariVersion = safeSplit(userAgent, 'Version/')[1];
			const version = parseInt(safeSplit(safariVersion, '.')[0]);
			return {
				name: 'Safari',
				version: version,
			}
		}
		else if (userAgent.indexOf('Firefox') !== -1) {
			const ffVersion = safeSplit(userAgent, 'Firefox/')[1];
			const version = parseInt(safeSplit(ffVersion, '.')[0]);
			return {
				name: 'Firefox',
				version: version,
			}
		}
		else if (userAgent.indexOf('MSIE') !== -1) {
			const msVersion = safeSplit(userAgent, 'MSIE ')[1];
			const version = parseInt(safeSplit(msVersion, ';')[0]);
			return {
				name: 'MSIE',
				version: version,
			}
		}
		else if (userAgent.indexOf('MSIE') === -1 && userAgent.indexOf('Trident') !== -1) {
			const msVersion = safeSplit(userAgent, 'rv:')[1];
			const version = parseInt(safeSplit(msVersion, '.')[0]);
			return {
				name: 'MSIE',
				version: version,
			}
        } 
        else if (userAgent.indexOf('CriOS') !== -1) {
            const chromeIOsVersion = safeSplit(userAgent, 'CriOS/')[1];
			const version = parseInt(safeSplit(chromeIOsVersion, '.')[0]);
			return {
				name: 'CriOS',
				version: version,
			}
        } else if (userAgent.indexOf('FxiOS') !== -1) {
            const ffIOsVersion = safeSplit(userAgent, 'FxiOS/')[1];
			const version = parseInt(safeSplit(ffIOsVersion, '.')[0]);
			return {
				name: 'FxiOS',
				version: version,
			}
        }
    }
};

export type DEVICE_TYPE = 'Mobile' | 'Tablet' | 'Desktop';
export let deviceType: DEVICE_TYPE;

if (navigator.userAgent.match(/Mobile/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/IEMobile/i)
    || navigator.userAgent.match(/Windows Phone/i)
    || navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/webOS/i)) {
    deviceType = 'Mobile';
    document.getElementsByTagName('html')[0].setAttribute('mobile-device', '');
} else if (navigator.userAgent.match(/Tablet/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/Nexus 7/i)
    || navigator.userAgent.match(/Nexus 10/i)
    || navigator.userAgent.match(/KFAPWI/i)) {
    deviceType = 'Tablet';
        document.getElementsByTagName('html')[0].setAttribute('tablet-device', '');
} else {
    deviceType = 'Desktop';
    document.getElementsByTagName('html')[0].setAttribute('desktop-device','');
}

const defaultLanguage = () => {
    const request = new XMLHttpRequest();
    request.open('GET', '/locale');
    if(xsrfCookie){
        request.setRequestHeader('X-XSRF-TOKEN', xsrfCookie.val);
    }
    (request as any).async = false;
    request.onload = function(){
        if(request.status === 200){
            currentLanguage = JSON.parse(request.responseText).locale;
            (window as any).currentLanguage = currentLanguage;
            window.entcore.currentLanguage = currentLanguage;
            if((window as any).moment){
                if (currentLanguage === 'fr') {
                    moment.updateLocale(currentLanguage, {
                        calendar: {
                            lastDay: '[Hier à] HH[h]mm',
                            sameDay: '[Aujourd\'hui à] HH[h]mm',
                            nextDay: '[Demain à] HH[h]mm',
                            lastWeek: 'dddd [dernier à] HH[h]mm',
                            nextWeek: 'dddd [prochain à] HH[h]mm',
                            sameElse: 'dddd LL'
                        }
                    });
                }
                else {
                    moment.lang(currentLanguage);
                }
            }
        }
    };
    request.send(null);
}

(function(){
    if(window.notLoggedIn){
        defaultLanguage();
        return;
    }
    // User preferences language
    var preferencesRequest = new XMLHttpRequest();
	preferencesRequest.open('GET', '/userbook/preference/language');
    preferencesRequest.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if(xsrfCookie){
        preferencesRequest.setRequestHeader('X-XSRF-TOKEN', xsrfCookie.val);
    }
	(preferencesRequest as any).async = false;

	preferencesRequest.onload = function(){
        if(preferencesRequest.status === 200){
            try{
                currentLanguage = JSON.parse(JSON.parse(preferencesRequest.responseText).preference)['default-domain'];
                (window as any).currentLanguage = currentLanguage;
                window.entcore.currentLanguage = currentLanguage;
    		} catch(e) {
    			defaultLanguage();
    		}
        }

        if(!currentLanguage){
            defaultLanguage();
        }
    };
    preferencesRequest.send(null);
}());

if(document.addEventListener){
	document.addEventListener('DOMContentLoaded', function(){
		document.getElementsByTagName('body')[0].style.display = 'none';
	});
}

export let routes:any = {
	define: function(routing){
		this.routing = routing;
	}
};

export let cleanJSON = (obj) => {
    if (!obj) {
        return obj;
    }
    
    if(obj instanceof Array){
        return obj.map((e) => cleanJSON(e));
    }

    let dup = {};
    
    if (obj.toJSON) {
        dup = obj.toJSON();
        return dup;
    }

    if (typeof obj === 'string') {
        return obj;
    }

    for (let prop in obj) {
        if (typeof obj[prop] === 'object' && !(obj[prop] instanceof Array)) {
            dup[prop] = cleanJSON(obj[prop])
        }
        else {
            if (obj[prop] instanceof Array) {
                dup[prop] = [];
                for (let el of obj[prop]) {
                    dup[prop].push(cleanJSON(el));
                }
            }
            else if (obj.hasOwnProperty(prop) && prop !== 'callbacks' && prop !== 'data' && prop !== '$$hashKey') {
                dup[prop] = obj[prop];
            }
        }
    }
    return dup;
}

(window as any).entcore.routes = routes;
(window as any).entcore.cleanJSON = cleanJSON;

if(!Array.prototype.forEach){
	window.location.href = "/auth/upgrade";
}
