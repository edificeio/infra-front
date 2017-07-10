"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var idiom_1 = require("./idiom");
require('core-js');
var _ = require('underscore');
window._ = _;
window.lang = idiom_1.idiom;
if (!window.entcore) {
    window.entcore = {};
}
if (window.appPrefix === undefined) {
    if (!window.entcore) {
        window.entcore = {};
    }
    if (window.location.pathname.split('/').length > 0) {
        window.appPrefix = window.location.pathname.split('/')[1];
        window.entcore.appPrefix = window.appPrefix;
    }
}
var xsrfCookie;
if (document.cookie) {
    var cookies = _.map(document.cookie.split(';'), function (c) {
        return {
            name: c.split('=')[0].trim(),
            val: c.split('=')[1].trim()
        };
    });
    xsrfCookie = _.findWhere(cookies, { name: 'XSRF-TOKEN' });
}
exports.appPrefix = window.appPrefix;
if (window.infraPrefix === undefined) {
    window.infraPrefix = 'infra';
}
exports.infraPrefix = window.infraPrefix;
exports.currentLanguage = '';
(function () {
    // User preferences language
    var preferencesRequest = new XMLHttpRequest();
    preferencesRequest.open('GET', '/userbook/preference/language');
    if (xsrfCookie) {
        preferencesRequest.setRequestHeader('X-XSRF-TOKEN', xsrfCookie.val);
    }
    preferencesRequest.async = false;
    preferencesRequest.onload = function () {
        var fallBack = function () {
            // Fallback : navigator language
            var request = new XMLHttpRequest();
            request.open('GET', '/locale');
            if (xsrfCookie) {
                request.setRequestHeader('X-XSRF-TOKEN', xsrfCookie.val);
            }
            request.async = false;
            request.onload = function () {
                if (request.status === 200) {
                    exports.currentLanguage = JSON.parse(request.responseText).locale;
                    if (window.moment) {
                        if (exports.currentLanguage === 'fr') {
                            moment.updateLocale(exports.currentLanguage, {
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
                            moment.lang(exports.currentLanguage);
                        }
                    }
                }
            };
            request.send(null);
        };
        if (preferencesRequest.status === 200) {
            try {
                exports.currentLanguage = JSON.parse(JSON.parse(preferencesRequest.responseText).preference)['default-domain'];
            }
            catch (e) {
                fallBack();
            }
        }
        if (!exports.currentLanguage)
            fallBack();
    };
    preferencesRequest.send(null);
}());
if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', function () {
        document.getElementsByTagName('body')[0].style.display = 'none';
    });
}
exports.routes = {
    define: function (routing) {
        this.routing = routing;
    }
};
exports.cleanJSON = function (obj) {
    if (!obj) {
        return obj;
    }
    if (obj instanceof Array) {
        return obj.map(function (e) { return exports.cleanJSON(e); });
    }
    var dup = {};
    if (obj.toJSON) {
        dup = obj.toJSON();
        return dup;
    }
    for (var prop in obj) {
        if (typeof obj[prop] === 'object' && !(obj[prop] instanceof Array)) {
            dup[prop] = exports.cleanJSON(obj[prop]);
        }
        else {
            if (obj[prop] instanceof Array) {
                dup[prop] = [];
                for (var _i = 0, _a = obj[prop]; _i < _a.length; _i++) {
                    var el = _a[_i];
                    dup[prop].push(exports.cleanJSON(el));
                }
            }
            else if (obj.hasOwnProperty(prop) && prop !== 'callbacks' && prop !== 'data' && prop !== '$$hashKey') {
                dup[prop] = obj[prop];
            }
        }
    }
    return dup;
};
window.entcore.routes = exports.routes;
window.entcore.cleanJSON = exports.cleanJSON;
if (!Array.prototype.forEach) {
    window.location.href = "/auth/upgrade";
}
//# sourceMappingURL=globals.js.map