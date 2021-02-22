import { ui } from '../../ui';
import { $ } from '../../libs/jquery/jquery';
import { Document, MediaLibrary } from '../../workspace';
import { Mix } from 'entcore-toolkit';
import { idiom } from "../../idiom";
import { Me } from '../../me';
import { workspaceService } from '../../workspace/services';

const refreshResize = (instance) => {
    ui.extendElement.resizable(instance.editZone.find('.image-container').not('.image-template .image-container'), {
        moveWithResize: false,
        preserveRatio: true,
        mouseUp: function() {
            instance.trigger('contentupdated');
            instance.addState(instance.editZone.html());
        },
        extendParent: { bottom: true }
    });
};

const setOffset = (refElement, imageMenu) => {
    const offset = {
        top: refElement.offset().top + refElement.height() + 20,
        left: refElement.offset().left + 5
    };

    if(offset.left + imageMenu.width() > $(window).width()){
        offset.left = $(window).width() - imageMenu.width();
    }
    if(offset.top + imageMenu.height() > $(window).height() + window.scrollY){
        offset.top = ($(window).height() + window.scrollY) - imageMenu.height();
    }
    if(offset.top < refElement.offset().top){
        offset.top = refElement.offset().top;
    }

    return offset;
}

const showImageContextualMenu = (refElement, scope, instance) => {
    let imageMenu;
    const image = refElement.find('img');
    refElement.addClass('has-menu');

    imageMenu = $(`
        <div class="image-contextual-menu">
            <button class="edit-image">${ idiom.translate('edit.image') }</button>

            <i class="resize-image small"></i>
            <i class="resize-image medium"></i>
            <i class="resize-image large selected"></i>
        </div>
    `)
    .appendTo('body');

    if(image.attr('src').indexOf('thumbnail') !== -1){
        const width = parseInt(image.attr('src').split('thumbnail=')[1].split('x')[0]);

        if((image[0].naturalWidth < 290 || image[0].naturalHeight < 290) && width > 290){
            imageMenu.find('.resize-image.medium').remove();
        }
    
        if(((image[0].naturalWidth < 120 || image[0].naturalHeight < 120) && width > 290) || image.parents('.image-template').length > 0){
            imageMenu.find('.resize-image').remove();
        }

        if(width === 120){
            imageMenu.find('.selected').removeClass('selected');
            imageMenu.find('.small').addClass('selected');
        }
        if(width === 290){
            imageMenu.find('.selected').removeClass('selected');
            imageMenu.find('.medium').addClass('selected');
        }
    }
    
    const refreshPositon = (size?: string) => {
        imageMenu.find('.selected').removeClass('selected');
        imageMenu.find('.' + size).addClass('selected');
        const offset = {
            top: refElement.offset().top + refElement.height() + 20,
            left: refElement.offset().left + 5
        };

        if(offset.left + imageMenu.width() > $(window).width()){
            offset.left = $(window).width() - imageMenu.width();
        }
        image.on('load', () => {
            imageMenu.offset(offset);
        });
    };

    $(window).on('scroll.imagemenu', () => {
        imageMenu.offset(setOffset(refElement, imageMenu));
    })

    refElement.on('resizing.imageMenu', (e) => {
        imageMenu.offset(setOffset(refElement, imageMenu));
    });

    

    imageMenu
    .offset(setOffset(refElement, imageMenu))
    .on('click', '.edit-image', async () => {
        const urlParts = image.attr('src').split('/');
        if(urlParts[1] !== 'workspace'){
            scope.imageOption.display.pickFile = true;
            scope.$apply();
            return;
        }
        const id =  urlParts[urlParts.length - 1].split('?')[0];
        const founded = await workspaceService.fetchDocuments({filter:"all",id});
        if(founded.length==0){
            console.warn("[imageEditor] could not found document for id: ", id)
        }
        scope.imageOption.display.file = founded[0];
        await scope.imageOption.display.file.loadProperties();
        if(scope.imageOption.display.file.metadata.extension === 'jpg'){
            scope.imageOption.display.file.metadata['content-type'] = 'image/jpeg';
        }
        else{
            scope.imageOption.display.file.metadata['content-type'] = 'image/' + scope.imageOption.display.file.metadata.extension;
        }
        scope.imageOption.display.editFile = true;
        scope.$apply();
        scope.updateImage = () => {
            let src = image.attr('src');
            scope.imageOption.display.editFile = false;
            let v = Math.random() * 10;
            if(src.indexOf('?') !== -1){
                if(src.indexOf('v=') !== -1){
                    src = src.replace(/(v=).*?(&|$)/,'$1' + v + '$2');
                }
                else{
                    src += '&v=' + v;
                }
            }
            else{
                src += '?v=' + v;
            }
            image.on('load', () => {
                refElement.width(image.width());
                refElement.height(image.height());
            });
            
            image.attr('src', src);
            if(scope.imageOption.display.file.alt){
                image.attr('alt', scope.imageOption.display.file.alt);
            }
            else{
                image.removeAttr('alt');
            }

            instance.trigger('contentupdated');
            scope.$apply();
        }
        
    })
    .on('click', 'i.small', () => {
        //image.attr('src', image.attr('src').split('?')[0] + '?thumbnail=120x120&v=' + Math.floor(Math.random() * 100));
        image.parent('.image-container').css({ width: '120px', height: 'auto'});
        refreshPositon('small');
        instance.trigger('change');
    })
    .on('click', 'i.medium', () => {
        //refElement.find('img').attr('src', refElement.find('img').attr('src').split('?')[0] + '?thumbnail=290x290&v=' + Math.floor(Math.random() * 100));
        image.parent('.image-container').css({ width: '290px', height: 'auto'});
        refreshPositon('medium');
        instance.trigger('change');
    })
    .on('click', 'i.large', () => {
        //refElement.find('img').attr('src', refElement.find('img').attr('src').split('?')[0] + '?thumbnail=2600x0&v=' + Math.floor(Math.random() * 100));
        image.parent('.image-container').css({ width: 'auto', height: 'auto'});
        refreshPositon('large');
        instance.trigger('change');
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
    
    refreshPositon();

    const unbind = () => {
        imageMenu.remove();
        refElement.removeClass('has-menu');
        refElement.off('resizing.imageMenu');
        $(window).off('scroll.imagemenu');
    }

    setTimeout(() => {
        scope.$on('$destroy', function () {
            unbind();
        });

        $(document).one('selectionchange', (e) => {
            setTimeout(() => {
                if(imageMenu.find(e.target).length === 0){
                    unbind();
                }
            }, 200);
            
        });

        $(document).one('keyup', (e) => {
            setTimeout(() => {
                if(!$('body').find(image).length){
                    unbind();
                }
            }, 50);
        });

        $(document).on('click', '.close-focus', () => {
            unbind();
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
                instance.editZone.on('click touchstart', 'img:not(.smiley)', (e) => {
                    if(!e.target){
                        return;
                    }
                    if($(e.target).attr('src').startsWith('/assets')){
                        scope.imageOption.display.pickFile = true;
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        const newRange = document.createRange();
                        newRange.selectNode(e.target);
                        sel.addRange(newRange);
                        instance.selection.range = newRange;
                        scope.$apply();
                    }
                    if(!$(e.target).attr('src').startsWith('/workspace')){
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
                    const newRange = document.createRange();
                    newRange.selectNode(parentSpan[0]);
                    sel.addRange(newRange);
                    instance.selection.range = newRange;
                    showImageContextualMenu(parentSpan, scope, instance);
                });
                instance.on('contentupdated', () => {
                    ui.extendElement.resizable(instance.editZone.find('.image-container').not('.image-template .image-container'), {
                        moveWithResize: false,
                        preserveRatio: true,
                        mouseUp: function() {
                            instance.trigger('contentupdated');
                            instance.addState(instance.editZone.html());
                        },
                        extendParent: { bottom: true }
                    });
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
                    var html = '';
                    scope.imageOption.display.files.forEach(function (file) {
                        html += `<span contenteditable="false" class="image-container">
                            &#8203;<img src="${ path }${ file._id }?thumbnail=2600x0"`;
                            if(file.alt){
                                html += `alt="${ file.alt }"`;
                            }
                            html += ` class="latest-image" />
                        </span>&nbsp;&nbsp;`;
                    });
                    instance.selection.replaceHTMLInline(html);
                    let image = instance.editZone
                        .find('.latest-image')
                        .removeClass('latest-image');
                    instance.addState(instance.editZone.html());
                    scope.imageOption.display.pickFile = false;
                    scope.imageOption.display.files = [];
                    instance.focus();
                    window.getSelection().removeAllRanges();
                };

                instance.on('model-updated', () => refreshResize(instance));

                instance.editZone.on('drop', 'img', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    return false;
                });

                let zombieImage;

                instance.editZone.on('dragover drop', (e) => {
                    zombieImage = undefined;
                    if(document.caretPositionFromPoint){
                        const rangeNode = document.caretPositionFromPoint(e.originalEvent.clientX, e.originalEvent.clientY).offsetNode;
                        if(rangeNode.nodeType === 1 && rangeNode.tagName === 'SPAN'){
                            if($(rangeNode).find('img').length){
                                zombieImage = rangeNode.find('img')[0];
                            }

                        }
                    }
                });

                instance.editZone.on('drop', function (e) {
                    console.log('drop image')
                    //delay to account for image destruction and recreation
                    setTimeout(function(){
                        instance.editZone.find('img').each((index, item) => {
                            if($(item).attr('src').split(location.protocol + '//' + location.host).length > 1){
                                $(item).attr('src', $(item).attr('src').split(location.protocol + '//' + location.host)[1]);
                                let parentSpan = $('<span contenteditable="false" class="image-container">&#8203;</span>');
                                let parentNode = item.parentNode;
                                if($(parentNode).hasClass('image-container')){
                                    parentNode = parentNode.parentNode;
                                }
                                parentNode.insertBefore(parentSpan[0], item);
                                parentSpan.append(item);
                                
                            }
                        });
                        instance.addState(instance.editZone.html());
                        refreshResize(instance);
                    }, 100)
                });

                instance.editZone.on('dragstart', 'img', (e) => {
                    $('body').one('dragend.dragimage', () => {
                        instance.editZone.off('drop.dragimage');
                    });
                    
                    instance.editZone.one('drop.dragimage', () => {
                        setTimeout(() => {
                            if(zombieImage && $('body').find(zombieImage).length === 0){
                                console.log(zombieImage);
                                console.log($('body').find(zombieImage).length)
                                e.target.parentNode.insertBefore(zombieImage, e.target);
                            }
                        }, 250);
                        
                        setTimeout(() => $(e.target).parent('span').remove(), 200);
                    });
                });
            }
        }
    }
};