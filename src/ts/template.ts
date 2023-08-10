import { appPrefix } from './globals';
import { skin } from './skin';
import { $ } from "./libs/jquery/jquery";

let appFolder = appPrefix;
if(appFolder === 'userbook'){
	appFolder = 'directory';
}

export interface TemplateDelegate{
	tryOpen(args:{name:string, view:string, success:()=>void,reject:()=>void}):void;
}
function getVersion(){
	return (window as any).springboardBuildDate || new Date().getTime()
}
type PromiseWithResolvers =  {promise:Promise<void>, resolve():void, reject():void };
export var template = {
	viewPath: '/' + appFolder + '/public/template/',
	containers: {} as any,
	readyPromises:{} as {[id:string]:PromiseWithResolvers},
	callbacks: {},
	_delegate: null as TemplateDelegate,
	getReadyPromise(name:string, forceReset = false){
		if(!template.readyPromises[name] || forceReset){
			let resolve = null, reject = null;
			const promise =  new Promise<any>((res,rej)=>{
				resolve = res;
				reject = rej;
			})
			template.readyPromises[name] = {resolve, reject, promise};
		}
		return template.readyPromises[name];
	},
	deleteReadyPromise(name:string){
		delete template.readyPromises[name];
	},
	setDelegate(delegate: TemplateDelegate) {
		template._delegate = delegate;
	},
	removeDelegate() { template.setDelegate(null); },
	getCompletePath(view:string, isPortal?:boolean):string {
		const split = $('#context').attr('src').split('-');
		const hash = split[split.length - 1].split('.')[0];
		var path = this.viewPath + view + '.html?hash=' + hash+"&version="+getVersion();
		//fix entcore path
		if(view && view.startsWith("entcore/")){
			const fixedView = view.replace(/^entcore/,"");
			path = '/assets/js/entcore/template'+fixedView+ '.html?hash=' + hash+"&version="+getVersion();
		}
		//fix portal path
		var folder = appPrefix;
		if(appPrefix === '.' || !!isPortal){
			folder = 'portal';
		}
		//fix override paths
		if(skin.templateMapping[folder] && skin.templateMapping[folder].indexOf(view) !== -1){
			path = '/assets/themes/' + skin.skin + '/template/' + folder + '/' + view + '.html?hash=' + hash+"&version="+getVersion();
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
		return new Promise(async (resolve, reject) => {
			if (template._delegate) {
				await template.getReadyPromise(name).promise;
				//already open...
				if(!template._delegate){
					template._open(name, view);
					resolve();
					return;
				}
				template._delegate.tryOpen({
					name,
					view,
					success() {
						template._open(name, view);
						resolve();
					},
					reject
				})
			} else {
				try {
					template._open(name, view);
					resolve();
				} catch (e) {
					reject(e);
				}
			}
		})
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
	watch: function(container: string, fn){
		if(typeof fn !== 'function'){
			template.getReadyPromise(container).reject();
			throw TypeError('template.watch(string, function) called with wrong parameters');
		}
		template.getReadyPromise(container).resolve();
		if(!this.callbacks){
			this.callbacks = {};
		}
		if(!this.callbacks[container]){
			this.callbacks[container] = [];
		}
		this.callbacks[container].push(fn);
	},
	unwatch: function(container:string, fn)
	{
		template.deleteReadyPromise(container);
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
	}
};


if(!window.entcore){
	window.entcore = {};
}
window.entcore.template = template;