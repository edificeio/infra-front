import { MediaLibrary, Document } from '../workspace';
import { idiom } from '../idiom';
import { $ } from '../libs/jquery/jquery';

export function onDropFromDesktop(e, editorInstance, element){
    if(!e.originalEvent.dataTransfer){
        return;
    }
    var visibility: 'protected' | 'public' = 'protected';
    if (editorInstance.visibility === 'public') {
        visibility = 'public';
    }

    element.removeClass('droptarget');
    var el = {} as any;
    var files = e.originalEvent.dataTransfer.files;
    if(!files.length){
        return;
    }
    e.preventDefault();
    var range;
    var sel = window.getSelection();
    if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(e.originalEvent.clientX, e.originalEvent.clientY);
    }
    else if (document.caretPositionFromPoint) {
        var caretPosition = document.caretPositionFromPoint(e.originalEvent.clientX, e.originalEvent.clientY);
        range = document.createRange();
        range.setStart(caretPosition.offsetNode, caretPosition.offset);
    }
    if (range) {
        sel.removeAllRanges();
        sel.addRange(range);
        editorInstance.selection.range = range;
        editorInstance.selection.rangeCount = 1;
    }

    let html = '';
    let all = files.length;

    const uploadFile = async (file: File) => {
        var name = files[i].name;
        const doc = new Document();
        await doc.upload(files[i], visibility)
        all --;
        var path = '/workspace/document/';
        if (visibility === 'public') {
            path = '/workspace/pub/document/';
        }

        if (name.indexOf('.mp3') !== -1 || name.indexOf('.wav') !== -1 || name.indexOf('.ogg') !== -1) {
            el = $('<audio controls preload="none"></audio>');
            el.attr('src', path + doc._id)
        }
        else if (name.toLowerCase().indexOf('.png') !== -1 || name.toLowerCase().indexOf('.jpg') !== -1 || name.toLowerCase().indexOf('.jpeg') !== -1 || name.toLowerCase().indexOf('.svg') !== -1) {
            el = $('<span contenteditable="false" class="image-container"><img /></span>');
            el.children('img').attr('src', path + doc._id + '?thumbnail=150x150')
        }
        else {
            el = $('<div class="download-attachments">' +
                '<h2>' + idiom.translate('editor.attachment.title') + '</h2>' +
                '<div class="attachments">' +
                    '<a href="'+ path + doc._id + '"><div class="download"></div>' + name + '</a>' +
            '</div></div><div><br /><div><br /></div></div>');
        }

        html += '<div>' + el[0].outerHTML + '<div><br></div><div><br></div></div>';
        if(all === 0){
            editorInstance.selection.replaceHTML(html);
        }
    }

    for(var i = 0; i < files.length; i++){
        (function(){
            uploadFile(files[i])
        }())
    }
}