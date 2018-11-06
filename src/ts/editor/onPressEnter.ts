import { $ } from "../libs/jquery/jquery";
import { findFirstChildTextNode } from "./selection";
import { findClosestBlockElement } from "./onPressDelete";

function isElementNode(node: Node): node is HTMLElement {
    return node.nodeType === Node.ELEMENT_NODE;
}

export function isElementNodeWithName(node: Node, nodeName: string): boolean {
    return isElementNode(node) && node.nodeName === nodeName;
}

// this is a partial implementation of toKebabCase (camelCase -> kebabCase).
// see lodash implementation for a more general-purposed kebabCase function:
// https://lodash.com/docs/#kebabCase
export function toKebabCase(s: string): string {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function setRange(node: Node, offset: number): Range {
    const sel = document.getSelection();
    sel.removeAllRanges();
    const range = document.createRange();
    range.setStart(node, offset);
    sel.addRange(range);
    return range;
}

// Cross-compatible cloneNode, issue fixed:
// - ie11's cloneNode remove empty textNode and merge sibling textNodes
function cloneNode(node: Node): Node {
    const clone = node.nodeType === Node.TEXT_NODE ? document.createTextNode(node.nodeValue) : node.cloneNode(false);

    let child = node.firstChild;
    while (child) {
        clone.appendChild(cloneNode(child));
        child = child.nextSibling;
    }
    return clone;
}

function findClosestElementNode(node: Node): Node {
    let currentParent = node.parentNode;
    while (currentParent && (currentParent.nodeType !== Node.ELEMENT_NODE)) {
        currentParent = currentParent.parentNode;
    }
    return currentParent;
}

export function onPressEnter(e, range, editorInstance, editZone, textNodes) {
    editorInstance.addState(editZone.html());

    var parentContainer = range.startContainer;

    if (parentContainer !== editZone.get(0)) {
        if (isElementNodeWithName(parentContainer, 'TD') || isElementNodeWithName(parentContainer.parentNode, 'TD')) {
            return;
        }

        if (isElementNodeWithName(parentContainer, 'LI') || isElementNodeWithName(parentContainer.parentNode, 'LI')) {
            const editZoneElement = editZone.get(0);
            if (parentContainer.textContent.length === 0 && parentContainer !== editZoneElement) {
                let currentNode = parentContainer, rootListNode, itemListNode;
                do {
                    if (isElementNodeWithName(currentNode, 'LI') && !itemListNode) {
                        itemListNode = currentNode;
                    }
                    if (isElementNodeWithName(currentNode, 'UL') || isElementNodeWithName(currentNode, 'OL')) {
                        if (!rootListNode) {
                            rootListNode = currentNode;
                        } else {
                            return; // range is in a nested list
                        }
                    }
                } while ((currentNode = currentNode.parentNode) && currentNode !== editZoneElement);
                if (!itemListNode.nextSibling) {
                    let nextElement = document.createElement('div');
                    nextElement.appendChild(document.createTextNode('\u200b'));
                    rootListNode.parentNode.insertBefore(nextElement, rootListNode.nextSibling);
                    rootListNode.removeChild(rootListNode.lastChild);

                    setRange(nextElement.firstChild, nextElement.textContent.length);
                    e.preventDefault();
                }
            }
            return;
        }
    }

    var blockContainer = parentContainer;
    while (blockContainer.nodeType !== Node.ELEMENT_NODE || textNodes.indexOf(blockContainer.nodeName) !== -1) {
        blockContainer = blockContainer.parentNode;
    }
    if (parentContainer === editZone[0]) {
        var wrapper = $('<div></div>');
        $(editZone[0]).append(wrapper);
        wrapper.html('&#8203;');
        blockContainer = wrapper[0];
        parentContainer = wrapper[0];
        range = setRange(parentContainer, 1);
    }
    if (blockContainer === editZone[0]) {
        let startOffset = range.startOffset;
        let wrapper = $('<div></div>');

        while (editZone[0].childNodes.length) {
            $(wrapper).append(editZone[0].childNodes[0]);
        }
        $(blockContainer).append(wrapper);
        blockContainer = wrapper[0];
        range = setRange(parentContainer, startOffset);
    }

    e.preventDefault();

    const clone = cloneNode(blockContainer);
    const endOffset = range.endOffset;

    // remove everything after range start
    if (parentContainer.nodeType === Node.TEXT_NODE) {
        parentContainer.textContent = parentContainer.textContent.substring(0, range.startOffset);
        if(parentContainer.textContent.length === 0) {
            const parentBlock = findClosestBlockElement(parentContainer, editZone.get(0));
            if(!parentBlock || parentBlock.textContent.length === 0) {
                parentContainer.textContent = '\u200b';
            }
        }
    }
    let currentAncestorNode = parentContainer, currentNode, path = [];
    while (currentAncestorNode !== blockContainer) {
        currentNode = currentAncestorNode;
        while (currentNode = currentAncestorNode.nextSibling) {
            currentAncestorNode.parentNode.removeChild(currentNode);
        }
        currentNode = currentAncestorNode;
        let i = 0;
        while (currentNode = currentNode.previousSibling) {
            i++;
        }
        path.push(i);
        currentAncestorNode = currentAncestorNode.parentNode;
    }

    // remove everything before range end
    currentNode = clone;
    while (path.length) {
        const pos = path.pop();
        for (let i = 0; i < pos; i++) {
            currentNode.removeChild(currentNode.firstChild);
        }
        currentNode = currentNode.firstChild;
    }
    let startOffset;
    if (currentNode.nodeType === Node.TEXT_NODE) {
        if (endOffset === currentNode.textContent.length) {
            currentNode.textContent = '\u200b';
            startOffset = currentNode.textContent.length;
        } else {
            currentNode.textContent = currentNode.textContent.substring(endOffset, currentNode.textContent.length);
            startOffset = 0;
        }
    }

    let parentElementNode = currentNode;
    while (parentElementNode = findClosestElementNode(parentElementNode)) {
        if (isElementNodeWithName(parentElementNode, "A")) {
            const spanElement = document.createElement('span');
            for (let child of parentElementNode.childNodes) {
                spanElement.appendChild(child);
            }
            parentElementNode.parentNode.insertBefore(spanElement, parentElementNode.nextSibling);
            parentElementNode.parentNode.removeChild(parentElementNode);
        }
    }
    blockContainer.parentNode.insertBefore(clone, blockContainer.nextSibling);

    if (currentNode.nodeType !== Node.TEXT_NODE) {
        let firstTextNode = findFirstChildTextNode(currentNode);
        if (!firstTextNode) {
            firstTextNode = document.createTextNode('\u200b');
            currentNode.insertBefore(currentNode.firstChild, firstTextNode);
            startOffset = currentNode.textContent.length;
        } else {
            startOffset = firstTextNode.textContent.charAt(0) === '\u200b' ? 1 : 0;
        }
        currentNode = firstTextNode;
    }

    setRange(currentNode, startOffset);
}
