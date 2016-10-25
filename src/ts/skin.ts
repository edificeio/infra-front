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
	loadDisconnected: function(){
		var rand = Math.random();
		var that = this;
		http().get('/skin', { token: rand }, {
			async: false,
			success: function(data){
				that.skin = data.skin;
				that.theme = '/assets/themes/' + data.skin + '/default/';
				that.basePath = that.theme + '../';

				http().get('/assets/themes/' + data.skin + '/template/override.json', { token: rand }, {
					async: false,
					disableNotifications: true,
					success: function(override){
						that.templateMapping = override;
					}
				}).e404(function(){});
			}
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
	loadConnected: function(){
		var rand = Math.random();
		var that = this;
		http().get('/theme', {}, {
			async: false,
			success: function(data){
				that.theme = data.skin;
				that.basePath = that.theme + '../';
				that.skin = that.theme.split('/assets/themes/')[1].split('/')[0];
				that.portalTemplate = '/assets/themes/' + that.skin + '/portal.html';
				that.logoutCallback = data.logoutCallback;

				http().get('/assets/themes/' + that.skin + '/template/override.json', { token: rand }, {
					async: false,
					disableNotifications: true,
					success: function(override){
						that.templateMapping = override;
					}
				});
			}
		});
	}
};

if (!(window as any).entcore) {
    (window as any).entcore = {};
}
(window as any).entcore.skin = skin;