"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var modelDefinitions_1 = require("./modelDefinitions");
var ng_start_1 = require("./ng-start");
var http_1 = require("./http");
var idiom_1 = require("./idiom");
exports.widgets = {
    Widget: function () { }
};
exports.widgets.Widget.prototype.switchHide = function () {
    if (this.mandatory)
        return;
    if (!this.hide) {
        this.hide = false;
    }
    this.hide = !this.hide;
    this.trigger('change');
    modelDefinitions_1.model.widgets.trigger('change');
    modelDefinitions_1.model.widgets.savePreferences();
};
function WidgetModel() {
    modelDefinitions_1.model.makeModels(exports.widgets);
    modelDefinitions_1.model.collection(exports.widgets.Widget, {
        preferences: {},
        savePreferences: function () {
            var that = this;
            this.forEach(function (widget) {
                that.preferences[widget.name].hide = widget.hide;
                that.preferences[widget.name].index = widget.index;
            });
            http_1.http().putJson('/userbook/preference/widgets', this.preferences);
        },
        sync: function () {
            var that = this;
            var data = modelDefinitions_1.model.me.widgets;
            http_1.http().get('/userbook/preference/widgets').done(function (pref) {
                if (!pref.preference) {
                    this.preferences = {};
                }
                else {
                    this.preferences = JSON.parse(pref.preference);
                }
                data = data.map(function (widget, i) {
                    if (!that.preferences[widget.name]) {
                        that.preferences[widget.name] = { index: i, show: true };
                    }
                    widget.index = that.preferences[widget.name].index;
                    widget.hide = widget.mandatory ? false : that.preferences[widget.name].hide;
                    return widget;
                });
                for (var i = 0; i < data.length; i++) {
                    var widget = data[i];
                    (function (widget) {
                        if (widget.i18n) {
                            idiom_1.idiom.addTranslations(widget.i18n, function () {
                                that.push(widget);
                                http_1.http().loadScript(widget.js);
                            });
                        }
                        else {
                            that.push(widget);
                            http_1.http().loadScript(widget.js);
                        }
                    })(widget);
                }
            }.bind(this));
        },
        findWidget: function (name) {
            return this.findWhere({ name: name });
        },
        apply: function () {
            modelDefinitions_1.model.trigger('widgets.change');
        }
    });
}
var ctrl = ng_start_1.ng.controller('Widgets', ['$scope', 'model', function ($scope, model) {
        if (!model.widgets) {
            WidgetModel();
            model.widgets.sync();
        }
        $scope.widgets = model.widgets;
        $scope.allowedWidget = function (widget) {
            return (!$scope.list || $scope.list.indexOf(widget.name) !== -1) && !widget.hide;
        };
        model.on('widgets.change', function () {
            if (!$scope.$$phase) {
                $scope.$apply('widgets');
            }
        });
        $scope.translate = idiom_1.idiom.translate;
        $scope.switchHide = function (widget, $event) {
            widget.switchHide();
            $event.stopPropagation();
        };
    }]);
ng_start_1.ng.controllers.push(ctrl);
//# sourceMappingURL=widget.js.map