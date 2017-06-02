"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moment = require('moment');
if (!window.entcore) {
    window.entcore = {};
}
window.entcore.moment = exports.moment;
window.moment = exports.moment;
if (window.currentLanguage) {
    if (window.currentLanguage === 'fr') {
        exports.moment.lang(window.currentLanguage, {
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
        exports.moment.lang(window.currentLanguage);
    }
}
//# sourceMappingURL=moment.js.map