import { idiom as lang, idiom as idiom } from './idiom';

var humane = require('humane-js');

export var notify = {
	message: function(type, message, timeout?){
		message = lang.translate(message);
		var options = { addnCls: 'humane-original-' + type };
		if(timeout != null)
			options["timeout"] = timeout;
		humane.spawn(options)(message);
	},
	error: function(message, timeout?){
		this.message('error', message, timeout);
	},
	info: function(message, timeout?){
		this.message('info', message, timeout)
	},
	success: function(message, timeout?){
		this.message('success', message, timeout);
	}
};

if(!(window as any).entcore){
	(window as any).entcore = {};
}
(window as any).entcore.notify = notify;
(window as any).notify = notify;

//pupetter mode => no notification
if((window as any).pupetterMode){
	notify.message= (type, message)=>{
		switch(type){
			case 'error':
				console.error(message);
				break;
			default:
				console.log(message);
				break;
		}
	}
}