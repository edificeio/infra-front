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
				//adding some pixels to account for system specific behaviours
				scrollHeight += 100;

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


export let onBottomScroll = ng.directive('onBottomScroll', function(){
	return {
		restrict: 'A',
		link: function (scope, element, attributes) {
			const onBottomScrollOffset = parseInt(attributes.onBottomScrollOffset) || 100;
		    element.scroll(function () {
				const height = element.outerHeight();
				const scrollTop = element.scrollTop();
				const scrollHeight = element.prop("scrollHeight");
				const remaining = scrollHeight - (height+scrollTop)
				if (remaining < onBottomScrollOffset) {
				    scope.$eval(attributes.onBottomScroll);
				    if (!scope.$$phase) {
				        scope.$apply();
					}
				}
			});
		}
	}
});