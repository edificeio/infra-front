import { $ } from "../libs";
import { findClosestHTMLElement, findLatestChildTextNode, isHTMLBlockElement } from "./selection";

function findClosestBlockElement(currentNode: Node, root: Node): Node {
    let target;
    while ((currentNode = findClosestHTMLElement(currentNode)) && isHTMLBlockElement(currentNode) && currentNode !== root && !target) {
        target = currentNode;
    }
    return target;
}

export function onPressDelete(event, selection, editorInstance, editZone) {
    editorInstance.addState(editZone.html());
    // for whatever reason, ff likes to create several ranges for table selection
    // which messes up their deletion
    for (var i = 0; i < selection.rangeCount; i++) {
        var r = selection.getRangeAt(i);
        var startContainer = r.startContainer;
        if (startContainer.nodeType === 1 && startContainer.nodeName === 'TD' || startContainer.nodeName === 'TR') {
            (startContainer as any).remove();
        } else {
            if (startContainer !== editZone.get(0)) {
                let blockElement: Node;
                if (isHTMLBlockElement(startContainer)) {
                    blockElement = startContainer;
                } else {
                    blockElement = findClosestBlockElement(startContainer, editZone.get(0));
                }
                if (blockElement && blockElement.previousSibling) {
                    if (blockElement.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '') === '') {
                        const previous = blockElement.previousSibling;
                        if (previous.nodeType === Node.TEXT_NODE) {
                            const range = document.createRange();
                            range.setStart(previous, previous.textContent.length);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        } else {
                            let textNode = findLatestChildTextNode(previous);
                            if (!textNode) {
                                textNode = document.createTextNode('');
                                previous.appendChild(textNode);
                            }
                            const range = document.createRange();
                            range.setStart(textNode, textNode.textContent.length);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                        event.preventDefault();
                        blockElement.parentNode.removeChild(blockElement);
                    }
                }

            }
            // If the current line already contain text
            else if (r.startOffset === 1 && startContainer.parentNode.previousSibling) {
                var previousContent = startContainer.parentNode.previousSibling.lastChild.textContent.replace(/[\u200B-\u200D\uFEFF]/g, '');
                if (startContainer.parentNode.previousSibling.lastChild.nodeName === '#text' && previousContent.length === 0) {
                    startContainer.parentNode.previousSibling.parentNode.removeChild(startContainer.parentNode.previousSibling);
                }
            }
        }
    }
    editZone.find('table').each(function (index, item) {
        if ($(item).find('tr').length === 0) {
            $(item).remove();
        }
    });
}
