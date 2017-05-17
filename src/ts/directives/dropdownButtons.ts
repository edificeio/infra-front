import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';

export let dropdownButtons = ng.directive('dropdownButtons', () => {
    return {
        restrict: 'E',
        link: (scope, element, attributes) => {
            const setClasses = () => {
                if(element.offset().left > $(window).width() / 2){
                    element.addClass('right');
                }
                else{
                    element.removeClass('right');
                }
                if(element.offset().top > $(window).height() / 2){
                    element.addClass('bottom');
                }
                else{
                    element.removeClass('bottom');
                }

                if(element.css('position') === 'static'){
                    setTimeout(() => setClasses(), 500);
                }
                
            };

            setClasses();
            $(window).on('resize', setClasses);

            element.find('open').on('click', () => {
                if(element.hasClass('opened')){
                    element.removeClass('opened');
                }
                else{
                    element.addClass('opened');
                }
            });

            $('body').on('click', (e) => {
                if(e.target === element.children('open')[0] || element.children('open').find(e.target).length > 0){
                    return;
                }

                element.removeClass('opened');
            });
        }
    }
});
