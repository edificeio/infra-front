import { ng } from '../ng-start';
import { ui } from '../ui';
import { $ } from '../libs/jquery/jquery';

let initialPosition;
let maxDistance;
let firstScroll = true;

let placeRow = (element) => {
    if(firstScroll){
        initialPosition = element.offset().top - parseInt(element.css('margin-top'));
        maxDistance = $('.height-marker').height();
        firstScroll = false;
    }
    let newPosition = initialPosition - $(window)[0].scrollY;
    if (newPosition <= maxDistance) {
        newPosition = maxDistance;
        element.addClass('floating');
        
    }
    else {
        element.removeClass('floating');
    }

   element.css({
        top: newPosition + 'px'
    });
};

export let stickyRow = ng.directive('stickyRow', () => {
    return {
        restrict: 'E',
        template: `
            <div class="row" ng-transclude></div>
        `,
        scope: { name: '@' },
        transclude: true,
        link: async (scope, element, attributes) => {
            let applyListener = () => {
                if($(window).width() > ui.breakpoints.tablette){
                    $(window).on('scroll.stickyRow', () => placeRow(element));
                }
                else{
                    $(window).off('scroll.stickyRow');
                    element.removeClass('floating');
                }
            }
            $(window).on('resize', applyListener());
            applyListener();
        }
    }
})