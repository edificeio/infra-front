"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
exports.dotsMenu = ng_start_1.ng.directive('dotsMenu', function () {
    return {
        restrict: 'E',
        transclude: true,
        template: "\n            <i class=\"opener\"></i>\n            <div class=\"options\" ng-transclude></div>\n        ",
        link: function (scope, element, attributes) {
            var opener = element.children('.opener');
            opener.on('click', function () {
                if (element.offset().left < 400) {
                    element.addClass('right');
                }
                setTimeout(function () {
                    if (element.hasClass('opened')) {
                        element.removeClass('opened');
                    }
                    else {
                        element.addClass('opened');
                    }
                }, 10);
            });
            jquery_1.$('body, lightbox').on('click', function (e) {
                if (!jquery_1.$(element).hasClass('opener')) {
                    element.removeClass('opened');
                }
            });
        }
    };
});
//# sourceMappingURL=dotsMenu.js.map