"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var idiom_1 = require("../idiom");
var jquery_1 = require("../libs/jquery/jquery");
exports.tooltip = ng_start_1.ng.directive('tooltip', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            link: function (scope, element, attributes) {
                var tip;
                element.on('mouseover', function () {
                    if (!attributes.tooltip || attributes.tooltip === 'undefined') {
                        return;
                    }
                    tip = jquery_1.$('<div />')
                        .addClass('tooltip')
                        .html($compile('<div class="arrow"></div><div class="content">' + idiom_1.idiom.translate(attributes.tooltip) + '</div> ')(scope))
                        .appendTo('body');
                    scope.$apply();
                    var top = parseInt(element.offset().top + element.height());
                    var left = parseInt(element.offset().left + element.width() / 2 - tip.width() / 2);
                    if (top < 5) {
                        top = 5;
                    }
                    if (left < 5) {
                        left = 5;
                    }
                    tip.offset({
                        top: top,
                        left: left
                    });
                    tip.fadeIn();
                    element.one('mouseout', function () {
                        tip.fadeOut(200, function () {
                            jquery_1.$(this).remove();
                        });
                    });
                });
                scope.$on("$destroy", function () {
                    if (tip) {
                        tip.remove();
                    }
                    element.off();
                });
            }
        };
    }]);
//# sourceMappingURL=tooltip.js.map