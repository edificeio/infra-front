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

    const initialTextLength = startContainer.nodeValue.length;

    startContainer.nodeValue = trimBeforeIndex(startContainer.nodeValue, startOffset);

    const textLengthDiff = initialTextLength - startContainer.nodeValue.length;
    const newRange = document.createRange();
    newRange.setStart(startContainer, startOffset - textLengthDiff);
    if (endContainer === startContainer) {
        newRange.setEnd(endContainer, endOffset - textLengthDiff);
    } else {
        newRange.setEnd(endContainer, endOffset);
    }

    return {node, range: newRange};
}

export function onPressDelete(event, selection, editorInstance, editZone) {
    editorInstance.addState(editZone.html());

    let ranges: Range[] = [];

    for (let i = 0; i < selection.rangeCount; i++) {
        ranges.push(selection.getRangeAt(i));
    }

    ranges = ranges.map(range => {
        let newRange: Range = range;
        let startContainer = newRange.startContainer;

        if (startContainer.nodeType === Node.TEXT_NODE) {
            newRange = trimNodeBeforeRange(startContainer, newRange).range;
        }
        startContainer = newRange.startContainer;

        if (startContainer.nodeType === Node.ELEMENT_NODE &&
            (startContainer.nodeName === 'TD' || startContainer.nodeName === 'TR')) {
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
                            newRange = document.createRange();
                            newRange.setStart(previousElement, previousElement.textContent.length);
                        } else {
                            let textNode = findLatestChildTextNode(previousElement);
                            if (!textNode) {
                                textNode = document.createTextNode('');
                                previousElement.appendChild(textNode);
                            }
                            newRange = document.createRange();
                            newRange.setStart(textNode, textNode.textContent.length);
                        }
                        event.preventDefault();
                        blockElement.parentNode.removeChild(blockElement);
                    } else if (trim(previousElement.textContent).length === 0 &&
                        newRange.startOffset === 0 &&
                        (newRange.startContainer === newRange.endContainer) &&
                        (newRange.startOffset === newRange.endOffset)) { // previousElement line can be deleted
                        previousElement.parentNode.removeChild(previousElement);
                        event.preventDefault();
                    }
                }

            }
        }
        return newRange? newRange : range;
    });
    selection.removeAllRanges();
    ranges.forEach(range => selection.addRange(range));
    editZone.find('table').each(function (index, item) {
        if ($(item).find('tr').length === 0) {
            $(item).remove();
        }
    });

}
