import { ng } from '../ng-start';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';
import { template } from '../template';
import { ui } from '../ui';
import { Subject, Subscription } from 'rxjs';

type TooltipCondition = (cond: JQuery) => boolean;
type TooltipScope = { $watch: any, $eval: any, $on: any };
type TooltipAttributes = { tooltipTemplate: string, tooltipTargetSelector: string, tooltipRestrictSelector: string, tooltipCheck: string };
abstract class AbstractToolTip {
    protected tip: JQuery;
    protected restrictToElement: JQuery;
    protected targetElement: JQuery;
    protected onChange = new Subject<'show' | 'hide'>();
    protected isBinded = false;
    protected tooltipCheck = false;
    protected subscription = new Subscription;
    protected observer: MutationObserver;
    static create(args: {
        $compile: any,
        scope: TooltipScope,
        element: JQuery,
        attributes: TooltipAttributes,
        tooltipDisplayCondition: TooltipCondition,
        tooltipType: string,
        sourceElement: JQuery
    }): AbstractToolTip {
        const { $compile, attributes, element, scope, sourceElement, tooltipDisplayCondition, tooltipType } = args;
        if (attributes.tooltipTemplate) {
            return new CustomToolTip($compile, scope, element, attributes, tooltipDisplayCondition, tooltipType, sourceElement);
        }
        else {
            return new DefaultToolTip($compile, scope, element, attributes, tooltipDisplayCondition, tooltipType, sourceElement);
        }
    }
    constructor(protected $compile: any,
        protected scope: TooltipScope,
        protected element: JQuery,
        protected attributes: TooltipAttributes,
        protected tooltipDisplayCondition: TooltipCondition,
        protected tooltipType: string,
        protected sourceElement: JQuery) {
        this.targetElement = element;
        if (attributes.tooltipTargetSelector) {
            this.targetElement = element.find(attributes.tooltipTargetSelector);
        }
        if (attributes.tooltipRestrictSelector && this.targetElement) {
            this.restrictToElement = this.targetElement.parents(attributes.tooltipRestrictSelector);
            if (this.restrictToElement.length !== 1) {
                this.restrictToElement = undefined;
            }
        }
        this.tooltipCheck = true;
        //you can add a condition to display the tooltip
        if (element[0].hasAttribute('tooltip-check')) {
            this.scope.$watch(() => scope.$eval(attributes.tooltipCheck), (newVal) =>
                this.tooltipCheck = !!newVal
            );
        }
        // Handle multiline
        if (element[0].hasAttribute('tooltip-check-content')) {
            scope.$watch(() => { return element[0].offsetHeight }, () => {
                this.tooltipCheck = element[0].offsetHeight < element[0].scrollHeight;
            });
        }
        //bind
        this.bind();
        //destroy
        this.scope.$on("$destroy", this.destroy);
        //console.debug('[Tooltip.init] init finished. Ready? ', this.isReady(), this)
    }
    destroy = () => {
        //console.debug('[Tooltip.destroy] destroying component....')
        this.unbind();
        this.doRemove();
    }
    protected isReady() {
        if (!this.targetElement) return false;
        return true;
    }
    protected abstract createTip(): void;
    protected abstract moveTip(): void;
    protected doShow() {
        //console.debug('[Tooltip.doShow] try to show tooltip....')
        if (this.tooltipDisplayCondition(this.element)) {
            if (!this.tip) this.createTip();
            this.moveTip();
            this.tip.fadeIn();
        }
    }
    protected doRemove() {
        if (!this.tip) return;
        //console.debug('[Tooltip.doRemove] removing tooltip....')
        this.tip.fadeOut(200, () => {
            this.tip.remove();
            this.tip = undefined;
        })
    }
    protected tryMoveTip = () => {
        if (!this.isReady()) return;
        //console.debug('[Tooltip.tryMoveTip] moving tooltip....')
        this.moveTip();
    }
    bind(): void {
        if (this.isBinded) return;
        if (!this.isReady()) return;
        //console.debug('[Tooltip.bind] init binding....')
        this.subscription.add(this.onChange.debounceTime(400).subscribe(s => {
            if (s == 'hide') {
                this.doRemove();
            } else {
                this.doShow();
            }
        }))
        this.targetElement.on('mouseenter', this.show);
        this.targetElement.on('mouseout', this.hide);
        this.targetElement.on('mouseleave', this.hide);
        $(window).on('scroll', this.tryMoveTip);
        //listen disabled
        try {
            this.observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    // Check the modified attributeName is "disabled"
                    if (mutation.attributeName === "disabled") {
                        this.hide();
                    }
                });
            });
            // Configure to only listen to attribute changes
            const config = { attributes: true };
            // Start observing myElem
            this.observer.observe(this.targetElement[0], config);
        } catch (e) {
            console.warn("[Tooltip] Could not listen attributes:", e)
        }

        this.isBinded = true;
    }
    unbind(): void {
        //console.debug('[Tooltip.unbind] unbinding....')
        this.subscription.unsubscribe();
        this.targetElement.off('mouseenter', this.show);
        this.targetElement.off('mouseout', this.hide);
        this.targetElement.off('mouseleave', this.hide);
        $(window).off('scroll', this.tryMoveTip);
        try {
            this.observer && this.observer.disconnect();
        } catch (e) {
            console.warn("[Tooltip] Could not stop listen attributes:", e)
        }
        this.isBinded = false;
    }
    show = (e: any) => {
        if (!this.isReady()) return false;
        //console.debug('[Tooltip.show] emit show event....',e)
        this.onChange.next('show');
    }
    hide = (e?: any) => {
        if (!this.isReady()) return false;
        //console.debug('[Tooltip.hide] emit hide event....',e)
        this.onChange.next('hide');
    }
}

class CustomToolTip extends AbstractToolTip {
    protected createTip() {
        let templatePath = template.getPath(this.attributes.tooltipTemplate);
        this.tip = $('<div />')
            .addClass('tooltip')
            .html(this.$compile('<div ng-include=\'\"' + templatePath + '\"\'></div>')(this.scope))
            .appendTo('body');
        this.tip.css('position', 'absolute');
    }
    protected moveTip() {
        if (!this.tip || !this.isReady()) return;
        const targetElement = this.targetElement;
        const tip = this.tip;
        const restrictToElement = this.restrictToElement;
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
        tip.css('left', document.body.clientWidth >= left + tip.outerWidth() ? left : document.body.clientWidth - tip.outerWidth() - 1);
        tip.css('top', top);
    }
}

class DefaultToolTip extends AbstractToolTip {
    protected isReady() {
        if ($(window).width() < ui.breakpoints.tablette || !this.attributes[this.tooltipType] || !this.tooltipCheck || this.attributes[this.tooltipType] === 'undefined') {
            return false;
        }
        return super.isReady();
    }
    protected createTip() {
        this.tip = $('<div />')
            .addClass('tooltip')
            .html(this.$compile('<div class="arrow"></div><div class="content">' + idiom.translate(this.attributes[this.tooltipType]) + '</div> ')(this.scope))
            .appendTo('body');
    }
    protected moveTip() {
        if (!this.tip || !this.isReady()) return;
        let top = parseInt(this.sourceElement.offset().top + this.sourceElement.outerHeight());
        let left = parseInt(this.sourceElement.offset().left + this.sourceElement.width() / 2 - this.tip.width() / 2);
        if (top < 5) {
            top = 5;
        }
        if (left < 5) {
            left = 5;
        }
        this.tip.offset({
            top: top,
            left: document.body.clientWidth >= left + this.tip.outerWidth() ? left : document.body.clientWidth - this.tip.outerWidth() - 1
        });
    }
}

export const tooltip = ng.directive('tooltip', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            AbstractToolTip.create({
                $compile, scope,
                element, attributes,
                tooltipDisplayCondition: () => true,
                tooltipType: "tooltip",
                sourceElement: element,
            });
        }
    }
}]);
export const tooltipOnEllipsis = ng.directive('tooltipOnEllipsis', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            AbstractToolTip.create({
                $compile, scope, element, attributes,
                tooltipDisplayCondition: element => {
                    const a = element.parent('a').get(0);
                    return a.offsetWidth < a.scrollWidth;
                },
                tooltipType: "tooltipOnEllipsis", sourceElement: element.parent('a')
            });
        }
    }
}]);
export const odebtTooltip = ng.directive('odebtTooltip', ['$compile', function ($compile) {
    return {
        restrict: 'A',
        link: function (scope, element, attributes) {
            if (attributes.odebtTooltip) jQuery(element).attr("title", attributes.odebtTooltip);
            (jQuery(element) as any).tooltip();
        }
    }
}]);
