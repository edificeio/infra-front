import { model } from './modelDefinitions';
import { skin } from './entcore';
import { ng } from './ng-start';
import { http } from './http';
import { idiom as lang } from './idiom';

const firstLevelWidgets = ["birthday", "mood", "calendar-widget", "notes"];
const secondLevelWidgets = [
	"carnet-de-bord", 
	"my-apps", 
	"rss-widget", 
	"bookmark-widget", 
	"cursus-widget",
	"maxicours-widget",
    "school-widget"
];

export let widgets = {
	Widget: function(){}
}

widgets.Widget.prototype.switchHide = function(){
    if(this.mandatory)
        return
	if(!this.hide){
		this.hide = false;
	}
	this.hide = !this.hide;
	this.trigger('change');
	model.widgets.trigger('change');
	model.widgets.savePreferences();
}

function WidgetModel(){
	model.makeModels(widgets);
	model.collection(widgets.Widget, {
		preferences: {},
		savePreferences: function(){
			var that = this;
			this.forEach(function(widget){
				that.preferences[widget.name].hide = widget.hide;
				that.preferences[widget.name].index = widget.index;
			});
			http().putJson('/userbook/preference/widgets', this.preferences);
		},
		sync: function(){
			var that = this;
			var data = model.me.widgets;

			http().get('/userbook/preference/widgets').done(async function(pref){
				if(!pref.preference){
					this.preferences = {};
				}
				else{
					this.preferences = JSON.parse(pref.preference);
				}
				await skin.listSkins().then(function(){
					let widgetsToHide = skin.skins.find((s) => s.child == skin.skin).parent == "panda" ?
						secondLevelWidgets :
						firstLevelWidgets;
					data = data.filter((widget => widgetsToHide.find((w) => w == widget.name) ? false : true));
					data = data.map(function(widget, i){
						if(!that.preferences[widget.name]){
							that.preferences[widget.name] = { index: i, show: true };
						}
						widget.index = that.preferences[widget.name].index;
						widget.hide = widget.mandatory ? false : that.preferences[widget.name].hide;
						return widget;
					})
					data = data.sort((a, b) => {
						const translatedA = lang.translate(`timeline.settings.${a.name}`).toLowerCase();
						const translatedB = lang.translate(`timeline.settings.${b.name}`).toLowerCase();
						if (translatedA < translatedB) return -1;
						if (translatedA > translatedB) return 1;
						return 0;
					});
				});

                for(var i = 0; i < data.length; i++){
					var widget = data[i];
					(function(widget){
						if (widget.i18n) {
							lang.addTranslations(widget.i18n, function(){
								that.push(widget)
								http().loadScript(widget.js,undefined,{disableNotifications:true})
							})
						} else {
							that.push(widget)
							http().loadScript(widget.js,undefined,{disableNotifications:true})
						}
					})(widget)
                }
			}.bind(this))
		},
		findWidget: function(name){
			return this.findWhere({name: name});
		},
		apply: function(){
			model.trigger('widgets.change');
		}
	});
}

let ctrl = ng.controller('Widgets', ['$scope', 'model', function($scope, model){
	if(!model.widgets){
		WidgetModel();
		model.widgets.sync();
	}

	$scope.widgets = model.widgets;

	$scope.allowedWidget = function(widget){
		return (!$scope.list || $scope.list.indexOf(widget.name) !== -1) && !widget.hide;
	}

	model.on('widgets.change', function(){
		if(!$scope.$$phase){
			$scope.$apply('widgets');
		}
	});

	$scope.translate = lang.translate;
	$scope.switchHide = function(widget, $event){
		widget.switchHide();
		$event.stopPropagation();
	}
}]);

ng.controllers.push(ctrl);