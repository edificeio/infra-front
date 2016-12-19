import { ng } from '../ng-start';

import { $ } from '../libs/jquery/jquery';

export let dotsMenu = ng.directive('dotsMenu', () => {
    return {
        restrict: 'E',
        transclude: true,
        template: `
            <div class="opener"></div>
            <div class="options" ng-transclude></div>
        `,
        link: (scope, element, attributes) => {
            let opener = element.children('.opener');
            opener.on('click', () => {
                if (element.hasClass('opened')) {
                    element.removeClass('opened');
                }
                else {
                    element.addClass('opened');
                }
            });

            $('body').on('click', (e) => {
                if (element.find(e.target).length === 0) {
                    element.removeClass('opened');
                }
            });
        }
    }
});