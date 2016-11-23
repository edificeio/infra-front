import { Behaviours } from './behaviours';
import { model } from './modelDefinitions';
import { infraPrefix, appPrefix } from './globals';
import { http } from './http';
import { idiom } from './idiom';
import { _ } from './libs/underscore/underscore';

export let sniplets = {
	load: function(callback){
		var sniplets = this;
		http().get('/resources-applications').done(function(apps) {
			if(model.me){
				apps = model.me.apps.filter(function (app) {
					return _.find(apps, function (match) {
						return app.address.indexOf(match) !== -1 && app.icon.indexOf('/') === -1
					});
				});
				apps.push({
					displayName: 'directory',
					address: '/directory'
				})
			}
			else{
				apps = [appPrefix, 'workspace'];
			}

			var all = apps.length;
			apps.forEach(function(app){
				var appPrefix = app.address ? app.address.split('/')[1] : app;
				Behaviours.loadBehaviours(appPrefix, function(behaviours){
					if(behaviours.sniplets){
						sniplets.sniplets = sniplets.sniplets.concat(_.map(behaviours.sniplets, function(sniplet, name){ return { application: appPrefix, template: name, sniplet: sniplet } }));
						idiom.addBundle('/' + appPrefix + '/i18n');
					}
					all --;
					if(typeof callback === 'function' && all === 0){
						callback();
					}
				})
				.error(function(){
					all --;
				});
			});
		})
	},
	sniplets: []
};
