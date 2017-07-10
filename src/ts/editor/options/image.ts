import { ui } from '../../ui';
import { $ } from '../../libs/jquery/jquery';
import { Document } from '../../workspace';
import { Mix } from 'entcore-toolkit';

const refreshResize = (instance) => {
    ui.extendElement.resizable(instance.editZone.find('.image-container'), {
        moveWithResize: false,
        mouseUp: function() {
            instance.trigger('contentupdated');
            instance.addState(instance.editZone.html());
        },
        extendParent: { bottom: true }
    });
};

const showImageContextualMenu = (refElement, scope, instance) => {
    let imageMenu;

    if($(window).width() >= ui.breakpoints.tablette){
        imageMenu = $(`
            <div class="image-contextual-menu">
                <button class="edit-image"><i18n>edit.image</i18n></button>

                <i class="resize-image small"></i>
                <i class="resize-image medium"></i>
                <i class="resize-image large selected"></i>
            </div>
        `)
        .appendTo('body');
    }
    else{
        imageMenu = $(`
            <div class="image-contextual-menu">
                <button class="open-media-library"><i18n>edit.image</i18n></button>

                <i class="justify-left"></i>
                <i class="justify-center"></i>
                <i class="justify-right"></i>
            </div>
        `)
        .appendTo('body');
    }

    const image = refElement.find('img');
    refElement.addClass('has-menu');

    if(image.attr('src').indexOf('thumbnail') !== -1){
        const width = parseInt(image.attr('src').split('thumbnail=')[1].split('x')[0]);
        if(width === 150){
            imageMenu.find('.selected').removeClass('selected');
            imageMenu.find('.small').addClass('selected');
        }
        if(width === 290){
            imageMenu.find('.selected').removeClass('selected');
            imageMenu.find('.medium').addClass('selected');
        }
    }
    
    const refreshPositon = (size: string) => {
        imageMenu.find('.selected').removeClass('selected');
        imageMenu.find('.' + size).addClass('selected');
        image.on('load', () => {
            imageMenu.offset({
                top: refElement.offset().top + refElement.height() + 10,
                left: refElement.offset().left + 5
            });
        });
    };

    imageMenu.offset({
        top: refElement.offset().top + refElement.height() + 10,
        left: refElement.offset().left + 5
    })
    .on('click', '.edit-image', () => {
        const urlParts = image.attr('src').split('/');
        if(urlParts[1] === 'assets'){
            scope.imageOption.display.pickFile = true;
            scope.$apply();
            return;
        }
        scope.imageOption.display.file = Mix.castAs(Document, { _id: urlParts[urlParts.length - 1].split('?')[0] });
        scope.imageOption.display.editFile = true;
        scope.updateImage = () => {
            let src = image.attr('src');
            scope.imageOption.display.editFile = false;
            if(src.indexOf('?') !== -1){
                if(src.indexOf('v=') !== -1){
                    let v = parseInt(src.split('v=')[1].split('&')[0]);
                    v++;
                    src = src.replace(/(v=).*?(&|$)/,'$1' + v + '$2');
                }
                else{
                    src += '&v=1';
                }
            }
            else{
                src += '?v=1';
            }

            image.attr('src', src);
        }
        scope.$apply();
    })
    .on('click', 'i.small', () => {
        image.attr('src', image.attr('src').split('?')[0] + '?thumbnail=150x150&v=' + Math.floor(Math.random() * 100));
        image.parent('.image-container').css({ width: '150px', height: '150px'});
        refreshPositon('small');
    })
    .on('click', 'i.medium', () => {
        refElement.find('img').attr('src', refElement.find('img').attr('src').split('?')[0] + '?thumbnail=290x290&v=' + Math.floor(Math.random() * 100));
        image.parent('.image-container').css({ width: '290px', height: '290px'});
        refreshPositon('medium');
    })
    .on('click', 'i.large', () => {
        refElement.find('img').attr('src', refElement.find('img').attr('src').split('?')[0] + '?thumbnail=2600x0&v=' + Math.floor(Math.random() * 100));
        image.parent('.image-container').css({ width: 'auto', height: 'auto'});
        refreshPositon('large');
    })
    .on('click', '.open-media-library', () => {
        scope.imageOption.display.pickFile = true;
        scope.$apply();
    })
    .on('click', '.justify-left', () => {
        image.parent().css({ float: 'left' });
    })
    .on('click', '.justify-center', () => {
        image.parent().css({ float: 'none', margin: 'auto', display: 'block' });
    })
    .on('click', '.justify-right', () => {
        image.parent().css({ float: 'right', margin: 'auto' });
    });
    
    setTimeout(() => {
        $(document).one('selectionchange', (e) => {
            if(imageMenu.find(e.target).length === 0){
                imageMenu.remove();
                refElement.removeClass('has-menu');
            }
        });

        $(document).one('keyup', (e) => {
            setTimeout(() => {
                if(!$('body').find(image).length){
                    imageMenu.remove();
                    refElement.removeClass('has-menu');
                }
            }, 50);
        });

        $(document).on('click', '.close-focus', () => {
            imageMenu.remove();
            refElement.removeClass('has-menu');
        });
    }, 0);
}

export const image = {
    name: 'image', 
    run: function(instance){
        return {
            template: '<i ng-click="imageOption.display.pickFile = true" tooltip="editor.option.image"></i>' +
            '<div ng-if="imageOption.display.editFile">'+
                '<image-editor document="imageOption.display.file" on-save="updateImage()" show="imageOption.display.editFile"></image-editor>' +
            '</div>' +
            '<div ng-if="imageOption.display.pickFile">' +
                '<lightbox show="imageOption.display.pickFile">' +
                    '<media-library ng-change="updateContent()" multiple="true" ng-model="imageOption.display.files" file-format="\'img\'" visibility="imageOption.visibility"></media-library>' +
                '</lightbox>' +
            '</div>',
            link: function (scope, element, attributes) {
                instance.editZone.on('click', 'img', (e) => {
                    if(!$(e.target).attr('src').startsWith('/workspace') && !$(e.target).attr('src').startsWith('/assets')){
                        return;
                    }
                    let parentSpan = $('<span contenteditable="false" class="image-container">&#8203;</span>');
                    if($(e.target).parent().hasClass('image-container')){
                        parentSpan = $(e.target.parentNode);
                    }
                    else{
                        e.target.parentNode.insertBefore(parentSpan[0], e.target);
                        parentSpan.append(e.target);
                    }
                    
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    const newRange = new Range();
                    newRange.selectNode(parentSpan[0]);
                    sel.addRange(newRange);
                    showImageContextualMenu(parentSpan, scope, instance);
                });

                scope.imageOption = {
                    display: { pickFile: false },
                    visibility: 'protected'
                }

                if(instance.visibility === 'public'){
                    scope.imageOption.visibility = 'public';
                }

                instance.editZone.addClass('drawing-zone');
                scope.display = {};
                scope.updateContent = function () {
                    var path = '/workspace/document/';
                    if (scope.imageOption.visibility === 'public') {
                        path = '/workspace/pub/document/';
                    }
                    var html = '<span contenteditable="false" class="image-container" style="width: 290px; height: 290px">&#8203;';
                    scope.imageOption.display.files.forEach(function (file) {
                        html += '<img src="' + path + file._id + '?thumbnail=290x290" class="latest-image" /></span>';
                    });
                    instance.selection.replaceHTMLInline(html);
                    let image = instance.editZone
                        .find('.latest-image')
                        .removeClass('latest-image');
                    image.on('load', () => image.trigger('click'));
                    instance.addState(instance.editZone.html());
                    scope.imageOption.display.pickFile = false;
                    scope.imageOption.display.files = [];
                    instance.focus();
                };

                instance.on('model-updated', () => refreshResize(instance))

                instance.element.on('drop', function (e) {
                    var image;
                    if (e.originalEvent.dataTransfer.mozSourceNode) {
                        image = e.originalEvent.dataTransfer.mozSourceNode;
                    }

                    //delay to account for image destruction and recreation
                    setTimeout(function(){
                        if(image && image.tagName && image.tagName === 'IMG'){
                            image.remove();
                        }
                        instance.editZone.find('img').each((index, item) => {
                            if($(item).attr('src').split(location.protocol + '//' + location.host).length > 1){
                                $(item).attr('src', $(item).attr('src').split(location.protocol + '//' + location.host)[1]);
                                let parentSpan = $('<span contenteditable="false" class="image-container">&#8203;</span>');
                                item.parentNode.insertBefore(parentSpan[0], item);
                                parentSpan.append(item);
                            }
                        });
                        instance.addState(instance.editZone.html());
                        refreshResize(instance);
                    }, 30)
                });
            }
        }
    }
};