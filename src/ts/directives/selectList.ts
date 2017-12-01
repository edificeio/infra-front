import { ng } from '../ng-start';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';

export const selectList = ng.directive('selectList', function(){
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            displayAs: '@',
            placeholder: '@',
            display: '='
        },
        template: '' +
            '<div class="selected-value">[[showValue()]]</div>' +
            '<div class="options hidden" ng-transclude></div>',
        link: function(scope, element, attributes){
            scope.showValue = function(){
                if(!scope.display){
                    return idiom.translate(scope.placeholder);
                }
                if(!scope.displayAs){
                    return idiom.translate(scope.display);
                }
                return idiom.translate(scope.display[scope.displayAs]);
            };

            element.children('.options').on('mouseover', function (e){
                e.stopPropagation()
            });

            element.children('.selected-value').on('click', function(){
                if (element.children('.options').hasClass('hidden')) {
                    setTimeout(function () {
                        element.parent().css({ 'z-index': 9999 });
                        element.parents('editor-toolbar').each(function(index, item) {
                            $(item).css({
                                'margin-top': '-' + item.scrollTop + 'px',
                                'min-height': '0',
                                'height': 'auto'
                            })
                        });
                        element.parents().css({
                                overflow: 'visible'
                        });
                    }, 0);
                    
                    element.children('.options').removeClass('hidden');
                    element.children('.options').height(element.children('.options')[0].scrollHeight);
                }
                else {
                    element.parent().css({ 'z-index': '' });
                    element.parents().css({ overflow: '' });
                    element.parents('editor-toolbar').each(function (index, item) {
                        $(item).css({ 'margin-top': '', 'min-height': '', height: '' })
                    });
                    element.children('.options').addClass('hidden');
                }
            });

            $('body').click(function(e){
                if (e.target === element.find('.selected-value')[0] ||
                    element.children('.options').hasClass('hidden')) {
                    return;
                }

                if (element.parents('lightbox').length === 0) {
                    element.parent().css({ 'z-index': '' });
                    element.parents().css({ overflow: '' });
                }

                element.parents('editor-toolbar').each(function (index, item) {
                    $(item).css({ 'margin-top': '', 'min-height': '', height: '' })
                });

                element.children('.options').addClass('hidden');
            });
        }
    }
});