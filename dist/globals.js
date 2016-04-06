"use strict";
if (window.appPrefix === undefined) {
    if (window.location.pathname.split('/').length > 0) {
        window.appPrefix = window.location.pathname.split('/')[1];
    }
}
if (window.infraPrefix === undefined) {
    window.infraPrefix = 'infra';
}
exports.currentLanguage = '';
(function () {
    var request = new XMLHttpRequest();
    request.open('GET', '/locale');
    request.async = false;
    request.onload = function () {
        if (request.status === 200) {
            exports.currentLanguage = JSON.parse(request.responseText).locale;
        }
    };
    request.send(null);
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
if (!Array.prototype.forEach) {
    window.location.href = "/auth/upgrade";
}
