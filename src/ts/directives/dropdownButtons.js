"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
exports.dropdownButtons = ng_start_1.ng.directive('dropdownButtons', function () {
    return {
        restrict: 'E',
        link: function (scope, element, attributes) {
            var setClasses = function () {
                if (element.offset().left > jquery_1.$(window).width() / 2) {
                    element.addClass('right');
                }
                else {
                    element.removeClass('right');
                }
                if (element.offset().top > jquery_1.$(window).height() / 2) {
                    element.addClass('bottom');
                }
                else {
                    element.removeClass('bottom');
                }
                if (element.css('position') === 'static') {
                    setTimeout(function () { return setClasses(); }, 500);
                }
            };
            setClasses();
            jquery_1.$(window).on('resize', setClasses);
            element.find('open').on('click', function () {
                if (element.hasClass('opened')) {
                    element.removeClass('opened');
                }
                else {
                    element.addClass('opened');
                }
            });
            jquery_1.$('body').on('click', function (e) {
                if (e.target === element.children('open')[0] || element.children('open').find(e.target).length > 0) {
                    return;
                }
                element.removeClass('opened');
            });
        }
    };
});
//# sourceMappingURL=dropdownButtons.js.map