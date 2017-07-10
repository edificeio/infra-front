"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
exports.bottomScroll = ng_start_1.ng.directive('bottomScroll', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            var scrollElement = element;
            var getContentHeight = function () { return element[0].scrollHeight; };
            if (element.css('overflow') !== 'auto' && attributes.scrollable === undefined) {
                scrollElement = jquery_1.$(window);
                getContentHeight = function () { return jquery_1.$(document).height(); };
            }
            scrollElement.scroll(function () {
                var scrollHeight = scrollElement[0].scrollY || scrollElement[0].scrollTop || scrollElement[0].pageYOffset;
                //adding ten pixels to account for system specific behaviours
                scrollHeight += 10;
                if (getContentHeight() - scrollElement.height() < scrollHeight) {
                    scope.$eval(attributes.bottomScroll);
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                }
            });
        }
    };
});
//# sourceMappingURL=bottomScroll.js.map