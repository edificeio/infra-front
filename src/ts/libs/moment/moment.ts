export var moment = require('moment');
require('moment/min/locales');

if (!window.entcore) {
    window.entcore = {};
}
window.entcore.moment = moment;
(window as any).moment = moment;

if((window as any).currentLanguage){
    if ((window as any).currentLanguage === 'fr') {
        moment.locale((window as any).currentLanguage, {
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
        moment.locale((window as any).currentLanguage);
    }
}