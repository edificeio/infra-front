import { ng } from '../ng-start';
import { appPrefix } from '../globals';
import { http } from '../http';
import { $ } from '../libs/jquery/jquery';

export let embedder = ng.directive('embedder', () => {
    return {
        restrict: 'E',
        scope: {
            ngModel: '=',
            onChange: '&',
            show: '='
        },
        templateUrl: '/' + appPrefix + '/public/template/entcore/embedder.html',
        link: function(scope, element, attributes){
            scope.display = {
                provider: {
                    name: 'none'
                }
            };

            scope.providers = [];

            element.on('focus', 'textarea', (e) => {
                $(e.target).next().addClass('focus');
                $(e.target).next().addClass('move');
                $(e.target).prev().addClass('focus');
            });

            element.on('blur', 'textarea', (e) => {
                if (!$(e.target).val()) {
                    $(e.target).next().removeClass('move');
                }
                $(e.target).next().removeClass('focus');
                $(e.target).prev().removeClass('focus');
            });

            scope.$watch('show', function(){
                scope.unselectProvider();
            });

            http().get('/infra/embed/default').done(function (providers) {
                providers.forEach(function (provider) {
                    scope.providers.push(provider);
                });
            });

            http().get('/infra/embed/custom').done(function (providers) {
                providers.forEach(function (provider) {
                    provider.name = provider.name.toLowerCase().replace(/\ |\:|\?|#|%|\$|£|\^|\*|€|°|\(|\)|\[|\]|§|'|"|&|ç|ù|`|=|\+|<|@/g, '')
                    scope.providers.push(provider);
                });
            });

            scope.applyHtml = function (template) {
                scope.show = false;
                scope.ngModel = scope.display.htmlCode;
                scope.$apply();
                scope.onChange();
                scope.unselectProvider();
            };

            scope.cancel = function () {
                scope.show = false;
                scope.unselectProvider();
            };

            scope.unselectProvider = function () {
                let preview = element.find('.' + scope.display.provider.name + ' .preview');
                preview.html('');
                scope.display.provider = { name: 'none' };
                scope.display.url = '';
                scope.display.htmlCode = '';
                scope.display.invalidPath = false;
            };

            scope.$watch(
                function(){
                    return scope.display.htmlCode;
                }, 
                function(newVal){
                    setTimeout(function(){
                        scope.updatePreview();
                    }, 20);
                }
            );

            scope.$watch(
                function () {
                    return scope.display.url;
                },
                function (newVal) {
                    setTimeout(function () {
                        scope.updatePreview();
                    }, 20);
                }
            );
            
            scope.updatePreview = function () {

                if(scope.display.provider.name === 'other'){
                    let preview = element.find('.' + scope.display.provider.name + ' .preview');
                    preview.html(
                        scope.display.htmlCode
                    );
                    return;
                }
                if(!scope.display.url){
                    return;
                }

                label:for(let pattern of scope.display.provider.url) {

                    let matchParams = new RegExp('\{[a-zA-Z0-9_.]+\}', "g");
                    let params = pattern.match(matchParams);
                    let computedEmbed = scope.display.provider.embed;

                    for(let param of params) {

                        scope.display.invalidPath = false;

                        let paramBefore = pattern.split(param)[0];
                        let additionalSplit = paramBefore.split('}')

                        if (additionalSplit.length > 1) {
                            paramBefore = additionalSplit[additionalSplit.length - 1];
                        }

                        let paramAfter = pattern.split(param)[1].split('{')[0];
                        let paramValue = scope.display.url.split(paramBefore)[1];

                        if (!paramValue && param !== "{ignore}") {
                            scope.display.invalidPath = true;
                            continue label;
                        }
                        if(paramAfter){
                            paramValue = paramValue.split(paramAfter)[0];
                        }

                        let replace = new RegExp('\\' + param.replace(/}/, '\\}'), 'g');

                        computedEmbed = computedEmbed.replace(replace, paramValue);
                        scope.display.htmlCode = computedEmbed;

                        if(param === params[params.length - 1]) {
                            break label;
                        }
                    };
                };

                let preview = element.find('.' + scope.display.provider.name + ' .preview');
                preview.html(
                    scope.display.htmlCode
                );

            };
        }
    }
})
