import { $ } from '../../libs/jquery/jquery';

function beforeJustify(instance){
    instance.editZone.find('mathjax').html('');
    instance.editZone.find('mathjax').removeAttr('contenteditable');
}

function afterJustify(instance){
    instance.editZone.find('mathjax').each(function(index, item){
        var scope = angular.element(item).scope();
        scope.updateFormula(scope.formula)
    })
    instance.editZone.find('mathjax').attr('contenteditable', 'false');

    instance.trigger('justify-changed');
}

export const justifyLeft = {
    name: 'justifyLeft', 
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.justify.left"></i>',
            link: function(scope, element, attributes){
                element.addClass('toggled');
                element.on('click', function () {
                    if(!instance.editZone.is(':focus')){
                        instance.focus();
                    }
                    beforeJustify(instance)
                    instance.execCommand('justifyLeft');
                    if(document.queryCommandState('justifyLeft')){
                        element.addClass('toggled');							}
                    else{
                        element.removeClass('toggled');
                    }

                    afterJustify(instance)
                });

                instance.on('selectionchange', function(e){
                    if(document.queryCommandState('justifyLeft') && instance.selection.css('float') !== 'right' && instance.selection.css('z-index') !== "1"){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function(e){
                    if(document.queryCommandState('justifyLeft') && instance.selection.css('float') !== 'right' && instance.selection.css('z-index') !== "1"){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const justifyCenter = {
    name: 'justifyCenter', 
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.justify.center"></i>',
            link: function(scope, element, attributes){
                element.on('click', function(){
                    if(!instance.editZone.is(':focus')){
                        instance.focus();
                    }

                    beforeJustify(instance);
                    if(!document.queryCommandState('justifyCenter')){
                        instance.execCommand('justifyCenter');
                        element.addClass('toggled');
                    }
                    else{
                        instance.execCommand('justifyLeft');
                        element.removeClass('toggled');
                    }

                    afterJustify(instance);
                });

                instance.on('selectionchange', function(e){
                    // z-index is a hack to track margin width; auto width is computed as 0 in FF
                    if(document.queryCommandState('justifyCenter')
                        || (instance.selection.css('margin-left') === instance.selection.css('margin-right') && instance.selection.css('z-index') === '1')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function(e){
                    // z-index is a hack to track margin width; auto width is computed as 0 in FF
                    if(document.queryCommandState('justifyCenter')
                        || (instance.selection.css('margin-left') === instance.selection.css('margin-right') && instance.selection.css('z-index') === '1')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const justifyRight = {
    name: 'justifyRight', 
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.justify.right"></i>',
            link: function(scope, element, attributes){
                element.on('click', function () {
                    if(!instance.editZone.is(':focus')){
                        instance.focus();
                    }

                    beforeJustify(instance);
                    if(!document.queryCommandState('justifyRight')){
                        instance.execCommand('justifyRight');
                        element.addClass('toggled');
                    }
                    else{
                        instance.execCommand('justifyLeft');
                        element.removeClass('toggled');
                    }

                    afterJustify(instance);
                });

                instance.on('selectionchange', function (e) {
                    if(document.queryCommandState('justifyRight') || instance.selection.css('float') === 'right'){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function(e){
                    if(document.queryCommandState('justifyRight') || instance.selection.css('float') === 'right'){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const justifyFull = {
    mobile: false,
    name: 'justifyFull', 
    run: function(instance){
        return {
            template: '<i tooltip="editor.option.justify.full"></i>',
            link: function(scope, element, attributes){
                element.on('click', function(){
                    if(!instance.editZone.is(':focus')){
                        instance.focus();
                    }

                    beforeJustify(instance);
                    if(!document.queryCommandState('justifyFull')){
                        element.addClass('toggled');
                        instance.execCommand('justifyFull');
                    }
                    else{
                        instance.execCommand('justifyLeft');
                        element.removeClass('toggled');
                    }

                    afterJustify(instance);
                });

                instance.on('selectionchange', function(e){
                    if(document.queryCommandState('justifyFull')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function(e){
                    if(document.queryCommandState('justifyFull')){
                        element.addClass('toggled');
                    }
                    else{
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};