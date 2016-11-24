import { http } from './http';
import { ui } from './ui';

export var skin = {
	addDirectives: undefined as any,
	templateMapping: {},
	skin: 'raw',
	theme: '/assets/themes/raw/default/',
	portalTemplate: '/assets/themes/raw/portal.html',
	basePath: '',
	logoutCallback: '/',
	loadDisconnected: async function(): Promise<any>{
		return new Promise((resolve, reject) => {
			var rand = Math.random();
			var that = this;
			http().get('/skin', { token: rand }).done(function(data){
				that.skin = data.skin;
				that.theme = '/assets/themes/' + data.skin + '/default/';
				that.basePath = that.theme + '../';

				http().get('/assets/themes/' + data.skin + '/template/override.json', { token: rand }, { disableNotifications: true }).done(function(override){
					that.templateMapping = override;
					resolve();
				})
				.e404(() => resolve());
			}).e404(function(){});
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
		http().get('/userbook/api/edit-userbook-info?prop=theme&value=' + theme._id);
	},
	loadConnected: async function(): Promise<any>{
		var rand = Math.random();
		var that = this;
		return new Promise((resolve, reject) => {
			http().get('/theme').done(function(data){
				that.theme = data.skin;
				that.basePath = that.theme + '../';
				that.skin = that.theme.split('/assets/themes/')[1].split('/')[0];
				that.portalTemplate = '/assets/themes/' + that.skin + '/portal.html';
				that.logoutCallback = data.logoutCallback;

				http().get('/assets/themes/' + that.skin + '/template/override.json', { token: rand }).done(function(override){
					that.templateMapping = override;
					resolve();
				})
				.e404(() => { 
					resolve(); 
				});
			});
		});
	}
};

if (!(window as any).entcore) {
    (window as any).entcore = {};
}
(window as any).entcore.skin = skin;