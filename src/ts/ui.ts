// Copyright © WebServices pour l'Éducation, 2014
//
// This file is part of ENT Core. ENT Core is a versatile ENT engine based on the JVM.
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation (version 3 of the License).
//
// For the sake of explanation, any module that communicate over native
// Web protocols, such as HTTP, with ENT Core is outside the scope of this
// license and could be license under its own terms. This is merely considered
// normal use of ENT Core, and does not fall under the heading of "covered work".
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

import { skin } from './skin';
import { devices } from './globals';

var $ = require('jquery');
let cancelDefault = false;

// Ugly hack for sucky Safari behaviour
$('body').on('touchmove', (e) => {
    if(cancelDefault){
        e.preventDefault();
    }
});
$(document).on('touchmove', (e) => {
    if(cancelDefault){
        e.preventDefault();
    }
});

var mainLightbox = {
	show: function(){
		$('.lightbox-backdrop').fadeIn();
		$('.lightbox-window').fadeIn();
		$('.lightbox-window').css({
			'margin-top': 0,
			'position': 'fixed',
			top: 0
		})
		var offset = $('.lightbox-window').offset();
		$('.lightbox-window').css({
			'position': 'absolute',
			'top': offset.top,
			'margin-top': '100px'
		});

		var that = this;
		$('body').on('click', '.lightbox-backdrop', function(){
			that.hide();
		});
	},
	hide: function(){
		$('.lightbox-backdrop').fadeOut();
		$('.lightbox-window').fadeOut();
	}
};

$(document).ready(function(){
	if(!document.createEvent){
		return;
	}
	var evt = document.createEvent("Event");
	evt.initEvent("ui-ready", true, false);
	window.dispatchEvent(evt);

	$('.display-buttons i').on('click', function(){
		$(this).parent().find('i').removeClass('selected');
		$(this).addClass('selected');
	});


	var resizeTextarea = function(){
		$(this).height(1);
		$(this).height(this.scrollHeight - 1);
	};

	$('body').on('keydown', 'textarea.inline-editing', resizeTextarea);
	$('body').on('keyup', 'textarea.inline-editing', resizeTextarea);
	$('body').on('focus', 'textarea.inline-editing', resizeTextarea);

	$('body').on('click', '[data-reload]', function(){
		setTimeout(function(){
			window.location.reload();
		}, 200);
	});

	$('body').on('click', '.lightbox-window .close-lightbox i, .lightbox-window .lightbox-buttons .cancel, .lightbox-window .cancel', function(){
		ui.hideLightbox();
	});

	$('.remove-fout').removeClass('remove-fout');

	$('body').on('click', '.select-file input[type!="file"], .select-file button, .file-selector', function(e){
		var inputFile = $(this).parent().find('input[type=file]');
		if($(this).attr('for')){
			inputFile = $('#' + $(this).attr('for'));
		}

		if(inputFile.length === 0){
			inputFile = $('input[type=file]');
		}
		if($(this).attr('type') === 'text'){
			if(!$(this).data('changed')){
				inputFile.click();
				inputFile.trigger('touchstart');
			}
		}
		else{
			inputFile.click();
			inputFile.trigger('touchstart');
		}
		$('[data-display-file]').data('changed', true);

		inputFile.on('prettyinput.change', function(){
			var displayElement = inputFile.parent().parent().find('[data-display-file]');
			var fileUrl = $(this).val();
			if(fileUrl.indexOf('fakepath') !== -1){
				fileUrl = fileUrl.split('fakepath')[1];
				fileUrl = fileUrl.substr(1);
				fileUrl = fileUrl.split('.')[0];
			}
			if(displayElement.length > 0 && displayElement[0].tagName === 'INPUT'){
				displayElement.val(fileUrl);
			}
			else{
				displayElement.text(fileUrl);
			}
			$(this).unbind('prettyinput.change');
		});

		e.preventDefault();
	});

	$('.search input[type=text]').on('focus', function(){
		$(this).val(' ');
	})

	$('body').on('click', '.icons-select .current', function(e){
		e.stopPropagation();
		var select = $(this).parent();
		var optionsList = select.children('.options-list');

		if($(this).hasClass('editing')){
			$(this).removeClass('editing');
			optionsList.removeClass('toggle-visible');
			$(document).unbind('click.close');
			e.preventDefault();
			return;
		}

		var that = this;
		$(that).addClass('editing');
		optionsList.addClass('toggle-visible');
		optionsList.find('.option').on('click', function(){
			$(that).removeClass('editing');
			$(that).data('selected', $(this).data('value'));
			$(that).html($(this).html());
			optionsList.removeClass('toggle-visible');
			select.change();
		});

		$(document).on('click.close', function(e){
			$(that).removeClass('editing');
			optionsList.removeClass('toggle-visible');
			$(document).unbind('click.close');
			e.preventDefault();
		})
	});

	//CSS transitions expansions
    var animationTimer;
	$('body').on('click', 'article.preview', function(e){
		if ($(this).hasClass('expanded')) {
		    clearTimeout(animationTimer);
			if(($(this).height() + parseInt($(this).css('padding-top')) + parseInt($(this).css('padding-bottom'))) === this.scrollHeight){
				$(this).css({ transition: 'none', height: 'auto' });
			}
			var setHeight = function () {
				animationTimer = setTimeout(function () {
				    $(this).height(this.scrollHeight);
				    setHeight();
				}.bind(this), 50);
			}.bind(this);
			setHeight();
		}
		else{
			clearTimeout(animationTimer);
			$(this).removeAttr('style');
		}
	});
});



// Remove event in JQuery
(function($){
	$.event.special.removed = {
		remove: function(o) {
			if (o.handler) {
				o.handler()
			}
		}
	}
})(window.jQuery)


var shockwave = function(event, element) {
    var $div = $('<div/>'),
        btnOffset = element.offset(),
        xPos = event.pageX - btnOffset.left,
        yPos = event.pageY - btnOffset.top;

    $div.addClass('shockwave');
    var $ripple = $(".shockwave");

    $ripple.css("height", element.height());
    $ripple.css("width", element.height());

    $div.css({
            top: yPos - ($ripple.height() / 2),
            left: xPos - ($ripple.width() / 2)
        })
        .appendTo(element);

    window.setTimeout(function() {
        $div.remove();
    }, 2000);
}

let touchEvents = {
    longclickElement: function (element, params) {
        //longclick
        element.on('touchstart', function (e) {
            // var anim = setTimeout(function(){
            //     shockwave(e, element);
            // }, 400);

            var timer = setTimeout(function () {
                element.one('touchleave touchend', function () {
                    element.trigger('longclick');
                });
            }, 800);

            element.one('touchleave touchend', function () {
                clearTimeout(timer);
                //$(".shockwave").remove();
            });
        });
    },
    longclickSelector: function (selector, params) {
        //longclick
        $('body').on('touchstart', selector, function (e) {
            var position = {
                left: e.originalEvent.touches[0].clientX - window.pageXOffset,
                top: e.originalEvent.touches[0].clientY - window.pageYOffset
            }
            var timer = setTimeout(function () {
                $(e.target).one('touchleave touchend', function () {
                    $(e.target).trigger('longclick', position);
                });
            }, 800);
            $(e.target).one('touchleave touchend', function () {
                clearTimeout(timer);
            });
        });
    },
    doubletapElement: function (element, params) {
        //doubletap
        element.on('touchstart', function () {
            element.one('touchstart.doubletap', function () {
                element.trigger('doubletap')
            });
            setTimeout(function () {
                element.off('touchstart.doubletap')
            }, 500);
        });
    },
    doubletapSelector: function (selector, params) {
        //doubletap
        $('body').on('touchstart', selector, function (e) {
            $(e.target).one('touchstart.doubletap', function () {
                $(e.target).trigger('doubletap')
            });
            setTimeout(function () {
                $(e.target).off('touchstart.doubletap')
            }, 500);
        });
    },
    swipeElement: function (element, params) {
        //swipes
        element.on('touchstart', function (e) {
            var initialMouse: any = {};
            var mouse = {
                y: e.originalEvent.touches[0].clientY,
                x: e.originalEvent.touches[0].clientX
            };

            initialMouse.x = mouse.x;
            initialMouse.y = mouse.y;

            element.on('touchmove', function (e) {
                mouse = {
                    y: e.originalEvent.touches[0].clientY,
                    x: e.originalEvent.touches[0].clientX
                };
            });
            element.on('touchleave touchend', function (e) {
                if (initialMouse.x + 150 < mouse.x) {
                    element.trigger('swipe-right');
                }
                if (initialMouse.x - 150 > mouse.x) {
                    element.trigger('swipe-left');
                }
                if (initialMouse.y - 150 > mouse.y) {
                    element.trigger('swipe-up');
                }
                if (initialMouse.y - 150 > mouse.y) {
                    element.trigger('swipe-bottom');
                }
                element.off('touchleave touchend touchmove');
            });
        });
    },
    swipeSelector: function (selector, params) {
        //swipes
        $('body').on('touchstart', selector, function (e) {
            var initialMouse;
            var mouse: any = {
                y: e.originalEvent.touches[0].clientY,
                x: e.originalEvent.touches[0].clientX
            };
            $(e.target).on('touchmove', function (e) {
                mouse = {
                    y: e.originalEvent.touches[0].clientY,
                    x: e.originalEvent.touches[0].clientX
                };
            });
            $(e.target).on('touchleave touchend', function (e) {
                if (initialMouse.x + 150 < mouse.x) {
                    $(e.target).trigger('swipe-right');
                }
                if (initialMouse.x - 150 > mouse.x) {
                    $(e.target).trigger('swipe-left');
                }
                if (initialMouse.y - 150 > mouse.y) {
                    $(e.target).trigger('swipe-up');
                }
                if (initialMouse.y - 150 > mouse.y) {
                    $(e.target).trigger('swipe-bottom');
                }
                $(e.target).off('touchleave touchend touchmove');
            });
        });

    }
};

interface ResizeParams{
    lock?: {
        right?: boolean,
        left?: boolean,
        top?: boolean,
        bottom?: boolean,
        horizontal?: boolean,
        vertical?: boolean
    },
    preserveRatio?: boolean,
    moveWithResize?: boolean,
    mouseUp?: (e: any) => void,
    extendParent?: {
        right?: boolean,
        bottom?: boolean
    }
}

export let ui = {
    extendElement: {
        touchEvents: function (element, params?) {
            if (!params) {
                params = {};
            }
            //include existe
            if (params.include) {
                //pour chaque event dans include,
                params.include.forEach(function (event) {
                    //si exclude est défini et contient l'event, on annule
                    if (params.exclude && params.exclude.indexOf(event) !== -1) {
                        return;
                    }
                    //sinon on garde et applique le resultat
                    touchEvents[event + 'Element'](element, params);
                })
            }
            else {
                //include n'est pas défini
                // on regarde chaque event
                for (var property in touchEvents) {
                    if (
                        //la propriété contient bien bien le mot element (on a bien un sélecteur)
                        property.indexOf('Element') !== -1 &&
                        (
                            //exclude n'est pas défini, ou l'event n'est pas listé dans exclude
                            !params.exclude
                            ||
                            params.exclude.indexOf(property.split('Element')[0]) === -1
                        )
                    ) {
                        //on applique le resultat
                        touchEvents[property](element, params);
                    }
                }
            }
        },
        resizable: function (element, params: ResizeParams) {
            if (!params) {
                params = {};
            }
            if (!params.lock) {
                params.lock = {};
            }

            if (element.length > 1) {
                element.each(function (index, item) {
                    ui.extendElement.resizable($(item), params);
                });
                return;
            }

            //cursor styles to indicate resizing possibilities
            element.on('mouseover', function (e) {
                element.on('mousemove', function (e) {
                    if (element.data('resizing') || element.data('lock')) {
                        return;
                    }
                    var mouse = { x: e.pageX, y: e.pageY };
                    var resizeLimits = {
                        horizontalRight: element.offset().left + element.outerWidth() + 20 > mouse.x && mouse.x > element.offset().left + element.outerWidth() - 20
                        && params.lock.horizontal === undefined && params.lock.right === undefined,

                        horizontalLeft: element.offset().left + 20 > mouse.x && mouse.x > element.offset().left - 20
                        && params.lock.horizontal === undefined && params.lock.left === undefined,

                        verticalTop: element.offset().top + 20 > mouse.y && mouse.y > element.offset().top - 20
                        && params.lock.vertical === undefined && params.lock.top === undefined,

                        verticalBottom: element.offset().top + element.outerHeight() + 20 > mouse.y && mouse.y > element.offset().top + element.outerHeight() - 20
                        && params.lock.vertical === undefined && params.lock.bottom === undefined
                    };

                    if($(e.target).hasClass('corner')){
                        if($(e.target).hasClass('ne')){
                            resizeLimits.verticalTop = true;
                            resizeLimits.horizontalRight = true;
                        }
                        if($(e.target).hasClass('nw')){
                            resizeLimits.verticalTop = true;
                            resizeLimits.horizontalLeft = true;
                        }
                        if($(e.target).hasClass('se')){
                            resizeLimits.verticalBottom = true;
                            resizeLimits.horizontalRight = true;
                        }
                        if($(e.target).hasClass('sw')){
                            resizeLimits.verticalBottom = true;
                            resizeLimits.horizontalLeft = true;
                        }
                    }

                    const orientations = {
                        'ns': resizeLimits.verticalTop || resizeLimits.verticalBottom,
                        'ew': resizeLimits.horizontalLeft || resizeLimits.horizontalRight,
                        'nwse': (resizeLimits.verticalBottom && resizeLimits.horizontalRight) || (resizeLimits.verticalTop && resizeLimits.horizontalLeft),
                        'nesw': (resizeLimits.verticalBottom && resizeLimits.horizontalLeft) || (resizeLimits.verticalTop && resizeLimits.horizontalRight)
                    };

                    const resizeClasses = {
                        'top': resizeLimits.verticalTop,
                        'left': resizeLimits.horizontalLeft,
                        'bottom': resizeLimits.verticalBottom,
                        'right': resizeLimits.horizontalRight,
                        'top-left': resizeLimits.verticalTop && resizeLimits.horizontalLeft,
                        'bottom-left': resizeLimits.verticalBottom && resizeLimits.horizontalLeft,
                        'bottom-right': resizeLimits.verticalBottom && resizeLimits.horizontalRight,
                        'top-right': resizeLimits.verticalTop && resizeLimits.horizontalRight
                    };

                    let cursor = '';
                    for (var orientation in orientations) {
                        if (orientations[orientation]) {
                            cursor = orientation;
                        }
                    }

                    let cssClass = '';
                    for (var cssCls in resizeClasses) {
                        if (resizeClasses[cssCls]) {
                            element.addClass(cssCls);
                        }
                        else{
                            element.removeClass(cssCls);
                        }
                    }

                    if (cursor) {
                        cursor = cursor + '-resize';
                    }
                    element.css({ cursor: cursor });
                    element.find('[contenteditable]').each((index, item) => {
                        if(!$(item).hasClass('image-container')){
                            $(item).css({ cursor: cursor });
                        }
                    });
                });
                element.on('mouseout', function (e) {
                    element.unbind('mousemove');
                    let cssClass = '';
                    if(!element.data('resizing')){
                        element.removeClass('top');
                        element.removeClass('left');
                        element.removeClass('bottom');
                        element.removeClass('right');
                        element.removeClass('top-left');
                        element.removeClass('bottom-left');
                        element.removeClass('bottom-right');
                        element.removeClass('top-right');
                    }
                });
            });

            //actual resize
            element.on('mousedown.resize touchstart.resize', function (e) {
                if(e.target.tagName === 'I' || e.target.tagName === 'BUTTON'){
                    return;
                }
                if (element.data('lock') === true || element.data('resizing') === true) {
                    return;
                }

                const borderWidth:number = parseInt(element.css('border-width'));
                const ratio = element.height() / element.width();
                
                $('body').css({
                    '-webkit-user-select': 'none',
                    '-moz-user-select': 'none',
                    'user-select': 'none'
                });

                var interrupt = false;
                var mouse = {
                    y: e.pageY || e.originalEvent.touches[0].pageY,
                    x: e.pageX || e.originalEvent.touches[0].pageX
                };
                const resizeLimits = {
                    horizontalRight: element.offset().left + element.outerWidth() + 20 > mouse.x && mouse.x > element.offset().left + element.outerWidth() - 20
                    && params.lock.horizontal === undefined && params.lock.right === undefined,

                    horizontalLeft: element.offset().left + 20 > mouse.x && mouse.x > element.offset().left - 20
                    && params.lock.horizontal === undefined && params.lock.left === undefined,

                    verticalTop: element.offset().top + 20 > mouse.y && mouse.y > element.offset().top - 20
                    && params.lock.vertical === undefined && params.lock.top === undefined,

                    verticalBottom: element.offset().top + element.outerHeight() + 20 > mouse.y && mouse.y > element.offset().top + element.outerHeight() - 20
                    && params.lock.vertical === undefined && params.lock.bottom === undefined
                };

                if($(e.target).hasClass('corner')){
                    if($(e.target).hasClass('ne')){
                        resizeLimits.verticalTop = true;
                        resizeLimits.horizontalRight = true;
                    }
                    if($(e.target).hasClass('nw')){
                        resizeLimits.verticalTop = true;
                        resizeLimits.horizontalLeft = true;
                    }
                    if($(e.target).hasClass('se')){
                        resizeLimits.verticalBottom = true;
                        resizeLimits.horizontalRight = true;
                    }
                    if($(e.target).hasClass('sw')){
                        resizeLimits.verticalBottom = true;
                        resizeLimits.horizontalLeft = true;
                    }
                }

                var initial = {
                    pos: element.offset(),
                    size: {
                        width: element.width(),
                        height: element.height()
                    },
                    bodyScroll: $('body').css('overflow')
                };
                var parent = element.parents('.drawing-zone');
                var parentData = {
                    pos: parent.offset(),
                    size: {
                        width: parent.width(),
                        height: parent.height()
                    }
                };

                if (resizeLimits.horizontalLeft || resizeLimits.horizontalRight || resizeLimits.verticalTop || resizeLimits.verticalBottom) {
                    element.trigger('startResize');
                    e.preventDefault();
                    e.stopPropagation();
                    cancelDefault = true;
                    console.log('starting resizing');
                    element.data('resizing', true);
                    $('.main').css({
                        'cursor': element.css('cursor')
                    });
                    if(devices.isiOS()){
                        $('body').css({ overflow: 'hidden' });
                    }
                    
                    element.css({ 'transition': 'none' });

                    $(window).unbind('mousemove.drag touchmove.start');
                    $(window).on('mousemove.resize touchmove.resize', function (e) {
                        element.unbind("click");
                        mouse = {
                            y: parseInt(e.pageY || e.originalEvent.touches[0].pageY),
                            x: parseInt(e.pageX || e.originalEvent.touches[0].pageX)
                        };
                    });

                    //animation for resizing
                    var resize = function () {
                        var newWidth = 0; var newHeight = 0;
                        if (resizeLimits.horizontalLeft || resizeLimits.horizontalRight) {
                            var p = element.offset();
                            if (resizeLimits.horizontalLeft) {
                                var distance = initial.pos.left - mouse.x;
                                if(params.moveWithResize === false){
                                    if(initial.pos.left + distance + initial.size.width > parent.offset().left + parentData.size.width){
                                        distance = (parent.offset().left + parentData.size.width) - initial.pos.left - 1;
                                    }
                                }
                                else{
                                    if(initial.pos.left - distance < parent.offset().left){
                                        distance = -(parent.offset().left - initial.pos.left) + 1;
                                    }
                                    element.offset({
                                        left: parseInt(initial.pos.left - distance),
                                        top: parseInt(p.top)
                                    });
                                }

                                newWidth = initial.size.width + distance;
                            }
                            else {
                                var distance = mouse.x - p.left;
                                if (element.offset().left + distance > parent.offset().left + parentData.size.width) {
                                    distance = (parent.offset().left + parentData.size.width) - element.offset().left - 2;
                                }
                                newWidth = distance;
                            }
                            if (newWidth > 0) {
                                element.width(newWidth);
                                if(params.preserveRatio){
                                    element.height(newWidth * ratio);
                                }
                            }
                        }
                        if ((resizeLimits.verticalTop || resizeLimits.verticalBottom) && !((resizeLimits.horizontalLeft || resizeLimits.horizontalRight) && params.preserveRatio)) {
                            var p = element.offset();
                            if (resizeLimits.verticalTop) {
                                var distance = initial.pos.top - mouse.y;

                                if(params.moveWithResize === false){
                                    if(initial.pos.top + distance + initial.size.height > parentData.pos.top + parentData.size.height && !(params.extendParent && params.extendParent.bottom)){
                                        distance = (parent.offset().top + parentData.size.height) - initial.pos.top - 1;
                                    }
                                }
                                else{
                                    if(initial.pos.top - distance < parentData.pos.top){
                                        distance = -(parent.offset().top - initial.pos.top) + 1;
                                    }
                                    element.offset({
                                        left: parseInt(p.left),
                                        top: parseInt(initial.pos.top - distance)
                                    });
                                }

                                newHeight = initial.size.height + distance;
                            }
                            else {
                                var distance = mouse.y - p.top;
                                if (element.offset().top + distance > parentData.pos.top + parent.height() && !(params.extendParent && params.extendParent.bottom)) {
                                    distance = (parentData.pos.top + parentData.size.height) - element.offset().top - borderWidth * 2;
                                }
                                newHeight = distance;
                            }
                            if (newHeight > 0) {
                                element.height(newHeight);
                                if(params.preserveRatio){
                                    element.width(newHeight / ratio);
                                }
                            }
                        }
                        element.trigger('resizing');
                        if (!interrupt) {
                            requestAnimationFrame(resize);
                        }
                    };
                    resize();

                    $(window).on('mouseup.resize touchleave.resize touchend.resize', function (e) {
                        interrupt = true;
                        element.removeClass(element.css('cursor'));
                        setTimeout(function () {
                            $('body').css({ overflow: initial.bodyScroll });
                            element.css({ 'transition': '' });
                            element.data('resizing', false);
                            element.trigger('stopResize');
                            cancelDefault = false;
                            if (params && typeof params.mouseUp === 'function') {
                                params.mouseUp(e);
                            }
                        }, 100);
                        $(window).unbind('mousemove.resize touchmove.resize mouseup.resize touchleave.resize touchend.resize');
                        $('body').unbind('mouseup.resize touchleave.resize touchend.resize');

                        $('.main').css({ 'cursor': '' });
                        element.removeClass('top');
                        element.removeClass('left');
                        element.removeClass('bottom');
                        element.removeClass('right');
                        element.removeClass('top-left');
                        element.removeClass('bottom-left');
                        element.removeClass('bottom-right');
                        element.removeClass('top-right');
                    });
                }
            });
        },
        draggable: function (element, params: { 
            lock?: any, 
            restrict?: any, 
            tick?: any, 
            dragOver?: any, 
            dragOut?: any, 
            allowDefault?: boolean,
            startDrag?: any,
            mouseMove?: any,
            mouseUp?: any
        }) {
            if (!params) {
                params = {};
            }
            if (!params.lock) {
                params.lock = {};
            }

            element.parents('.lightbox').on('touchmove', (e) => {
                if(cancelDefault){
                    e.preventDefault();
                }
            });

            if (element.length > 1) {
                element.each(function (index, item) {
                    ui.extendElement.draggable($(item), params);
                });
                return;
            }

            let catcher = element;
            if (params.restrict) {
                catcher = element.find(params.restrict);
            }

            catcher.on('touchstart mousedown', (e) => {
                console.log(element.data('resizing'));
                if (element.data('lock') === true || (e.target.tagName === 'INPUT' && $(e.target).attr('type') === 'text') || (e.target.tagName === 'TEXTAREA' && $(e.target).is(':focus'))) {
                    return;
                }
                let initialScroll = $(window).scrollTop();
                let interrupt = false;
                if (element.data('resizing') !== true) {

                    let mouse = {
                        y: e.clientY || e.originalEvent.touches[0].clientY,
                        x: e.clientX || e.originalEvent.touches[0].clientX
                    };
                    let initialMouse = JSON.parse(JSON.stringify(mouse));
                    let elementDistance = {
                        y: mouse.y - element.offset().top,
                        x: mouse.x - element.offset().left
                    };
                    let moved = false;

                    let parent = element.parents('.drawing-zone');
                    var parentWidth = parent.width();
                    var parentHeight = parent.height();
                    var parentPosition = parent.offset();
                    var boundaries = {
                        left: -Infinity,
                        top: -Infinity,
                        right: Infinity,
                        bottom: Infinity
                    };

                    if (parentPosition) {
                        boundaries = {
                            left: parseInt(parentPosition.left),
                            top: parseInt(parentPosition.top),
                            right: parseInt(parentPosition.left + parent.width() - element.width()),
                            bottom: parseInt(parentPosition.top + parent.height() - element.height())
                        };
                    }

                    var elementWidth = element.width();
                    var elementHeight = element.height();

                    var dropItemsAreas = [];
                    $('.droppable').each(function (index, item) {
                        var dropItemPos = $(item).offset();
                        var dropElementInfos = {
                            offset: dropItemPos,
                            width: $(item).width(),
                            height: $(item).height() + parseInt($(item).css('padding-bottom')),
                            item: $(item)
                        };
                        dropItemsAreas.push(dropElementInfos);
                    });

                    let dragoverred = [];
                    var moveElement = (e) => {
                        for(let i = 0; i < dropItemsAreas.length; i++){
                            dropItemsAreas[i].width = dropItemsAreas[i].item.width();
                            dropItemsAreas[i].height = dropItemsAreas[i].item.height();
                            dropItemsAreas[i].offset = {
                                left: dropItemsAreas[i].item.offset().left,
                                top: dropItemsAreas[i].item.offset().top,
                            }
                        }
                        var newOffset = {
                            top: parseInt((mouse.y - elementDistance.y) + (window.pageYOffset - initialScroll)),
                            left: parseInt(mouse.x - elementDistance.x)
                        };

                        if (mouse.y < 30) {
                            window.scrollTo(0, (window.scrollY || window.pageYOffset) - 10);
                        }

                        if (mouse.y > $(window).height() - 30) {
                            window.scrollTo(0, (window.scrollY || window.pageYOffset) + 10);
                        }

                        if (mouse.x < boundaries.left + elementDistance.x && elementWidth < parentWidth) {
                            newOffset.left = boundaries.left;
                        }
                        if (mouse.x > boundaries.right + elementDistance.x && elementWidth < parentWidth) {
                            newOffset.left = boundaries.right - 2
                        }
                        if (mouse.y + ((window.scrollY || window.pageYOffset) - initialScroll) < boundaries.top + elementDistance.y && elementHeight < parentHeight) {
                            newOffset.top = boundaries.top;
                        }
                        if (mouse.y + ((window.scrollY || window.pageYOffset) - initialScroll) > boundaries.bottom + elementDistance.y && elementHeight < parentHeight) {
                            newOffset.top = boundaries.bottom - 2;
                        }

                        if (params.lock && params.lock.vertical) {
                            newOffset.top = parseInt(element.offset().top);
                        }
                        if (params.lock && params.lock.horizontal) {
                            newOffset.left = parseInt(element.offset().left);
                        }
                        if(!element.data('resizing')){
                            element.offset(newOffset);
                        }

                        // hit test
                        let left = mouse.x;
                        let top = mouse.y + (window.scrollY || window.pageYOffset);

                        dropItemsAreas.forEach(function (dropElementInfos) {
                            let index = dragoverred.indexOf(dropElementInfos.item);
                            if (
                                dropElementInfos.offset.left < left &&
                                    dropElementInfos.offset.left + dropElementInfos.width > left
                                &&
                                dropElementInfos.offset.top < top &&
                                    dropElementInfos.offset.top + dropElementInfos.height > top
                            ) {
                                //on check si c bien une function
                                if (params && typeof params.dragOver === 'function') {
                                    //on applique le dragover sur l'item (donc declenche le 'faux' mouseover)
                                    params.dragOver(dropElementInfos.item);
                                    if (index === -1) {
                                        dropElementInfos.item.trigger('dragout');
                                        if (params && typeof params.dragOut === 'function') {
                                            params.dragOut(dropElementInfos.item);
                                        }
                                    }
                                    dragoverred.push(dropElementInfos.item);
                                    dropElementInfos.item.trigger('dragover', { x: left, y: top });
                                }
                            } else {
                                if (index !== -1) {
                                    dragoverred.splice(index, 1);
                                    dropElementInfos.item.trigger('dragout');

                                    if (params && typeof params.dragOut === 'function') {
                                        params.dragOut(dropElementInfos.item);
                                    }
                                }
                            }
                        });

                        if (params && typeof params.tick === 'function') {
                            params.tick(e, mouse);
                        }

                        if (!interrupt) {
                            requestAnimationFrame(function () {
                                moveElement(e);
                            });
                        }
                    };

                    $(window).on('touchmove.drag mousemove.drag', function (f) {
                        moved = true;
                        if (!params.allowDefault) {
                            f.preventDefault();
                            e.preventDefault();
                            cancelDefault = true;
                        }
                        if (params.mouseMove && typeof params.mouseMove === 'function') {
                            params.mouseMove(f, {
                                x: f.clientX || f.originalEvent.touches[0].clientX,
                                y: f.clientY || f.originalEvent.touches[0].clientY
                            }, initialMouse);
                        }
                        if ((f.clientX || f.originalEvent.touches[0].clientX) === mouse.x &&
                            (f.clientY || f.originalEvent.touches[0].clientY) === mouse.y) {
                            return;
                        }
                        if (!element.data('dragging')) {
                            element.trigger('startDrag', [{
                                elementDistance: elementDistance,
                                mouse: mouse
                            }]);

                            if (params && typeof params.startDrag === 'function') {
                                let newData = params.startDrag({
                                    elementDistance: elementDistance,
                                    mouse: mouse
                                });
                                if(!newData){
                                    newData = {};
                                }
                                if(newData.elementDistance){
                                    elementDistance = newData.elementDistance;
                                }
                            }

                            $('body').css({
                                '-webkit-user-select': 'none',
                                '-moz-user-select': 'none',
                                'user-select': 'none'
                            });
                            if(devices.isiOS()){
                                $('body').css({ overflow: 'hidden' });
                            }
                            if (element.css('position') === 'relative') {
                                element.css({ top: element.position().top, left: element.position().left });
                            }
                            element.css({
                                'position': 'absolute',
                                'transition': 'none'
                            });

                            moveElement(f);
                        }
                        element.unbind("click");
                        element.data('dragging', true);
                        mouse = {
                            y: f.clientY || f.originalEvent.touches[0].clientY,
                            x: f.clientX || f.originalEvent.touches[0].clientX
                        };
                    });

                    $('body').on('touchend.drag touchleave.drag mouseup.drag', function (e) {
                        $('body').css({
                            '-webkit-user-select': 'initial',
                            '-moz-user-select': 'initial',
                            'user-select': 'initial',
                            'overflow': 'auto'
                        });
                        element.css('transition', '');
                        interrupt = true;
                        $('body').unbind('mouseup.drag touchend.drag touchleave.drag');
                        $(window).unbind('mousemove.drag touchmove.drag');

                        setTimeout(function () {
                            cancelDefault = false;
                            if (element.data('dragging')) {
                                element.trigger('stopDrag');
                                element.data('dragging', false);
                                if (params && typeof params.mouseUp === 'function' && moved) {
                                    params.mouseUp(e);
                                }
                                if (params && typeof params.dragOut === 'function' && dragoverred.length) {
                                    dragoverred.forEach(d => {
                                        params.dragOut(d)
                                        d.trigger('dragout');
                                    });
                                }
                            }
                        }, 100);
                    });
                }
            });
        }
    },
    breakpoints: {
        wideScreen: 1200,
        tablette: 800,
        fatMobile: 550,
        smallMobile: 420,
        checkMaxWidth: function (size) {
            if (this[size]) {
                return window.matchMedia("(max-width: " + this[size] + "px)").matches
            } else {
                return window.matchMedia("(max-width: " + size + "px)").matches
            }
        }
    },
    scrollToTop: function () {
        var scrollUp = function () {
            var scrollTop = window.pageYOffset || document.getElementsByTagName('html')[0].scrollTop;
            if (scrollTop <= $('body').offset().top) {
                return;
            }
            window.scrollTo(0, scrollTop - parseInt(scrollTop / 10) - 1);
            setTimeout(scrollUp, 10);
        };
        scrollUp();
    },
    showLightbox: function () {
        mainLightbox.show();
    },
    hideLightbox: function () {
        mainLightbox.hide();
    },
    updateAvatar: function () {
        var scope = angular.element(document.getElementById('my-photo')).scope();
        scope.refreshAvatar();
    },
    scrollToId: function (id): Promise<void> {
        return new Promise<any>((resolve, reject) => {
            //jquery doesn't like selecting elements with slashes in their id,
            //whereas native API doesn't care
            var targetElement = document.getElementById(id);
            if (!targetElement) {
                resolve();
            }
            $('html, body').animate({
                scrollTop: $(targetElement).offset().top - 60 - $('sticky-row').outerHeight() - 10
            }, 800, () => {
                resolve();
            });
        });
        
    },
    setStyle: function (stylePath) {
        if ($('#theme').length === 0) {
            let version = 'dev';
            if((window as any).springboardBuildDate){
                version = (window as any).springboardBuildDate;
                console.log('Springboard built on ' + version);
            }

            var style = $('<link>', {
                rel: 'stylesheet',
                type: 'text/css',
                href: stylePath + 'theme.css?version=' + version,
                id: 'theme'
            });
            var favicon = $('<link>', {
                rel: 'icon',
                href: skin.basePath + 'img/illustrations/favicon.ico'
            });
            style.on('load', function () {
                $('body').show();
            });
            $('head')
                .append(style)
                .append(favicon);
            setTimeout(function () {
                $('body').show();
            }, 300);
        }
        else {
            $('#theme').attr('href', stylePath + 'theme.css');
        }
    },
    extendSelector: {
        touchEvents: function (selector:string, params?) {
            if (!params) {
                params = {};
            }
            //include existe
            if (params.include) {
                //pour chaque event dans include,
                params.include.forEach(function (event) {
                    //si exclude est défini et contient l'event, on annule
                    if (params.exclude && params.exclude.indexOf(event) !== -1) {
                        return;
                    }
                    //sinon on garde et applique le resultat
                    touchEvents[event + 'Selector'](selector, params);
                })
            }
            else {
                //include n'est pas défini
                // on regarde chaque event
                for (var property in touchEvents) {
                    if (
                        //la propriété contient bien bien le mot selector (on a bien un sélecteur)
                        property.indexOf('Selector') !== -1 &&
                        (
                            //exclude n'est pas défini, ou l'event n'est pas listé dans exclude
                            !params.exclude
                            ||
                            params.exclude.indexOf(property.split('Selector')[0]) === -1
                        )
                    ) {
                        //on applique le resultat
                        touchEvents[property](selector, params);
                    }
                }
            }
        }
    }
};

if(!(window as any).entcore){
	(window as any).entcore = {};
}
(window as any).entcore.ui = ui;
