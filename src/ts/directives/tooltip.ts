import { ng } from '../ng-start';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';
import { ui } from '../ui';

export let tooltip = ng.directive('tooltip', ['$compile', function($compile){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
			if($(window).width() < ui.breakpoints.tablette){
				return;
			}


			var tooltipCheck = true;
			//you can add a condition to display the tooltip
			if(element[0].hasAttribute('tooltip-check')){
				scope.$watch(() => scope.$eval(attributes.tooltipCheck), (newVal) => {
					if(!newVal){
						tooltipCheck = false;
					}
					else{
						tooltipCheck = true
					}
				});
			}

			var tip;
			element.on('mouseover', function(){
				if(!attributes.tooltip || !tooltipCheck || attributes.tooltip === 'undefined'){
					return;
				}
				tip = $('<div />')
					.addClass('tooltip')
					.html($compile('<div class="arrow"></div><div class="content">' + idiom.translate(attributes.tooltip) + '</div> ')(scope))
					.appendTo('body');
				scope.$apply();

				var top = parseInt(element.offset().top + element.height());
				var left = parseInt(element.offset().left + element.width() / 2 - tip.width() / 2);
				if(top < 5){
					top = 5;
				}
				if(left < 5){
					left = 5;
				}
				tip.offset({
					top: top,
					left: left
				});
				tip.fadeIn();
				element.one('mouseout', function(){
					tip.fadeOut(200, function(){
						$(this).remove();
					})
				});
			});

			scope.$on("$destroy", function() {
				if(tip){
					tip.remove();
				}

				element.off();
			});

		}
	}
}]);
