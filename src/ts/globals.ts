require('es6-shim');
var _ = require('underscore');
(window as any)._ = _;

declare let moment: any;

if(!(window as any).entcore){
	(window as any).entcore = {};
}

if((window as any).appPrefix === undefined){
    if(!(window as any).entcore){
        (window as any).entcore = {};
    }
	if(window.location.pathname.split('/').length > 0){
		(window as any).appPrefix = window.location.pathname.split('/')[1];
        (window as any).entcore.appPrefix = (window as any).appPrefix;
	}
}

export var appPrefix: string = (window as any).appPrefix;

if((window as any).infraPrefix === undefined){
	(window as any).infraPrefix = 'infra';
}

export var infraPrefix: string = (window as any).infraPrefix;

export var currentLanguage = '';
(function(){

    // User preferences language
    var preferencesRequest = new XMLHttpRequest();
	preferencesRequest.open('GET', '/userbook/preference/language');
	(preferencesRequest as any).async = false;

	preferencesRequest.onload = function(){
        var fallBack = function(){
            // Fallback : navigator language
            var request = new XMLHttpRequest();
            request.open('GET', '/locale');
            (request as any).async = false;
            request.onload = function(){
                if(request.status === 200){
                    currentLanguage = JSON.parse(request.responseText).locale;
                    if((window as any).moment){
                        if (currentLanguage === 'fr') {
                            moment.lang(currentLanguage, {
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

        if(preferencesRequest.status === 200){
            try{
    			currentLanguage = JSON.parse(JSON.parse(preferencesRequest.responseText).preference)['default-domain'];
    		} catch(e) {
    			fallBack();
    		}
        }

        if(!currentLanguage)
            fallBack();
    };
    preferencesRequest.send(null);

}());

if(document.addEventListener){
	document.addEventListener('DOMContentLoaded', function(){
		document.getElementsByTagName('body')[0].style.display = 'none';
	});
}

export var routes:any = {
	define: function(routing){
		this.routing = routing;
	}
};

(window as any).entcore.routes = routes;

if(!Array.prototype.forEach){
	window.location.href = "/auth/upgrade";
}
