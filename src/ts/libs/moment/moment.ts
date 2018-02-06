export var moment = require('moment');

export const frLocales = {
    calendar: {
        lastDay: '[Hier à] HH[h]mm',
        sameDay: '[Aujourd\'hui à] HH[h]mm',
        nextDay: 'dddd D MMMM YYYY',
        lastWeek: 'dddd D MMMM YYYY',
        nextWeek: 'dddd D MMMM YYYY',
        sameElse: 'dddd D MMMM YYYY'
    }
};

require('moment/min/locales');

if (!window.entcore) {
    window.entcore = {};
}
window.entcore.moment = moment;
(window as any).moment = moment;

if((window as any).currentLanguage){
    if ((window as any).currentLanguage === 'fr') {
        moment.locale((window as any).currentLanguage, frLocales);
    }
    else {
        moment.locale((window as any).currentLanguage);
    }
}