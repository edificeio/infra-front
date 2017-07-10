"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
exports.bindHtml = ng_start_1.ng.directive('bindHtml', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            scope: {
                bindHtml: '='
            },
            link: function (scope, element) {
                scope.$watch('bindHtml', function (newVal) {
                    var htmlVal = jquery_1.$('<div>' + (newVal || '') + '</div>');
                    htmlVal.find('[resizable]').removeAttr('resizable').css('cursor', 'initial');
                    htmlVal.find('[bind-html]').removeAttr('bind-html');
                    htmlVal.find('[ng-include]').removeAttr('ng-include');
                    htmlVal.find('[ng-transclude]').removeAttr('ng-transclude');
                    htmlVal.find('[draggable]').removeAttr('draggable').css('cursor', 'initial');
                    htmlVal.find('[contenteditable]').removeAttr('contenteditable');
                    htmlVal.find('script').remove();
                    htmlVal.find('*').each(function (index, item) {
                        var attributes = item.attributes;
                        for (var i = 0; i < attributes.length; i++) {
                            if (attributes[i].name.startsWith('on')) {
                                item.removeAttribute(attributes[i].name);
                            }
                        }
                    });
                    var htmlContent = htmlVal[0].outerHTML;
                    if (!window.MathJax && !window.MathJaxLoading) {
                        var script = jquery_1.$('<script></script>')
                            .attr('src', '/infra/public/mathjax/MathJax.js')
                            .appendTo('head');
                        script[0].async = false;
                        window.MathJax.Hub.Config({
                            messageStyle: 'none',
                            tex2jax: { preview: 'none' },
                            jax: ["input/TeX", "output/CommonHTML"],
                            extensions: ["tex2jax.js", "MathMenu.js", "MathZoom.js"],
                            TeX: {
                                extensions: ["AMSmath.js", "AMSsymbols.js", "noErrors.js", "noUndefined.js"]
                            }
                        });
                        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
                    }
                    element.html($compile(htmlContent)(scope.$parent));
                    //weird browser bug with audio tags
                    element.find('audio').each(function (index, item) {
                        var parent = jquery_1.$(item).parent();
                        jquery_1.$(item)
                            .attr("src", item.src)
                            .attr('preload', 'none')
                            .detach()
                            .appendTo(parent);
                    });
                    if (window.MathJax && window.MathJax.Hub) {
                        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
                    }
                });
            }
        };
    }]);
//# sourceMappingURL=bindHtml.js.map