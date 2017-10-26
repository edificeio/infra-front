import { $ } from '../../libs/jquery/jquery';
import { textNodes } from '../selection';

function findBlockParent(node: Node){
    if(node.nodeType === 1 && textNodes.indexOf(node.nodeName) === -1){
        return node;
    }
    if(node.attributes && node.attributes['contenteditable'] && node.nodeName === 'DIV'){
        const newNode = document.createElement('div');
        node.appendChild(newNode);
        for(let i = 0; i < node.childNodes.length; i++){
            newNode.appendChild(node.childNodes[i]);
        }
        return node;
        
    }
    if(node.nodeType !== 1 || textNodes.indexOf(node.nodeName) !== -1){
        return findBlockParent(node.parentElement);
    }
}

function selectBlockParent(){
    const sel = document.getSelection();
    const range = sel.getRangeAt(0);
    let ancestor = range.commonAncestorContainer;
    let started = false;
    const newRange = document.createRange();
    ancestor = findBlockParent(ancestor);
    for(let i = 0; i < ancestor.childNodes.length; i++){
        const blockParent = findBlockParent(ancestor.childNodes[i]);
        if(ancestor.childNodes[i] === range.startContainer || ancestor.childNodes[i].contains(range.startContainer) || range.startContainer.contains(ancestor.childNodes[i])){
            started = true;
            newRange.setStart(blockParent, 0);
        }

        if(!started){
            continue;
        }

        if(ancestor.childNodes[i] === range.endContainer || ancestor.childNodes[i].contains(range.endContainer) || range.endContainer.contains(ancestor.childNodes[i])){
            newRange.setEnd(blockParent, blockParent.childNodes.length);
        }
    }
    
    sel.removeAllRanges();
    sel.addRange(newRange);
}

function beforeJustify(instance){
    selectBlockParent();
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
                    instance.selection.css({ 'text-align': 'left' });
                    if(document.queryCommandState('justifyLeft')){
                        element.addClass('toggled');							
                    }
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
                        instance.selection.css({ 'text-align': 'center' });
                        element.addClass('toggled');
                    }
                    else{
                        instance.selection.css({ 'text-align': 'left' });
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
                        instance.selection.css({ 'text-align': 'right' });
                        element.addClass('toggled');
                    }
                    else{
                        instance.selection.css({ 'text-align': 'left' });
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
                        instance.selection.css({ 'text-align': 'justify' });
                    }
                    else{
                        instance.selection.css({ 'text-align': 'left' });
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