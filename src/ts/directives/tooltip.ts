import { ng } from '../ng-start';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';
import { template } from '../template';
import { ui } from '../ui';

function tooltipLink($compile: any, scope: any, element: any, attributes: { [name: string]: string }, tooltipDisplayCondition: (any) => boolean, tooltipType: string, sourceElement: any) {
    let targetElement = element;
    if (attributes.tooltipTargetSelector) {
        targetElement = element.find(attributes.tooltipTargetSelector);
        if (!targetElement) return;
    }

    let restrictToElement;
    if (attributes.tooltipRestrictSelector) {
        restrictToElement = targetElement.parents(attributes.tooltipRestrictSelector);
        if (restrictToElement.length !== 1) {
            restrictToElement = undefined;
        }
    }

    let tooltipCheck = true;
    //you can add a condition to display the tooltip
    if (element[0].hasAttribute('tooltip-check')) {
        scope.$watch(() => scope.$eval(attributes.tooltipCheck), (newVal) => {
            tooltipCheck = !!newVal
        });
    }
    // Handle multiline
    if (element[0].hasAttribute('tooltip-check-content')) {
        scope.$watch(() => { return element[0].offsetHeight }, () => {
            tooltipCheck = element[0].offsetHeight < element[0].scrollHeight;
        });
    }

    let tip;
    targetElement.on('mouseenter', function () {

        if (attributes.tooltipTemplate) {
            let templatePath = template.getPath(attributes.tooltipTemplate);
            tip = $('<div />')
                .addClass('tooltip')
                .html($compile('<div ng-include=\'\"' + templatePath + '\"\'></div>')(scope))
                .appendTo('body');
            scope.$apply();

            tip.css('position', 'absolute');
            let top = targetElement.offset().top;
            let left = parseInt(targetElement.offset().left - tip.width() - 5);

            if (restrictToElement) {
                if (left < restrictToElement.offset().left) {
                    left = parseInt(targetElement.offset().left + targetElement.width() + 5);
                }

                if (left + targetElement.width() > restrictToElement.offset().left + restrictToElement.width()) {
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
            if ($(window).width() < ui.breakpoints.tablette || !attributes[tooltipType] || !tooltipCheck || attributes[tooltipType] === 'undefined') {
                return;
            }
            tip = $('<div />')
                .addClass('tooltip')
                .html($compile('<div class="arrow"></div><div class="content">' + idiom.translate(attributes[tooltipType]) + '</div> ')(scope))
                .appendTo('body');
            scope.$apply();

            let top = parseInt(sourceElement.offset().top + sourceElement.outerHeight());
            let left = parseInt(sourceElement.offset().left + sourceElement.width() / 2 - tip.width() / 2);
            if (top < 5) {
                top = 5;
            }
            if (left < 5) {
                left = 5;
            }
            tip.offset({
                top: top,
                left: left
            });
            if (tooltipDisplayCondition(element)) {
                tip.fadeIn();
                element.one('mouseout', function () {
                    tip.fadeOut(200, function () {
                        $(this).remove();
                    })
                });
            }
        }

        if (tooltipDisplayCondition(element)) {
            tip.fadeIn();
            targetElement.one('mouseleave', function () {
                tip.fadeOut(200, function () {
                    $(this).remove();
                })
            });
        }
    });

    scope.$on("$destroy", function () {
        if (tip) {
            tip.remove();
        }

        targetElement.off();
    });

}


export const tooltip = ng.directive('tooltip', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            tooltipLink($compile, scope, element, attributes, () => true, "tooltip", element);
        }
    }
}]);
export const tooltipOnEllipsis = ng.directive('tooltipOnEllipsis', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            tooltipLink($compile, scope, element, attributes, element => (element.parent('a').get(0)
            .offsetWidth < element.parent('a').get(0).scrollWidth), "tooltipOnEllipsis", element.parent('a'));
        }
    }
}]);
