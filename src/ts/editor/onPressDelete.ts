import { $ } from "../libs";
import { findClosestHTMLElement, findLatestChildTextNode, isHTMLBlockElement } from "./selection";

export function findClosestBlockElement(currentNode: Node, root: Node): Node {
    let target;
    while ((currentNode = findClosestHTMLElement(currentNode)) && currentNode !== root && !target) {
        if (isHTMLBlockElement(currentNode)) {
            target = currentNode;
        }
    }
    return target;
}

function trim(text: string): string {
    return text.replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function trimBeforeIndex(text: string, index: number): string {
    return trim(text.substring(0, index)) + text.substring(index);
}

function trimNodeBeforeRange(node: Node, range: Range): { node: Node, range: Range } {
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

    const initialTextLength = startContainer.textContent.length;

    startContainer.textContent = trimBeforeIndex(startContainer.textContent, startOffset);

    const textLengthDiff = initialTextLength - startContainer.textContent.length;

    range.setStart(startContainer, startOffset - textLengthDiff);
    if (endContainer === startContainer) {
        range.setEnd(endContainer, endOffset - textLengthDiff);
    }

    return {node, range};
}

export function onPressDelete(event, selection, editorInstance, editZone) {
    editorInstance.addState(editZone.html());

    for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        const startContainer = range.startContainer;

        if (startContainer.nodeType === Node.TEXT_NODE) {
            trimNodeBeforeRange(startContainer, range);
        }

        if (startContainer.nodeType === Node.ELEMENT_NODE && startContainer.nodeName === 'TD' || startContainer.nodeName === 'TR') {
            startContainer.parentNode.removeChild(startContainer);
        } else {
            if (startContainer !== editZone.get(0)) {
                let blockElement: Node;
                if (isHTMLBlockElement(startContainer)) {
                    blockElement = startContainer;
                } else {
                    blockElement = findClosestBlockElement(startContainer, editZone.get(0));
                }
                if (blockElement && blockElement.previousSibling) {
                    const previousElement = blockElement.previousSibling;
                    if (trim(blockElement.textContent).length === 0) { // current line can be deleted
                        if (previousElement.nodeType === Node.TEXT_NODE) {
                            const range = document.createRange();
                            range.setStart(previousElement, previousElement.textContent.length);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        } else {
                            let textNode = findLatestChildTextNode(previousElement);
                            if (!textNode) {
                                textNode = document.createTextNode('');
                                previousElement.appendChild(textNode);
                            }
                            const range = document.createRange();
                            range.setStart(textNode, textNode.textContent.length);
                            selection.removeAllRanges();
                            selection.addRange(range);
                        }
                        event.preventDefault();
                        blockElement.parentNode.removeChild(blockElement);
                    } else if (trim(previousElement.textContent).length === 0 &&
                        range.startOffset === 0 &&
                        (range.startContainer === range.endContainer) &&
                        (range.startOffset === range.endOffset)) { // previousElement line can be deleted
                        previousElement.parentNode.removeChild(previousElement);
                        event.preventDefault();
                    }
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
