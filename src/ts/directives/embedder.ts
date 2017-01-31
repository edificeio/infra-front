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
                var preview = element.find('.' + scope.display.provider.name + ' .preview');
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
                    var preview = element.find('.' + scope.display.provider.name + ' .preview');
                    preview.html(
                        scope.display.htmlCode
                    );
                    return;
                }
                if(!scope.display.url){
                    return;
                }
                scope.display.invalidPath = false;
                var agnosticUrl = scope.display.url.split('//')[1];
                var matchParams = new RegExp('\{[a-zA-Z0-9_.]+\}', "g");
                var params = scope.display.provider.url.match(matchParams);

                var computedEmbed = scope.display.provider.embed;

                params.splice(1, params.length);
                params.forEach(function (param) {
                    var paramBefore = scope.display.provider.url.split(param)[0];
                    var additionnalSplit = paramBefore.split('}')
                    if (additionnalSplit.length > 1) {
                        paramBefore = additionnalSplit[additionnalSplit.length - 1];
                    }
                    var paramAfter = scope.display.provider.url.split(param)[1].split('{')[0];
                    var paramValue = scope.display.url.split(paramBefore)[1];
                    if (!paramValue) {
                        scope.display.invalidPath = true;
                    }
                    if(paramAfter){
                        paramValue = paramValue.split(paramAfter)[0];
                    }
                    
                    var replace = new RegExp('\\' + param.replace(/}/, '\\}'), 'g');
                    scope.display.htmlCode = computedEmbed.replace(replace, paramValue);
                });

                var preview = element.find('.' + scope.display.provider.name + ' .preview');
                preview.html(
                    scope.display.htmlCode
                );
            };
        }
    }
})