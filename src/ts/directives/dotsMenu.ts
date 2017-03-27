import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';

export let dotsMenu = ng.directive('dotsMenu', () => {
    return {
        restrict: 'E',
        transclude: true,
        template: `
            <i class="opener"></i>
            <div class="options" ng-transclude></div>
        `,
        link: (scope, element, attributes) => {
            let opener = element.children('.opener');
            opener.on('click', () => {
                if(element.offset().left < 400){
                    element.addClass('right');
                }
                setTimeout(() => {
                    if (element.hasClass('opened')) {
                        element.removeClass('opened');
                    }
                    else {
                        element.addClass('opened');
                    }
                }, 10);
            });

            $('body, lightbox').on('click', (e) => {
                if(!$(element).hasClass('opener')){
                    element.removeClass('opened');
                }
            });
        }
    }
});
