"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ng_start_1 = require("../ng-start");
var jquery_1 = require("../libs/jquery/jquery");
var modelDefinitions_1 = require("../modelDefinitions");
var ui_1 = require("../ui");
var idiom_1 = require("../idiom");
var http_1 = require("../http");
var quickstart_1 = require("../quickstart");
var underscore_1 = require("../libs/underscore/underscore");
exports.pulsar = ng_start_1.ng.directive('pulsar', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attributes) {
                if (jquery_1.$(window).width() <= ui_1.ui.breakpoints.tablette || !modelDefinitions_1.model.me.hasWorkflow('org.entcore.portal.controllers.PortalController|quickstart')) {
                    return;
                }
                //if wokflow console false quit quickstart
                var pulsarInfos = scope.$eval(attributes.pulsar);
                //contenu des attrs
                if (!modelDefinitions_1.model.me.hasWorkflow(pulsarInfos.workflow)) {
                    element.removeAttr('pulsar'); // ne remonte pas dans liste steps
                    return;
                }
                if (pulsarInfos.workflow && !modelDefinitions_1.model.me.hasWorkflow(pulsarInfos.workflow)) {
                    element.data('skip-pulsar', 'true'); // ne remonte pas dans liste steps
                    //vire les pulsars qui ont pas les droits (pb si dernier & premier !!)
                    return;
                }
                scope.pulsarInfos = pulsarInfos;
                scope.pulsarInfos.steps = [];
                var pulsars = jquery_1.$('[pulsar]');
                pulsars.each(function (index, element) {
                    var infos = angular.element(element).scope().$eval(jquery_1.$(element).attr('pulsar'));
                    infos.el = element;
                    scope.pulsarInfos.steps.push(infos);
                });
                if (typeof pulsarInfos !== 'object' || pulsarInfos.index === undefined) {
                    console.error('Invalid pulsar object. Should look like pulsar="{ index: 0, i18n: \'my.key\', position: \'top bottom\'}"');
                }
                var pulsarButton;
                var pulsarElement;
                // content box
                var pulsarSize = 40;
                var pulsarMarge = 5;
                var pulsarLayerMarge = 10;
                var paintPulsar = function () {
                    if (!pulsarInfos.position) {
                        pulsarInfos.position = 'center center';
                    }
                    var xPosition = 'center';
                    if (pulsarInfos.position.indexOf('left') !== -1) {
                        xPosition = 'left';
                    }
                    if (pulsarInfos.position.indexOf('right') !== -1) {
                        xPosition = 'right';
                    }
                    var yPosition = 'center';
                    if (pulsarInfos.position.indexOf('top') !== -1) {
                        yPosition = 'top';
                    }
                    if (pulsarInfos.position.indexOf('bottom') !== -1) {
                        yPosition = 'bottom';
                    }
                    pulsarButton = jquery_1.$('<div class="pulsar-button"><div class="pulse"></div><div class="pulse2"></div><div class="pulse-spot"></div></div>')
                        .appendTo('body');
                    if (pulsarInfos.className) {
                        pulsarInfos.className.split(' ').forEach(function (cls) {
                            pulsarButton.addClass(cls);
                        });
                    }
                    pulsarButton.data('active', true);
                    var firstCycle = true;
                    var placePulsar = function () {
                        var deltaX = 0;
                        var deltaY = 0;
                        if (pulsarInfos.delta) {
                            pulsarInfos.delta = idiom_1.idiom.translate(pulsarInfos.delta);
                            deltaX = parseInt(pulsarInfos.delta.split(' ')[0]);
                            deltaY = parseInt(pulsarInfos.delta.split(' ')[1]);
                        }
                        var xPositions = {
                            left: element.offset().left - (pulsarSize + pulsarMarge),
                            right: element.offset().left + element.width() + pulsarMarge,
                            center: element.offset().left + (element.width() / 2) - pulsarSize / 2
                        };
                        var yPositions = {
                            top: element.offset().top,
                            bottom: element.offset().top + element.height() + pulsarMarge,
                            center: element.offset().top + (element.height() / 2) - pulsarSize / 2
                        };
                        if (pulsarInfos.position === 'top center') {
                            yPositions.top = element.offset().top - pulsarSize - pulsarMarge;
                        }
                        if (pulsarButton.css('display') !== 'none') {
                            pulsarButton.offset({ left: parseInt(xPositions[xPosition] + deltaX), top: parseInt(yPositions[yPosition] + deltaY) });
                        }
                        if (pulsarElement && pulsarElement.find('.arrow').length) {
                            var left = xPositions[xPosition] - pulsarElement.children('.content').width() - pulsarSize / 2;
                            var top_1 = yPositions[yPosition] - pulsarLayerMarge;
                            // place pulsarElement // element
                            if (yPosition === 'top' && xPosition === 'center') {
                                top_1 = yPositions[yPosition] - pulsarElement.children('.content').height() - pulsarSize / 2;
                            }
                            if (yPosition === 'center') {
                                top_1 = yPositions[yPosition] - (pulsarElement.children('.content').height() / 2);
                                //top = yPositions[yPosition] - (pulsarElement.children('.content').width() / 2) + pulsarLayerMarge + pulsarMarge * 2;
                            }
                            if (xPosition === 'center') {
                                left = (xPositions[xPosition] - (pulsarElement.children('.content').width() / 2)) - 2;
                            }
                            if (yPosition === 'center' && xPosition === 'center') {
                                pulsarElement.addClass('middle');
                                yPosition = 'bottom';
                            }
                            if (xPosition === 'right') {
                                left = xPositions[xPosition] + pulsarLayerMarge + pulsarMarge * 2;
                            }
                            if (yPosition === 'bottom') {
                                if (xPosition === 'center') {
                                    top_1 = yPositions[yPosition] + pulsarLayerMarge + pulsarMarge * 2;
                                }
                                else {
                                    top_1 = yPositions[yPosition] - (pulsarLayerMarge + pulsarMarge);
                                }
                            }
                            // If pulsarElement position is cropped by browser:
                            var pulsarElementMarge = 15;
                            var oldTop = top_1;
                            var oldLeft = left;
                            var maxX = oldLeft + (pulsarElement.width()) + pulsarElementMarge;
                            var maxY = oldTop + (pulsarElement.height()) + pulsarElementMarge;
                            var newLeft = jquery_1.$(window).width() - (pulsarElement.width() + pulsarElementMarge);
                            var newBottom = jquery_1.$(window).height() - (pulsarElement.height() + pulsarElementMarge);
                            var gapLeft = oldLeft - newLeft;
                            var gapRight = pulsarElementMarge - (oldLeft);
                            var gapBottom = oldTop - newBottom;
                            var gapTop = pulsarElementMarge - (oldTop);
                            var arrow = pulsarElement.find('.arrow');
                            var arrowXpos = arrow.position().left;
                            var arrowYpos = arrow.position().top;
                            //console.log('init posY ' + arrowYpos);
                            //// X CORRECT
                            //right
                            if (maxX > jquery_1.$(window).width()) {
                                left = jquery_1.$(window).width() - (pulsarElement.width() + pulsarElementMarge);
                                if (xPosition === 'center') {
                                    if (firstCycle) {
                                        arrow.css({ left: arrowXpos + gapLeft, right: 'auto' });
                                        firstCycle = false;
                                    }
                                }
                            }
                            //left
                            if (left <= pulsarElementMarge) {
                                left = pulsarElementMarge;
                                if (xPosition === 'center') {
                                    if (firstCycle) {
                                        arrow.css({ left: gapRight + pulsarLayerMarge, right: 'auto' });
                                        firstCycle = false;
                                    }
                                }
                            }
                            //// Y CORRECT
                            //bottom
                            if (maxY > jquery_1.$(window).height()) {
                                top_1 = newBottom;
                                if (yPosition === 'bottom') {
                                    if (firstCycle) {
                                        arrow.css({ top: gapBottom + pulsarMarge, bottom: 'auto' });
                                        firstCycle = false;
                                    }
                                }
                            }
                            //top --ok
                            if (top_1 < pulsarElementMarge) {
                                top_1 = pulsarElementMarge;
                                if (yPosition === 'center' && xPosition !== 'center') {
                                    if (firstCycle) {
                                        arrow.css({ top: (arrowYpos - gapTop), bottom: 'auto' });
                                        firstCycle = false;
                                    }
                                }
                            }
                            // apply content box position
                            pulsarElement.offset({
                                left: parseInt(left + deltaX),
                                top: parseInt(top_1 + deltaY)
                            });
                        }
                        setTimeout(placePulsar, 100);
                    };
                    placePulsar();
                    var placeLayers = function () {
                        jquery_1.$('.pulsar-layer').remove();
                        var check = '[pulsar-highlight=' + pulsarInfos.index + ']';
                        var highlight = jquery_1.$("body").find(check);
                        if (highlight.length !== 0) {
                            var pulsarHighlight = highlight;
                        }
                        if (!pulsarHighlight) {
                            var pulsarHighlight = element;
                        }
                        jquery_1.$('<div class="pulsar-layer"></div>')
                            .width(pulsarHighlight.width() + pulsarLayerMarge * 2)
                            .height(pulsarHighlight.height() + pulsarLayerMarge * 2)
                            .offset({ top: pulsarHighlight.offset().top - pulsarLayerMarge, left: pulsarHighlight.offset().left - pulsarLayerMarge, })
                            .hide()
                            .appendTo('body')
                            .fadeIn("slow");
                    };
                    pulsarButton.on('click', function () {
                        jquery_1.$('body').css('pointer-events', 'none');
                        jquery_1.$('body').on('scroll touchmove mousewheel', function (e) {
                            e.preventDefault();
                            e.stopPropagation();
                            return false;
                        });
                        scope.pulsarInfos.steps = [];
                        pulsars = jquery_1.$('[pulsar]');
                        //recup tt les pulsar
                        pulsars.each(function (index, element) {
                            //on recup les infos de chaque pulsar
                            var infos = angular.element(element).scope().$eval(jquery_1.$(element).attr('pulsar'));
                            infos.el = element;
                            scope.pulsarInfos.steps.push(infos);
                        });
                        // create content box
                        pulsarElement = jquery_1.$('<pulsar></pulsar>')
                            .addClass(xPosition)
                            .addClass(yPosition);
                        if (pulsarInfos.className) {
                            pulsarInfos.className.split(' ').forEach(function (cls) {
                                pulsarElement.addClass(cls);
                            });
                        }
                        pulsarButton.hide();
                        placeLayers();
                        jquery_1.$(window).on('resize.placeLayers', placeLayers);
                        //scroll voir hauteur document ou bloquer scroll
                        // ok pour xp on layers
                        http_1.http().get('/infra/public/template/pulsar.html').done(function (html) {
                            pulsarElement.html($compile(html)(scope));
                        });
                        jquery_1.$('body').append(pulsarElement);
                    });
                };
                jquery_1.$(window).on('resize', function () {
                    if (!pulsarButton) {
                        return;
                    }
                    if (jquery_1.$(window).width() <= ui_1.ui.breakpoints.tablette) {
                        pulsarButton.hide();
                    }
                    else if (pulsarButton.data('active')) {
                        pulsarButton.show();
                    }
                });
                function undraw() {
                    // chaque nextStep + end
                    pulsarElement.find('button').css('pointer-events', 'none');
                    jquery_1.$(window).off('resize.placeLayers');
                    pulsarButton.fadeOut('slow', function () { pulsarButton.remove(); });
                    pulsarElement.fadeOut('slow', function () { pulsarElement.remove(); });
                    jquery_1.$('.pulsar-layer').remove();
                    jquery_1.$('body').off('scroll touchmove mousewheel');
                    jquery_1.$('body').css('pointer-events', '');
                    var firstCycle = true;
                    pulsarButton.data('active', false);
                }
                scope.closePulsar = function () {
                    if (!pulsarElement || !pulsarButton) {
                        return;
                    }
                    pulsarElement.fadeOut(0, function () { pulsarElement.remove(); });
                    pulsarButton.removeClass('hidden');
                    jquery_1.$('.pulsar-layer').fadeOut(0, function () { jquery_1.$('.pulsar-layer').remove(); });
                    jquery_1.$('body').off('scroll touchmove mousewheel');
                    jquery_1.$('body').css('pointer-events', '');
                    var firstCycle = true;
                    pulsarButton.data('active', false);
                };
                jquery_1.$(document).on('click', function (e) {
                    if (jquery_1.$(e.target).parents('pulsar').length > 0 ||
                        jquery_1.$(e.target).parents('.pulsar-button').length > 0 ||
                        jquery_1.$(e.target).hasClass('pulsar-button')) {
                        return;
                    }
                    scope.closePulsar();
                });
                scope.paintPulsar = function () {
                    paintPulsar();
                    pulsarButton.trigger('click');
                };
                scope.isLastStep = function () {
                    return underscore_1._.find(scope.pulsarInfos.steps, function (step) {
                        return step.index > scope.pulsarInfos.index;
                    }) === undefined;
                };
                scope.goTo = function (step) {
                    undraw();
                    quickstart_1.quickstart.goToAppStep(step.index);
                    angular.element(step.el).scope().paintPulsar();
                };
                scope.next = function () {
                    undraw();
                    var index = quickstart_1.quickstart.nextAppStep();
                    if (underscore_1._.findWhere(scope.pulsarInfos.steps, { index: index }) === undefined) {
                        if (underscore_1._.find(scope.pulsarInfos.steps, function (item) { return item.index > index; }) !== undefined) {
                            scope.next();
                        }
                        return;
                    }
                    for (var i = 0; i < scope.pulsarInfos.steps.length; i++) {
                        var item = scope.pulsarInfos.steps[i];
                        if (item.index === index) {
                            if (jquery_1.$(item.el).data('skip-pulsar')) {
                                scope.next();
                                return;
                            }
                            angular.element(item.el).scope().paintPulsar();
                        }
                    }
                };
                scope.previous = function () {
                    undraw();
                    var index = quickstart_1.quickstart.previousAppStep();
                    if (underscore_1._.findWhere(scope.pulsarInfos.steps, { index: index }) === undefined) {
                        if (underscore_1._.find(scope.pulsarInfos.steps, function (item) { return item.index < index; }) !== undefined) {
                            scope.previous();
                        }
                        return;
                    }
                    for (var i = 0; i < scope.pulsarInfos.steps.length; i++) {
                        var item = scope.pulsarInfos.steps[i];
                        if (item.index === index) {
                            if (jquery_1.$(item.el).data('skip-pulsar')) {
                                scope.previous();
                                return;
                            }
                            angular.element(item.el).scope().paintPulsar();
                        }
                    }
                };
                quickstart_1.quickstart.load(function () {
                    if (quickstart_1.quickstart.appIndex() !== pulsarInfos.index) {
                        return;
                    }
                    paintPulsar();
                });
            }
        };
    }]);
//# sourceMappingURL=pulsar.js.map