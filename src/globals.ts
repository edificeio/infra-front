var _ = require('underscore');
(window as any)._ = _;

if(!(window as any).entcore){
	(window as any).entcore = {};
}

if((window as any).appPrefix === undefined){
	if(window.location.pathname.split('/').length > 0){
		(window as any).appPrefix = window.location.pathname.split('/')[1]
	}
}

if((window as any).infraPrefix === undefined){
	(window as any).infraPrefix = 'infra';
}

export var currentLanguage = '';
(function(){
	var request = new XMLHttpRequest();
	request.open('GET', '/locale');
	(request as any).async = false;
	request.onload = function(){
		if(request.status === 200){
			currentLanguage = JSON.parse(request.responseText).locale;
		}
	};
	request.send(null);
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