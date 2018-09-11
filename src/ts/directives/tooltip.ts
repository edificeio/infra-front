import { ng } from '../ng-start';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';
import { template } from '../template';
import { ui } from '../ui';

export let tooltip = ng.directive('tooltip', ['$compile', function($compile){
	return {
		restrict: 'A',
		link: function(scope, element, attributes){
            let tgtElement = element;
            if (attributes.tooltipTargetSelector) {
                tgtElement = element.find(attributes.tooltipTargetSelector);
                if (!tgtElement) return;
            }

            let restrictToElement;
            if (attributes.tooltipRestrictSelector) {
                restrictToElement = tgtElement.parents(attributes.tooltipRestrictSelector);
                if (restrictToElement.length !== 1) restrictToElement = undefined;
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
            // Handle multiline  
            if(element[0].hasAttribute('tooltip-check-content')) {
				scope.$watch(function() { return element[0].offsetHeight }, function (newValue, oldValue) {
                    tooltipCheck = element[0].offsetHeight < element[0].scrollHeight;
                });
			}

			var tip;
            tgtElement.on('mouseenter', function() {
                if (attributes.tooltipTemplate) {
                    var tplPath = template.getPath(attributes.tooltipTemplate);
                    tip = $('<div />')
                        .addClass('tooltip')
                        .html($compile('<div ng-include=\'\"' + tplPath + '\"\'></div>')(scope))
                        .appendTo('body');
                    scope.$apply();

                    tip.css('position', 'absolute');
                    let top  = tgtElement.offset().top;
                    let left = parseInt(tgtElement.offset().left - tip.width() - 5);

                    if (restrictToElement) {
                        if (left < restrictToElement.offset().left) {
                            left = parseInt(tgtElement.offset().left + tgtElement.width() + 5);
                        }

                        if (left + tgtElement.width() > restrictToElement.offset().left + restrictToElement.width()) {
                            left = restrictToElement.offset().left + 5;
                            top += 30;
                        }

                        if (top > restrictToElement.height() + 150) {
                            top -= 130;
                        }
                    }

                    tip.css('left', left);
                    tip.css('top', top);
                } else {
                    if($(window).width() < ui.breakpoints.tablette || !attributes.tooltip || !tooltipCheck || attributes.tooltip === 'undefined'){
                        return;
                    }
                    tip = $('<div />')
                        .addClass('tooltip')
                        .html($compile('<div class="arrow"></div><div class="content">' + idiom.translate(attributes.tooltip) + '</div> ')(scope))
                        .appendTo('body');
                    scope.$apply();

                    var top = parseInt(element.offset().top + element.outerHeight());
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
                }
				tip.fadeIn();
				tgtElement.one('mouseleave', function(){
					tip.fadeOut(200, function(){
						$(this).remove();
					})
				});
			});

			scope.$on("$destroy", function() {
				if(tip){
					tip.remove();
				}

                tgtElement.off();
			});

		}
	}
}]);