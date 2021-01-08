import { http } from './http';
import { ui } from './ui';
import { model } from './modelDefinitions';
import { _ } from './libs/underscore/underscore';

let _skinResolved, _skinRejected = null;
export var skin = {
	skinName:'',
	themeName:'',
	addDirectives: undefined as any,
	templateMapping: {},
	skin: 'raw',
	theme: '/assets/themes/raw/default/',
	portalTemplate: '/assets/themes/raw/portal.html',
	basePath: '',
	logoutCallback: '/',
	_onSkinReady:null,
	get skinResolveFunc(){
		//load func
		skin.onSkinReady;
		return _skinResolved;
	},
	get skinRejectedFunc(){
		//load func
		skin.onSkinReady;
		return _skinRejected;
	},
	get onSkinReady(){
		if(skin._onSkinReady == null){
			skin._onSkinReady = new Promise((_resolve, _reject) => {
				_skinResolved = _resolve;
				_skinRejected = _reject;
			})
		}
		return skin._onSkinReady;
	},
	loadDisconnected: async function(): Promise<any>{
		return new Promise((resolve, reject) => {
			var rand = Math.random();
			http().get('/skin', { token: rand }).done((data) => {
				this.skin = data.skin;
				this.theme = (window as any).CDN_DOMAIN + '/assets/themes/' + data.skin + '/skins/default/';
				this.basePath = this.theme + '../../';
				skin.skinResolveFunc();
				http().get('/assets/themes/' + data.skin + '/template/override.json', { token: rand }, { disableNotifications: true }).done((override) => {
					this.templateMapping = override;
					resolve();
				})
				.e404(() => resolve());
			}).e404(() => {
				skin.skinRejectedFunc();
			});
		});
	},
	listThemes: function(cb){
		http().get('/themes').done(function(themes){
			if(typeof cb === 'function'){
				cb(themes);
			}
		});
	},
	setTheme: function(theme){
		ui.setStyle(theme.path);
		http().get('/userbook/api/edit-userbook-info?prop=theme-' + skin + '&value=' + theme._id);
	},
	
	skins: [],
	pickSkin: false,
	themeConf: undefined,
	themeConfPromise: undefined,
	listSkins: function(): Promise<any>{
		let conf = { overriding:[] };
		if(this.themeConfPromise){
			return this.themeConfPromise;
		}
		this.themeConfPromise = new Promise<any>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('get', '/assets/theme-conf.js');
			xhr.onload = async () => {
				eval(xhr.responseText.split('exports.')[1]);
				this.themeConf = this.conf = conf;
				const currentTheme = this.conf.overriding.find(t => t.child === skin.skin);
				if(currentTheme.group){
					this.skins = this.conf.overriding.filter(t => t.group === currentTheme.group);
				}
				else{
					this.skins = this.conf.overriding;
				}
				if(this.skins.length > 1){
					this.pickSkin = true;
				}
				resolve();
			};
			xhr.send();
		});
		return this.themeConfPromise;
	},
	loadBookmarks: async function(){
		return new Promise<any>((resolve, reject) => {
			http().get('/userbook/preference/apps').done(function(data){
				if(!data.preference){
					data.preference = null;
				}
				model.me.bookmarkedApps = JSON.parse(data.preference) || [];
				var upToDate = true;
				let remove = [];
				_.isArray(model.me.bookmarkedApps) && model.me.bookmarkedApps.forEach(function(app, index){
					var foundApp = _.findWhere(model.me.apps, { name: app.name });
					var updateApp = true;
					if(foundApp){
						updateApp = JSON.stringify(foundApp) !== JSON.stringify(app);
						if(updateApp){
							for(var property in foundApp){
								app[property] = foundApp[property];
							}
						}
					}
					else{
						remove.push(app);
					}
					
					upToDate = upToDate && !updateApp;
				});
				remove.forEach(function(app) {
					var index = model.me.bookmarkedApps.indexOf(app);
					model.me.bookmarkedApps.splice(index, 1);
				});
				if(!upToDate){
					http().putJson('/userbook/preference/apps', model.me.bookmarkedApps);
				}

				resolve();
			});
		});
	},
	loadConnected: async function(): Promise<any>{
		const rand = Math.random();
		const that = this;
		return new Promise((resolve, reject) => {
			http().get('/theme').done(function(data){
				that.skinName = data.skinName;
				that.themeName = data.themeName;
				that.theme = data.skin;
				that.basePath = (window as any).CDN_DOMAIN + that.theme + '../../';
				that.skin = that.theme.split('/assets/themes/')[1].split('/')[0];
				that.portalTemplate = (window as any).CDN_DOMAIN + '/assets/themes/' + that.skin + '/portal.html';
				that.logoutCallback = data.logoutCallback;
				skin.skinResolveFunc();
				http().get('/assets/themes/' + that.skin + '/template/override.json', { token: rand }).done(function(override){
					that.templateMapping = override;
					if (window.entcore.template) {
						window.entcore.template.loadPortalTemplates();
					}
					resolve();
				})
				.e404(() => { 
					resolve(); 
					skin.skinRejectedFunc();
				});
			});
		});
	},
	getHelpPath(): Promise<String> {
		let conf = { overriding:[] };
		return new Promise<any>((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open('get', '/assets/theme-conf.js');
			xhr.onload = async () => {
				eval(xhr.responseText.split('exports.')[1]);
				this.conf = conf;
				const override = this.conf.overriding.find(it => it.child === skin.skin);
				resolve((override.help ? override.help : '/help')); 
			};
			xhr.send();
		});
	}
};

if (!(window as any).entcore) {
    (window as any).entcore = {};
}
(window as any).entcore.skin = skin;
