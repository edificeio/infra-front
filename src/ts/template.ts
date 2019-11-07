import { appPrefix } from './globals';
import { skin } from './skin';
import { $ } from "./libs/jquery/jquery";
import { navigationGuardService, TemplateRouteChangeListener, INavigationInfo } from './navigationGuard';

let appFolder = appPrefix;
if(appFolder === 'userbook'){
	appFolder = 'directory';
}

let navGuardListener: TemplateRouteChangeListener = TemplateRouteChangeListener.getInstance();
navigationGuardService.registerListener(navGuardListener);

export var template = {
	viewPath: '/' + appFolder + '/public/template/',
	containers: {} as any,
	callbacks: {},
	_guardIgnores: [],

	getCompletePath(view:string, isPortal?:boolean):string {
		const split = $('#context').attr('src').split('-');
		const hash = split[split.length - 1].split('.')[0];
		var path = this.viewPath + view + '.html?hash=' + hash;
		var folder = appPrefix;
		if(appPrefix === '.' || !!isPortal){
			folder = 'portal';
		}
		if(skin.templateMapping[folder] && skin.templateMapping[folder].indexOf(view) !== -1){
			path = '/assets/themes/' + skin.skin + '/template/' + folder + '/' + view + '.html?hash=' + hash;
		}
		return path;
	},
	/**
	 * Enable overriding template into portal directive 
	 */
	loadPortalTemplates():void{
		this.containers
		this.containers['portal'] = {};
		this.containers.portal['conversationUnread'] = this.getCompletePath('conversation-unread', true);
	},
	open: function(name: string, view?: string)
	{
		for(let i = this._guardIgnores.length; i-- > 0;)
		{
			if(this._guardIgnores[i] == name)
			{
				template._open(name, view);
				return;
			}
		}
		navGuardListener.onChange.next({
			accept: function()
			{
				template._open(name, view);
			},
			reject: function()
			{
				// Do nothing
			}
		});
	},
	_open: function(name:string, view?:string){
		if(!view){
			view = name;
		}
		if(view && view.startsWith("local:")){
			this.containers[name] = view.replace("local:", "");
		}else{
			this.containers[name] = this.getCompletePath(view);
		}

		if(this.callbacks && this.callbacks[name]){
			this.callbacks[name].forEach(function(cb){
				cb();
			});
		}
	},
	contains: function(name, view){
		const split = $('#context').attr('src').split('-');
		const hash = split[split.length - 1].split('.')[0];
		return this.containers[name] === this.viewPath + view + '.html?hash=' + hash;
	},
	isEmpty: function(name){
		return this.containers[name] === 'empty' || !this.containers[name];
	},
	getPath: (view) => {
        const split = $('#context').attr('src').split('-');
        const hash = split[split.length - 1].split('.')[0];
        return this.template.viewPath + view + '.html?hash=' + hash;
	},
	close: function(name){
		this.containers[name] = 'empty';
		if(this.callbacks && this.callbacks[name]){
			this.callbacks[name].forEach(function(cb){
				cb();
			});
		}
	},
	watch: function(container, fn){
		if(typeof fn !== 'function'){
			throw TypeError('template.watch(string, function) called with wrong parameters');
		}
		if(!this.callbacks){
			this.callbacks = {};
		}
		if(!this.callbacks[container]){
			this.callbacks[container] = [];
		}
		this.callbacks[container].push(fn);
	},
	unwatch: function(container, fn)
	{
		if(typeof fn !== 'function'){
			throw TypeError('template.unwatch(string, function) called with wrong parameters');
		}
		if(this.callbacks != null && this.callbacks[container] != null)
		{
			let cbCont = this.callbacks[container];
			for(let i = cbCont.length; i-- > 0;)
				if(cbCont[i] == fn)
					cbCont.splice(i, 1);
		}
	},
	addIgnoreGuard: function(name)
	{
		this._guardIgnores.push(name);
	},
	removeIgnoreGuard: function(name)
	{
		for(let i = this._guardIgnores.length; i-- > 0;)
			if(this._guardIgnores[i] == name)
				this._guardIgnores.splice(i, 1);
	},
};


if(!window.entcore){
	window.entcore = {};
}
window.entcore.template = template;