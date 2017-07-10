import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';

export let bottomScroll = ng.directive('bottomScroll', function(){
	return {
		restrict: 'A',
		link: function (scope, element, attributes) {
		    let scrollElement = element;
		    let getContentHeight =  () => element[0].scrollHeight;
            if (element.css('overflow') !== 'auto' && attributes.scrollable === undefined) {
		        scrollElement = $(window);
		        getContentHeight = () => $(document).height();
		    }
		    scrollElement.scroll(function () {
		        let scrollHeight = scrollElement[0].scrollY || scrollElement[0].scrollTop || scrollElement[0].pageYOffset;
				//adding ten pixels to account for system specific behaviours
				scrollHeight += 10;

				if (getContentHeight() - scrollElement.height() < scrollHeight) {
				    scope.$eval(attributes.bottomScroll);
				    if (!scope.$$phase) {
				        scope.$apply();
					}
				}
			});
		}
	}
});