import { $ } from "../libs";

export function onPressDelete(event, selection, editorInstance, editZone) {
    editorInstance.addState(editZone.html());
    // for whatever reason, ff likes to create several ranges for table selection
    // which messes up their deletion
    for (var i = 0; i < selection.rangeCount; i++) {
        var r = selection.getRangeAt(i);
        var startContainer = r.startContainer;
        var selfContent = startContainer.textContent.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Delete empty white spaces
        if (startContainer.nodeType === 1 && startContainer.nodeName === 'TD' || startContainer.nodeName === 'TR') {
            (startContainer as any).remove();
        }
        // Also delete the empty div for return after backslash
        else if (startContainer.nodeName === '#text' && selfContent.length === 0) {
            if (startContainer.parentNode.previousSibling) {
                var node = startContainer.parentNode.previousSibling.lastChild;
                // Needs to place the caret correctly for firefox
                setTimeout(function () {
                    var range = document.createRange();
                    range.setStart(node, node.textContent.length);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }, 1);
                event.preventDefault();
                (startContainer.parentNode as any).remove();
            }
        }
        // If the current line already contain text
        else if (r.startOffset === 1 && startContainer.parentNode.previousSibling) {
            var previousContent = startContainer.parentNode.previousSibling.lastChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
            if (startContainer.parentNode.previousSibling.lastChild.nodeName === '#text' && previousContent.length === 0) {
                (startContainer.parentNode.previousSibling as any).remove();
            }
        }
    }
    editZone.find('table').each(function (index, item) {
        if ($(item).find('tr').length === 0) {
            $(item).remove();
        }
    });
}