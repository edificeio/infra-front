if((window as any).appPrefix === undefined){
	if(window.location.pathname.split('/').length > 0){
		(window as any).appPrefix = window.location.pathname.split('/')[1]
	}
}

if((window as any).infraPrefix === undefined){
	(window as any).infraPrefix = 'infra';
}

var currentLanguage = '';
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

var routes:any = {
	define: function(routing){
		this.routing = routing;
	}
};

if(!Array.prototype.forEach){
	window.location.href = "/auth/upgrade";
}