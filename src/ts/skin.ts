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
	is1D: false,
	get skinResolveFunc(){
		//load func
		skin.onSkinReady;
		Promise.resolve(skin.setIs1D());
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
				model.me.myApps = JSON.parse(data.preference);
				if (_.isArray(model.me.myApps)) {
					model.me.bookmarkedApps = model.me.myApps;
					model.me.myApps = {
						bookmarks: _.map(model.me.myApps, app => app.name),
						applications: []
					}
					http().putJson('/userbook/preference/apps', model.me.myApps);
					resolve();
					return;
				}
				if (!model.me.myApps){
					model.me.myApps = {
						bookmarks: [],
						applications: []
					}
				}
				model.me.bookmarkedApps = [];
				var upToDate = true;
				let remove = [];
				model.me.myApps.bookmarks.forEach(function(appName, index){
					var foundApp = _.findWhere(model.me.apps, { name: appName });
					if(foundApp){
						var app = {};
						for(var property in foundApp){
							app[property] = foundApp[property];
						}
						model.me.bookmarkedApps.push(app);
					}
					else{
						remove.push(appName);
						upToDate = false;
					}
				});
				remove.forEach(function(app) {
					var index = model.me.myApps.bookmarks.indexOf(app);
					model.me.myApps.bookmarks.splice(index, 1);
				});
				if(!upToDate){
					http().putJson('/userbook/preference/apps', model.me.myApps);
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
	},
	getBootstrapAssetsPath(): string {
        // use html tag attribute with-theme : <html with-theme="ode-bootstrap-neo">
        const htmlWithThemeElement: Element = document.querySelector('html[with-theme]');
        if (htmlWithThemeElement) {
            return `/assets/themes/${htmlWithThemeElement.getAttribute('with-theme')}`
        } else {
            // use link bootstrap css tag attribute href : <link rel="stylesheet" type="text/css" id="theme" href="/assets/themes/ode-bootstrap-neo/skins/default/theme.css">
            const themeCssElement: Element = document.querySelector('#theme');
            if (themeCssElement && themeCssElement.hasAttribute('href')) {
                const themeHrefSplit = themeCssElement.getAttribute('href').split('/skins');
                if (themeHrefSplit && themeHrefSplit.length > 0) {
                    return themeHrefSplit[0];
                }
            }
        }
        return '';
    },
	setIs1D() {
		Promise.resolve(ui.getCurrentThemePreference()).then((conf) => {
			skin.is1D = (conf.parent === 'panda'); 
		});

	}
};

if (!(window as any).entcore) {
    (window as any).entcore = {};
}
(window as any).entcore.skin = skin;
