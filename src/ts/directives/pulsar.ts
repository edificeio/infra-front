import { ng } from '../ng-start';
import { $ } from '../libs/jquery/jquery';
import { model } from '../modelDefinitions';
import { ui } from '../ui';
import { idiom } from '../idiom';
import { http } from '../http';
import { quickstart } from '../quickstart';
import { _ } from '../libs/underscore/underscore';

export let pulsar = ng.directive('pulsar', ['$compile', function($compile){
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attributes){

            if($(window).width() <= ui.breakpoints.tablette || !model.me.hasWorkflow('org.entcore.portal.controllers.PortalController|quickstart')){
                return;
            }
            //if wokflow console false quit quickstart

            let pulsarInfos = scope.$eval(attributes.pulsar);
            //contenu des attrs

            if(!model.me.hasWorkflow(pulsarInfos.workflow)){
                element.removeAttr('pulsar') // ne remonte pas dans liste steps
                return;
            }

            if(pulsarInfos.workflow && !model.me.hasWorkflow(pulsarInfos.workflow)){
                element.data('skip-pulsar', 'true');// ne remonte pas dans liste steps
                //vire les pulsars qui ont pas les droits (pb si dernier & premier !!)
                return;
            }

            scope.pulsarInfos = pulsarInfos;
            scope.pulsarInfos.steps = [];

            let pulsars = $('[pulsar]');
            pulsars.each(function(index, element){
                let infos = angular.element(element).scope().$eval($(element).attr('pulsar'));
                infos.el = element;
                scope.pulsarInfos.steps.push(infos);
            });



            if(typeof pulsarInfos !== 'object' || pulsarInfos.index === undefined){
                console.error('Invalid pulsar object. Should look like pulsar="{ index: 0, i18n: \'my.key\', position: \'top bottom\'}"')
            }

            let pulsarButton;
            let pulsarElement;
            // content box

            let pulsarSize = 40;
            let pulsarMarge = 5;
            let pulsarLayerMarge = 10;


            let paintPulsar = function(){
                if(!pulsarInfos.position){
                    pulsarInfos.position = 'center center';
                }
                let xPosition = 'center';
                if(pulsarInfos.position.indexOf('left') !== -1){
                    xPosition = 'left';
                }
                if(pulsarInfos.position.indexOf('right') !== -1){
                    xPosition = 'right';
                }

                let yPosition = 'center';
                if(pulsarInfos.position.indexOf('top') !== -1){
                    yPosition = 'top';
                }
                if(pulsarInfos.position.indexOf('bottom') !== -1){
                    yPosition = 'bottom';
                }

                pulsarButton = $('<div class="pulsar-button"><div class="pulse"></div><div class="pulse2"></div><div class="pulse-spot"></div></div>')
                    .appendTo('body');
                if(pulsarInfos.className){
                    pulsarInfos.className.split(' ').forEach(function(cls){
                        pulsarButton.addClass(cls);
                    });
                }

                pulsarButton.data('active', true);

                let firstCycle = true;
                let placePulsar = function(){
                    let deltaX = 0;
                    let deltaY = 0;

                    if(pulsarInfos.delta){
                        pulsarInfos.delta = idiom.translate(pulsarInfos.delta)

                        deltaX = parseInt(pulsarInfos.delta.split(' ')[0]);
                        deltaY = parseInt(pulsarInfos.delta.split(' ')[1]);
                    }


                    let xPositions = {
                        left: element.offset().left - (pulsarSize + pulsarMarge),
                        right: element.offset().left + element.width() + pulsarMarge,
                        center: element.offset().left + (element.width() / 2) - pulsarSize / 2
                    };

                    let yPositions = {
                        top: element.offset().top,
                        bottom: element.offset().top + element.height() + pulsarMarge,
                        center: element.offset().top + (element.height() / 2) - pulsarSize / 2
                    };

                    if(pulsarInfos.position === 'top center'){
                        yPositions.top = element.offset().top - pulsarSize - pulsarMarge;
                    }


                    if(pulsarButton.css('display') !== 'none'){
                        pulsarButton.offset({ left: parseInt(xPositions[xPosition] + deltaX), top: parseInt(yPositions[yPosition] + deltaY) });
                    }

                    if(pulsarElement && pulsarElement.find('.arrow').length){

                        let left = xPositions[xPosition] - pulsarElement.children('.content').width() - pulsarSize / 2
                        let top = yPositions[yPosition] - pulsarLayerMarge ;

                    // place pulsarElement // element

                        if(yPosition === 'top' && xPosition === 'center'){
                            top = yPositions[yPosition] - pulsarElement.children('.content').height() - pulsarSize / 2;
                        }
                        if(yPosition === 'center'){
                            top = yPositions[yPosition] - (pulsarElement.children('.content').height() / 2);

                            //top = yPositions[yPosition] - (pulsarElement.children('.content').width() / 2) + pulsarLayerMarge + pulsarMarge * 2;
                        }
                        if(xPosition === 'center'){
                            left = (xPositions[xPosition] - (pulsarElement.children('.content').width() / 2)) -2;
                        }
                        if(yPosition === 'center' && xPosition === 'center'){
                            pulsarElement.addClass('middle');
                            yPosition = 'bottom';
                        }
                        if(xPosition === 'right'){
                            left = xPositions[xPosition] + pulsarLayerMarge + pulsarMarge * 2;
                        }
                        if(yPosition === 'bottom'){
                            if(xPosition === 'center'){
                                top = yPositions[yPosition] + pulsarLayerMarge + pulsarMarge * 2;
                            }else{
                                top = yPositions[yPosition] - (pulsarLayerMarge + pulsarMarge);
                            }
                        }


                    // If pulsarElement position is cropped by browser:

                        var pulsarElementMarge = 15;

                        var oldTop = top;
                        var oldLeft = left

                        var maxX = oldLeft + (pulsarElement.width()) + pulsarElementMarge;
                        var maxY = oldTop + (pulsarElement.height()) + pulsarElementMarge

                        var newLeft = $(window).width() - (pulsarElement.width() + pulsarElementMarge);
                        var newBottom = $(window).height() - (pulsarElement.height() + pulsarElementMarge);

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
                        if(maxX > $(window).width()){

                            left = $(window).width() - (pulsarElement.width() + pulsarElementMarge);
                            if(xPosition === 'center'){
                                if(firstCycle){
                                    arrow.css({left : arrowXpos + gapLeft, right : 'auto'});
                                    firstCycle = false;
                                 }
                            }
                        }
                        //left
                        if(left <= pulsarElementMarge){

                            left = pulsarElementMarge;
                            if(xPosition === 'center'){
                                if(firstCycle){
                                    arrow.css({left : gapRight + pulsarLayerMarge, right : 'auto'});
                                    firstCycle = false;
                                 }
                            }
                        }

                        //// Y CORRECT

                        //bottom
                        if(maxY > $(window).height()){
                            top = newBottom;
                            if(yPosition === 'bottom'){
                                if(firstCycle){
                                    arrow.css({top : gapBottom + pulsarMarge, bottom : 'auto'});
                                    firstCycle = false;
                                 }
                            }
                        }
                        //top --ok
                        if(top < pulsarElementMarge){
                            top = pulsarElementMarge;

                            if(yPosition === 'center' && xPosition !== 'center'){
                                if(firstCycle){
                                    arrow.css({top : (arrowYpos - gapTop), bottom : 'auto'});
                                    firstCycle = false;

                                 }
                            }
                        }

                        // apply content box position
                        pulsarElement.offset({
                            left: parseInt(left + deltaX),
                            top: parseInt(top + deltaY)
                        });
                    }
                    setTimeout(placePulsar, 100);
                }
                placePulsar();


                var placeLayers = function(){
                    $('.pulsar-layer').remove();

                    var check = '[pulsar-highlight=' + pulsarInfos.index +']';
                    var highlight = $( "body" ).find(check);
                    if(highlight.length !== 0){
                        var pulsarHighlight = highlight;
                    }

                    if(!pulsarHighlight){
                        var pulsarHighlight = element;
                    }

                     $('<div class="pulsar-layer"></div>')

                        .width(pulsarHighlight.width() + pulsarLayerMarge * 2)
                        .height(pulsarHighlight.height() + pulsarLayerMarge *  2)
                        .offset({ top: pulsarHighlight.offset().top - pulsarLayerMarge, left: pulsarHighlight.offset().left - pulsarLayerMarge, })
                        .hide()
                        .appendTo('body')
                        .fadeIn("slow");
                };

                pulsarButton.on('click', function(){
                    $('body').css('pointer-events', 'none');
                    $('body').on('scroll touchmove mousewheel', function(e){
                      e.preventDefault();
                      e.stopPropagation();
                      return false;
                    })

                    scope.pulsarInfos.steps = [];
                    pulsars = $('[pulsar]');
                    //recup tt les pulsar

                    pulsars.each(function(index, element){
                        //on recup les infos de chaque pulsar
                        let infos = angular.element(element).scope().$eval($(element).attr('pulsar'));
                        infos.el = element;
                        scope.pulsarInfos.steps.push(infos);
                    });

                    // create content box
                    pulsarElement = $('<pulsar></pulsar>')
                        .addClass(xPosition)
                        .addClass(yPosition);
                    if(pulsarInfos.className){
                        pulsarInfos.className.split(' ').forEach(function(cls){
                            pulsarElement.addClass(cls);
                        });
                    }
                    pulsarButton.hide();
                    placeLayers();
                    $(window).on('resize.placeLayers', placeLayers);
                    //scroll voir hauteur document ou bloquer scroll
                    // ok pour xp on layers

                    http().get('/infra/public/template/pulsar.html').done(function(html){
                        pulsarElement.html(
                            $compile(html)(scope)
                        );
                    });
                    $('body').append(pulsarElement);
                });
            }

            $(window).on('resize', function(){
                if(!pulsarButton){
                    return;
                }
                if($(window).width() <= ui.breakpoints.tablette){
                    pulsarButton.hide();
                }
                else if(pulsarButton.data('active')){
                    pulsarButton.show();
                }
            })

            function undraw(){
                // chaque nextStep + end
                pulsarElement.find('button').css('pointer-events', 'none');
                $(window).off('resize.placeLayers');
                pulsarButton.fadeOut('slow', function(){ pulsarButton.remove() });
                pulsarElement.fadeOut('slow', function(){ pulsarElement.remove() });
                $('.pulsar-layer').remove();
                $('body').off('scroll touchmove mousewheel');
                $('body').css('pointer-events', '');
                let firstCycle = true;
                pulsarButton.data('active', false);
            }

            scope.closePulsar = function(){
                if(!pulsarElement || !pulsarButton){
                    return
                }
                pulsarElement.fadeOut(0 , function(){ pulsarElement.remove() });
                pulsarButton.removeClass('hidden');
                $('.pulsar-layer').fadeOut(0 , function(){ $('.pulsar-layer').remove() });
                $('body').off('scroll touchmove mousewheel');
                $('body').css('pointer-events', '');
                let firstCycle = true;
                pulsarButton.data('active', false);

            };
            $(document).on('click', function(e){
                if(
                    $(e.target).parents('pulsar').length > 0 ||
                    $(e.target).parents('.pulsar-button').length > 0 ||
                    $(e.target).hasClass('pulsar-button')
                ){
                    return;
                }
                scope.closePulsar();
            });

            scope.paintPulsar = function(){
                paintPulsar();
                pulsarButton.trigger('click');
            };

            scope.isLastStep = function(){
                return _.find(scope.pulsarInfos.steps, function(step){
                    return step.index > scope.pulsarInfos.index;
                }) === undefined;
            };

            scope.goTo = function(step){
                undraw();
                quickstart.goToAppStep(step.index);
                angular.element(step.el).scope().paintPulsar();

            };

            scope.next = function(){

                undraw();
                let index = quickstart.nextAppStep();
                if(_.findWhere(scope.pulsarInfos.steps, { index: index}) === undefined){
                    if(_.find(scope.pulsarInfos.steps, function(item){ return item.index > index}) !== undefined){
                        scope.next();
                    }
                    return;
                }
                for(let i = 0; i < scope.pulsarInfos.steps.length; i++){
                    let item = scope.pulsarInfos.steps[i];
                    if(item.index === index){
                        if($(item.el).data('skip-pulsar')){
                            scope.next();
                            return;
                        }
                        angular.element(item.el).scope().paintPulsar();
                    }
                }
            };

            scope.previous = function(){
                undraw();
                let index = quickstart.previousAppStep();
                if(_.findWhere(scope.pulsarInfos.steps, { index: index}) === undefined){
                    if(_.find(scope.pulsarInfos.steps, function(item){ return item.index < index}) !== undefined){
                        scope.previous();
                    }
                    return;
                }
                for(let i = 0; i < scope.pulsarInfos.steps.length; i++){
                    let item = scope.pulsarInfos.steps[i];
                    if(item.index === index){
                        if($(item.el).data('skip-pulsar')){
                            scope.previous();
                            return;
                        }
                        angular.element(item.el).scope().paintPulsar();
                    }
                }
            };

            quickstart.load(function(){
                if(quickstart.appIndex() !== pulsarInfos.index){
                    return;
                }

                paintPulsar();
            });
        }
    }
}]);