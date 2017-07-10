"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var idiom_1 = require("./idiom");
var humane = require('humane-js');
exports.notify = {
    message: function (type, message) {
        message = idiom_1.idiom.translate(message);
        humane.spawn({ addnCls: 'humane-original-' + type })(message);
    },
    error: function (message) {
        this.message('error', message);
    },
    info: function (message) {
        this.message('info', message);
    },
    success: function (message) {
        this.message('success', message);
    }
};
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.notify = exports.notify;
window.notify = exports.notify;
//# sourceMappingURL=notify.js.map