import { $ } from '../libs/jquery/jquery';

export const textNodes = ['SPAN', 'A', 'STRONG', 'EM', 'B', 'I', 'I18N'];
export const formatNodes = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
const blockNodes = ['DIV', 'UL', 'OL', 'LI'];
blockNodes.push(...formatNodes);

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

// Cross-compatible css, some browsers leave the style attribute empty
function css(node: HTMLElement, applyProperties: any) {
    $(node).css(applyProperties);
    if (!node.style.cssText) {
        node.removeAttribute('style');
    }
}

export function isRangeMisplacedInList(range: Range): boolean {
    return range.startContainer === range.endContainer &&
        range.startContainer.nodeType === Node.TEXT_NODE &&
        (range.endContainer.parentNode.nodeName === 'UL' || range.endContainer.parentNode.nodeName === 'OL');
}

function removeEmptyChildTextNodes(node: Node) {
    const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
    let currentNode: Node;

    while (currentNode = tw.nextNode()) {
        if (currentNode.nodeType === Node.TEXT_NODE && currentNode.textContent === '') {
            currentNode.parentNode.removeChild(currentNode);
        }
    }
}

function isNodeInRange(node: Node, range: Range): boolean {
    let positionComparedWithRangeStart = node.compareDocumentPosition(range.startContainer);
    let positionComparedWithRangeEnd = node.compareDocumentPosition(range.endContainer);

    return !(isBeforeComparedNode(positionComparedWithRangeStart) || isAfterComparedNode(positionComparedWithRangeEnd));
}

function tryToRemoveOrMergeTextElementOutOfRange(currentNode: Node, ranges: Array<Range>): Node {
    if (!isHTMLBlockElement(currentNode)) {
        if (ranges.every(r => !isNodeInRange(currentNode, r))) {
            if (currentNode.textContent === '' || currentNode.textContent === '\u200b') {
                if (!(isHTMLBlockElement(currentNode.parentNode) && currentNode.parentNode.childNodes.length === 1) && containsOnlyTextNodes(currentNode)) {
                    currentNode.parentNode.removeChild(currentNode);
                }
            } else if (currentNode.previousSibling && ranges.every(r => !isNodeInRange(currentNode.previousSibling, r))) {
                const previousNode = currentNode.previousSibling;
                const currentNodeClone = currentNode.cloneNode(false);
                const previousNodeClone = previousNode.cloneNode(false);
                if (currentNodeClone.isEqualNode(previousNodeClone)) {
                    while (previousNode.lastChild) {
                        currentNode.insertBefore(previousNode.lastChild, currentNode.firstChild);
                    }
                    currentNode.parentNode.removeChild(previousNode);
                }
            }
        }
    }
    return currentNode;
}

function containsOnlyTextNodes(node: Node): boolean {
    return Array.from(node.childNodes).every(node => node.nodeType === Node.TEXT_NODE);
}

export function isHTMLElement(node: Node): node is HTMLElement {
    return node && node.nodeType === node.ELEMENT_NODE;
}

export function findClosestHTMLElement(node: Node): HTMLElement {
    let parentElement, currentParent = node;
    while ((currentParent = currentParent.parentNode) && !parentElement) {
        if (isHTMLElement(currentParent)) {
            parentElement = currentParent;
        }
    }
    return parentElement;
}

export function isHTMLBlockElement(node: Node): boolean {
    return node && isHTMLElement(node) && (blockNodes.indexOf(node.nodeName) >= 0);
}

export function hasStyleProperty(node: HTMLElement, styleProperty: string): boolean {
    return (typeof node.style[styleProperty] !== 'undefined') && node.style[styleProperty] !== '';
}

function findStyledParentNode(currentNode: Node, styleProperty: string): HTMLElement {
    let target;
    while ((currentNode = findClosestHTMLElement(currentNode)) && !isHTMLBlockElement(currentNode) && !target) {
        if (hasStyleProperty(currentNode as HTMLElement, styleProperty)) {
            target = currentNode;
        }
    }
    return target;
}

function separateTreeBranchAfterRange(root: Node, node: Node, offset: number): Node {
    let branch, leaf = cloneNode(node);
    if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.substring(0, offset);
        leaf.textContent = leaf.textContent.substring(offset, leaf.textContent.length);
    } else {
        const childNodesLength = node.childNodes.length;
        for (let i = offset; i < childNodesLength; i++) {
            leaf.appendChild(node.childNodes[i]);
        }
    }

    let currentAncestorNode = node, currentNode;
    while (currentAncestorNode !== root) {
        branch = currentAncestorNode.parentNode.cloneNode(false);

        currentNode = currentAncestorNode;
        branch.appendChild(leaf);
        while (currentNode = currentNode.nextSibling) {
            branch.appendChild(currentNode);
        }
        leaf = branch;
        currentAncestorNode = currentAncestorNode.parentNode;
    }

    return branch;
}

function separateTreeBranchBeforeRange(root: Node, node: Node, offset: number): Node {
    let branch, leaf = node.cloneNode();
    if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.substring(offset, node.textContent.length);
        leaf.textContent = leaf.textContent.substring(0, offset);
    } else {
        for (let i = 0; i < offset; i++) {
            leaf.appendChild(node.firstChild);
        }
    }

    let currentAncestorNode = node, currentNode;
    while (currentAncestorNode !== root) {
        branch = currentAncestorNode.parentNode.cloneNode(false);
        currentNode = currentAncestorNode;
        while (currentNode = currentNode.previousSibling) {
            branch.appendChild(currentNode);
        }
        branch.appendChild(leaf);
        leaf = branch;
        currentAncestorNode = currentAncestorNode.parentNode;
    }

    return branch;
}

function getNormalizedEndOffset(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.length;
    }
    return node.childNodes.length;
}

export function findFirstChildTextNode(node: Node): Node {
    return document.createNodeIterator(node, NodeFilter.SHOW_TEXT, null, false).nextNode();
}

export function findLatestChildTextNode(node: Node): Node {
    let lastNode, currentNode;
    const ni = document.createNodeIterator(node, NodeFilter.SHOW_TEXT, null, false);
    while (currentNode = ni.nextNode()) {
        lastNode = currentNode;
    }
    return lastNode;
}

function separateTreeBranchesAroundRange(root: Node, range: Range): Node {
    const startOffset = range.startOffset;
    const endOffset = range.endOffset - startOffset;
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;
    const branchBeforeRange = separateTreeBranchBeforeRange(root, startContainer, startOffset);
    const branchAfterRange = separateTreeBranchAfterRange(root, endContainer, endOffset);

    if (branchBeforeRange && branchBeforeRange.textContent.length > 0) {
        root.parentNode.insertBefore(branchBeforeRange, root);
    }
    if (branchAfterRange && branchAfterRange.textContent.length > 0) {
        root.parentNode.insertBefore(branchAfterRange, root.nextSibling);
    }
    if (startContainer.textContent.length === 0) {
        startContainer.textContent = '\u200b';
    }
    if (endContainer.textContent.length === 0) {
        endContainer.textContent = '\u200b';
    }
    const newStartContainer = findFirstChildTextNode(range.startContainer) || range.startContainer;
    const newEndContainer = findLatestChildTextNode(range.endContainer) || range.endContainer;
    range.setStart(newStartContainer, 0);
    range.setEnd(newEndContainer, getNormalizedEndOffset(newEndContainer));
    return root;
}

export function isBeforeComparedNode(bitmask: number): boolean {
    return ((bitmask & Node.DOCUMENT_POSITION_FOLLOWING) === Node.DOCUMENT_POSITION_FOLLOWING) && !(bitmask & Node.DOCUMENT_POSITION_CONTAINED_BY);
}

export function isAfterComparedNode(bitmask: number): boolean {
    return (bitmask & Node.DOCUMENT_POSITION_PRECEDING) === Node.DOCUMENT_POSITION_PRECEDING && !(bitmask & Node.DOCUMENT_POSITION_CONTAINS);
}

export function isParentOfComparedNode(bitmask: number): boolean {
    return (bitmask & Node.DOCUMENT_POSITION_CONTAINED_BY) === Node.DOCUMENT_POSITION_CONTAINED_BY;
}

export function explodeRangeOnChildNodes(range: Range, root: Node): Array<{ node: Node, range: Range }> {
    const childNodesAndRanges: Array<{ node: Node, range: Range }> = [];
    let child = root.firstChild;
    do {
        if (isNodeInRange(child, range)) {
            let positionComparedWithRangeStart = child.compareDocumentPosition(range.startContainer);
            let positionComparedWithRangeEnd = child.compareDocumentPosition(range.endContainer);
            let newRange = document.createRange();
            if (isParentOfComparedNode(positionComparedWithRangeStart) || child === range.startContainer) {
                newRange.setStart(range.startContainer, range.startOffset);
            } else {
                let startContainer = findFirstChildTextNode(child) || child;
                newRange.setStart(startContainer, 0)
            }
            if (isParentOfComparedNode(positionComparedWithRangeEnd) || child === range.endContainer) {
                newRange.setEnd(range.endContainer, range.endOffset);
            } else {
                let endContainer = findLatestChildTextNode(child) || child;
                const endOffset = getNormalizedEndOffset(endContainer);
                newRange.setEnd(endContainer, endOffset);
            }
            childNodesAndRanges.push({node: child, range: newRange});
        }
    } while (child = child.nextSibling);
    return childNodesAndRanges;
}

function applyCssToTextNode(node: Node, startOffset: number, endOffset: number, style: any): Node {
    const parent = node.parentNode;
    const span = document.createElement('span');
    const text = document.createTextNode(node.textContent.substring(startOffset, endOffset) || '\u200b');
    span.appendChild(text);
    const textBefore = document.createTextNode(node.textContent.substring(0, startOffset));
    const textAfter = document.createTextNode(node.textContent.substring(endOffset, node.textContent.length));
    css(span, style);
    parent.insertBefore(textBefore, node);
    parent.replaceChild(span, node);
    parent.insertBefore(textAfter, span.nextSibling);
    return text;
}

function cancelCssOnEveryChildNodes(root: Node, style: any): Node {
    const ni = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, null, false);
    const styleKeys = Object.keys(style);

    let currentNode: HTMLElement;
    while (currentNode = (ni.nextNode() as HTMLElement)) {
        if (currentNode != root) {
            styleKeys.forEach(key => currentNode.style.removeProperty(key));
        }
    }
    return root;
}

export function applyCssToRange(root: Node, range: Range, property: string, style: any): Range {
    if (range.startContainer === range.endContainer &&
        (range.startContainer === root || isHTMLBlockElement(range.startContainer))) {
        if (range.startContainer === root) {
            if (root.nodeType === Node.TEXT_NODE) {
                const styledTextNode = applyCssToTextNode(root, range.startOffset, range.endOffset, style);
                range.selectNodeContents(styledTextNode);
            } else {
                explodeRangeOnChildNodes(range, root)
                    .map((child) => applyCssToRange(child.node, child.range, property, style))
                    .forEach((childRange, index, array) => {
                        if (index === 0) {
                            range.setStart(childRange.startContainer, childRange.startOffset);
                        }
                        if (index === array.length - 1) {
                            range.setEnd(childRange.endContainer, childRange.endOffset);
                        }
                    });
            }
        } else if (isHTMLElement(range.startContainer) && isHTMLBlockElement(range.startContainer)) {
            css(range.startContainer, style);
            const firstTextNode = findFirstChildTextNode(range.startContainer);
            const latestTextNode = findLatestChildTextNode(range.startContainer);
            range.setStart(firstTextNode, 0);
            range.setStart(latestTextNode, latestTextNode.textContent.length);
            range.selectNodeContents(range.startContainer);
        }
    } else {
        let styledNode = findStyledParentNode(range.commonAncestorContainer, property);
        if (styledNode) {
            separateTreeBranchesAroundRange(styledNode, range);
            css(styledNode, style);
            cancelCssOnEveryChildNodes(styledNode, style)
        } else {
            if (range.startContainer === range.endContainer &&
                range.startContainer.nodeType === Node.TEXT_NODE &&
                isHTMLBlockElement(findClosestHTMLElement(range.startContainer))) {
                const container = range.startContainer;
                const styledTextNode = applyCssToTextNode(container, range.startOffset, range.endOffset, style);
                range.selectNodeContents(styledTextNode);
            } else {
                const container = isHTMLElement(range.commonAncestorContainer) ?
                    range.commonAncestorContainer : findClosestHTMLElement(range.commonAncestorContainer);
                if (!isHTMLBlockElement(container)) {
                    separateTreeBranchesAroundRange(container, range);
                    css(container, style);
                    cancelCssOnEveryChildNodes(container, style);
                } else {
                    explodeRangeOnChildNodes(range, container)
                        .map((child) => applyCssToRange(child.node, child.range, property, style))
                        .forEach((childRange, i, arr) => {
                            if (i === 0) {
                                range.setStart(childRange.startContainer, childRange.startOffset);
                            }
                            if (i === arr.length - 1) {
                                range.setEnd(childRange.endContainer, childRange.endOffset);
                            }
                        });
                }
            }
        }
    }
    return range;
}

export const Selection = function(data){
    var that = this;
    this.selectedElements = [];
    this.nextRanges = [];

    this.applyNextRanges = function(){
        let selection = window.getSelection();
        selection.removeAllRanges();
        if(selection.rangeCount > 1){
            this.nextRanges.forEach(function(range){
                selection.addRange(range);
            });
            that.instance.trigger('selectionchange', {
                selection: that.instance.selection
            });

            this.nextRanges = [];
        }
        else{
            selection.addRange(this.nextRanges[0]);
            that.instance.trigger('selectionchange', {
                selection: that.instance.selection
            });

            this.nextRanges = [];
        }
    };

    function getSelectedElements(){
        var selection = getSelection();
        if(!selection.rangeCount){
            return;
        }
        var range = selection.getRangeAt(0);
        var selector = [];
        if (that.editZone[0] === range.startContainer && that.editZone[0] === range.endContainer) {
            that.editZone.children().each(function (index, child) {
                selector.push(child);
            });
            return selector;
        }
        if (!(that.editZone.find(range.startContainer.parentNode).length && range.startContainer.parentNode !== that.editZone[0]) ||
            !that.editZone.find(range.endContainer.parentNode).length && range.endContainer.parentNode !== that.editZone[0]) {
            return;
        }

        if(range.startContainer === range.endContainer){
            if(range.startContainer.childNodes.length){
                for(var i = range.startOffset; i <= range.endOffset; i++){
                    selector.push(range.startContainer.childNodes[i]);
                }
            }
            else{
                if(range.startContainer !== that.editZone[0] && range.startOffset !== range.endOffset){
                    selector.push(range.startContainer);
                }
                else{
                    return [];
                }
            }
        }
        else {
            if (range.startOffset < range.startContainer.textContent.length) {
                selector.push(range.startContainer);
            }

            that.editZone.find('*').each(function (index, item) {
                if (((range.intersectsNode && range.intersectsNode(item)) || (!range.intersectsNode && $(range.commonAncestorContainer).find(item).length > 0))
                    && item !== range.startContainer.parentNode
                    && item !== range.endContainer.parentNode
                    && item !== range.endContainer
                    && !$(item).find(range.startContainer.parentNode).length
                    && !$(item).find(range.endContainer.parentNode).length) {
                    selector.push(item);
                }
            });

            if (range.endContainer !== that.editZone[0] && range.endOffset > 0 && $(range.endContainer).find(range.startContainer).length === 0) {
                selector.push(range.endContainer);
            }
        }

        return selector;
    }

    this.changed = function(){
        var selection = getSelection();
        if(selection.rangeCount === 0){
            return;
        }
        var range = selection.getRangeAt(0);

        var same = this.range &&
        this.range.startContainer === range.startContainer &&
        this.range.startOffset === range.startOffset &&
        this.range.endContainer === range.endContainer &&
        range.endOffset === this.range.endOffset &&
        selection.rangeCount === this.rangeCount;
        same = same || (this.editZone.find(range.startContainer).length === 0 && this.editZone[0] !== range.startContainer);
        var selectedElements = getSelectedElements();

        if(!same && selectedElements){
            this.selectedElements = selectedElements || this.selectedElements;
        }
        if (!same && this.editZone.is(':focus')) {
            this.range = range;
            this.rangeCount = selection.rangeCount;
        }
        return !same;
    };

    this.selectedElements = getSelectedElements() || this.selectedElements;

    this.moveCaret = function(element, offset){
        if(!offset){
            offset = 0;
        }

        var range = document.createRange();
        range.setStart(element.firstChild || element, offset);
        this.range = range;

        var sel = getSelection();
        this.rangeCount = sel.rangeCount;
        this.selectedElements = [];
        sel.removeAllRanges();
        sel.addRange(range);
    };

    this.selectNode = function(element, start, end){
        var range = document.createRange();
        var sel = getSelection();

        if(!(element.textContent) && !(element.nodeName && element.nodeName === 'IMG')){
            return;
        }
        if(!start){
            start = 0;
        }
        if (!end && element.textContent) {
            end = (element.firstChild || element).textContent.length;
        }

        if (element.nodeType === 1) {
            range.selectNode(element);
        } else {
            range.setStart(element.firstChild || element, start);
            range.setEnd(element.firstChild || element, end);
        }

        this.selectedElements = [element.firstChild || element];
        this.range = range;

        sel.removeAllRanges();
        sel.addRange(range);
        this.rangeCount = 1;
    };

    this.wrap = function(element){
        that.instance.addState(that.editZone.html());
        var commonAncestor = that.range.commonAncestorContainer;
        var startOffset = that.range.startOffset;
        var endOffset = that.range.endOffset;

        var elementAtCaret = commonAncestor;
        if (
            elementAtCaret.nodeType === 1
            && (elementAtCaret.getAttribute('contenteditable') || elementAtCaret.nodeName === 'TD')
        ) {
            var wrapper = $('<div>&#8203;</div>');
            $(elementAtCaret).append(wrapper);
            elementAtCaret = wrapper[0];
        }
        if (elementAtCaret.parentNode.nodeName === 'TD') {
            var wrapper = $('<div>&#8203;</div>');
            $(elementAtCaret.parentNode).append(wrapper);
            wrapper.append(elementAtCaret);
        }

        if(
            this.isCursor() || commonAncestor.nodeType === 3 || textNodes.indexOf(commonAncestor.nodeName) !== -1
        ){
            element.html('&#8203;');

            while (textNodes.indexOf(elementAtCaret.nodeName) !== -1 || elementAtCaret.nodeType === 3) {
                if (elementAtCaret.parentNode.nodeType === 1 && elementAtCaret.parentNode.getAttribute('contenteditable') || elementAtCaret.parentNode.nodeName === 'TD') {
                    var newEl = document.createElement('div');
                    if(elementAtCaret.nodeType === 1){
                        $(newEl).html($(elementAtCaret).html());
                    }
                    else{
                        $(newEl).text(elementAtCaret.textContent);
                    }

                    elementAtCaret.parentNode.insertBefore(newEl, elementAtCaret);
                    elementAtCaret.parentNode.removeChild(elementAtCaret);
                    elementAtCaret = newEl;
                }
                else{
                    elementAtCaret = elementAtCaret.parentNode;
                }
            }

            element.html($(elementAtCaret).html());
            elementAtCaret.parentNode.insertBefore(element[0], elementAtCaret);
            elementAtCaret.parentNode.removeChild(elementAtCaret);

            var sel = window.getSelection();
            var r = document.createRange();
            r.setStart(element[0].firstChild, startOffset);
            r.setEnd(element[0].firstChild, endOffset);
            sel.removeAllRanges();
            sel.addRange(r);
        }
        else {
            if (formatNodes.indexOf(elementAtCaret.nodeName) !== -1) {
                element.html($(elementAtCaret).html());
                elementAtCaret.parentNode.insertBefore(element[0], elementAtCaret);
                elementAtCaret.parentNode.removeChild(elementAtCaret);
                var sel = window.getSelection();
                var r = document.createRange();
                r.setStart(element[0], 0);
                var endOffset = element[0].textContent.length;
                if(element[0].childNodes.length){
                    endOffset = element[0].childNodes.length;
                }
                r.setEnd(element[0], endOffset);
                sel.removeAllRanges();
                sel.addRange(r);
            }
            else {
                var foundFirst = false;
                var foundLast = false;
                for (var i = 0; i < elementAtCaret.childNodes.length; i++) {
                    var item = elementAtCaret.childNodes[i];
                    if (item === this.range.startContainer ||
                        (this.range.startContainer.nodeType === 1 && $(this.range.startContainer).find(item).length) ||
                        (item.nodeType === 1 && $(item).find(this.range.startContainer).length)) {
                        foundFirst = true;
                    }
                    if (item === this.range.endContainer ||
                        (this.range.endContainer.nodeType === 1 && $(this.range.endContainer).find(item).length) ||
                        (item.nodeType === 1 && $(item).find(this.range.endContainer).length)) {
                        foundLast = true;
                        if (this.range.endOffset === 0) {
                            break;
                        }
                    }
                    if (!foundFirst) {
                        continue;
                    }
                    var el = $(element[0].outerHTML);
                    while (textNodes.indexOf(item.nodeName) !== -1 || item.nodeType === 3) {
                        item = item.parentNode;
                    }
                    if(!item.parentNode){
                        continue;
                    }

                    el.html(item.innerHTML || item.textContent);
                    item.parentNode.insertBefore(el[0], item);
                    item.parentNode.removeChild(item);
                    var sel = window.getSelection();
                    var r = document.createRange();
                    r.setStart(el[0], 0);
                    var endOffset = el[0].textContent.length;
                    if(el[0].childNodes.length){
                        endOffset = el[0].childNodes.length;
                    }
                    r.setEnd(el[0], endOffset);
                    sel.removeAllRanges();
                    sel.addRange(r);
                    if (foundLast) {
                        break;
                    }
                }
            }
        }
        that.instance.addState(that.editZone.html());
        setTimeout(function () {
            this.instance.trigger('selectionchange', { selection: this.instance.selection });
            this.instance.trigger('change');
        }.bind(this), 100);
    };

    this.isCursor = function () {
        let sel = window.getSelection();
        if(sel.rangeCount > 0 && this.instance.editZone.find(sel.getRangeAt(0).startContainer).length > 0){
            this.rangeCount = sel.rangeCount;
            this.range = sel.getRangeAt(0);
        }

        return (this.rangeCount === 1 || this.rangeCount === 0) &&
        this.range.startContainer === this.range.endContainer &&
        this.range.startOffset === this.range.endOffset;
    }

    let wrapTextOnNode = function(element, node, last){
        if(!node){
            node = this.range.commonAncestorContainer;
        }
        if(node.nodeType === 3){
            let start = 0;
            if(node === this.range.startContainer){
                start = this.range.startOffset;
            }
            let textNode = document.createTextNode(node.textContent.substring(start));
            if(node === this.range.endContainer){
                textNode = document.createTextNode(node.textContent.substring(start, this.range.endOffset));
                let nextText = document.createTextNode(node.textContent.substring(this.range.endOffset));
                node.parentNode.insertBefore(nextText, node.nextSibling);
            }
            element.append(textNode);

            node.textContent = node.textContent.substring(0, start);
        }

        let foundFirst = false;
        if(last){
            foundFirst = true;
        }
        let nodes = [];
        for(let i = 0; i < node.childNodes.length; i++){
            let child = node.childNodes[i];
            nodes.push(child);
        }

        for(let i = 0; i < nodes.length; i++){
            let child = nodes[i];

            if(child === this.range.startContainer){
                foundFirst = true;
                if(this.range.startOffset === 0){
                    element.append(child);
                }
                if(child.nodeType === 1){
                    let last = child.childNodes.length;
                    if(this.range.startContainer === this.range.endContainer){
                        last = this.range.endOffset;
                    }

                    for(let i = this.range.startOffset; i < last; i++){
                        element.append(child.childNodes[i]);
                    }
                }
                else{
                    let textNode;
                    if(this.range.startContainer === this.range.endContainer){
                        textNode = document.createTextNode(child.textContent.substring(this.range.startOffset, this.range.endOffset));

                        let nextText = document.createTextNode(child.textContent.substring(this.range.endOffset));
                        child.parentNode.insertBefore(nextText, child.nextSibling);
                        child.textContent = child.textContent.substring(0, this.range.startOffset);
                    }
                    else{
                        textNode = document.createTextNode(child.textContent.substring(this.range.startOffset));
                        child.textContent = child.textContent.substring(0, this.range.startOffset);
                    }
                    element.append(textNode);
                }

                continue;
            }

            if(child.contains(this.range.startContainer)){
                let container = document.createElement(child.nodeName);
                $(container).attr('style', $(child).attr('style'));
                element.append(container);
                wrapTextOnNode(container, child);
                foundFirst = true;
                continue;
            }

            if(!foundFirst){
                continue;
            }

            if(child === this.range.endContainer){
                if(child.nodeType === 1){
                    let last = this.range.endOffset;
                    for(let i = this.range.startOffset; i < last; i++){
                        element.append(child.childNodes[i]);
                    }
                }
                else{
                    let textNode = document.createTextNode(child.textContent.substring(0, this.range.endOffset));
                    child.textContent = child.textContent.substring(this.range.endOffset);

                    element.append(textNode);
                }

                break;
            }

            if(child.contains(this.range.endContainer)){
                let container = document.createElement(child.nodeName);
                $(container).attr('style', $(child).attr('style'));
                element.append(container);
                wrapTextOnNode(container, child, true);
                break;
            }

            element.append(child);
        }
    }.bind(this);

    this.wrapText = function(el){
        this.instance.addState(this.editZone.html());
        if(this.isCursor()){
            el.html('<br />');
            this.editZone.append(el);
            this.selectNode(el[0]);
        }
        else if(
            this.range.startContainer === this.range.commonAncestorContainer &&
            this.range.startContainer === this.range.endContainer &&
            this.range.startContainer.nodeType === 1
        ){
            let container = this.range.startContainer;
            if(this.instance.editZone[0] === this.range.startContainer){
                let newEl = document.createElement('div');

                while (this.instance.editZone[0].childNodes.length) {
                    $(newEl).append(this.instance.editZone[0].childNodes[0]);
                }
                this.instance.editZone.append(newEl);
                container = newEl;
            }
            while(container.childNodes.length === 1){
                container = container.firstChild;
            }
            container.parentNode.insertBefore(el[0], container);
            el.append(container);

        }
        else{
            wrapTextOnNode(el);
            this.range.startContainer.parentNode.insertBefore(el[0], this.range.startContainer.nextSibling);
        }


        this.instance.trigger('change');
        this.selectNode(el[0]);
    };

    this.isEmpty = function () {
        return !this.range || this.isCursor();
    };

    this.elementAtCaret = function () {
        if (!this.range || !this.editZone.is(':focus')) {
            return $();
        }
        var element = this.range.startContainer;
        if (element.nodeType !== 1) {
            element = element.parentNode;
        }
        return $(element);
    };

    this.moveRanges = function(mover, container, offset, newContainer){
        let selection = window.getSelection();
        this.ranges.forEach(function(range){
            if(range === mover){
                return;
            }
            if(range.startContainer === container){
                range.startOffset += offset;
                if(newContainer){
                    range.startContainer = newContainer;
                }
            }
            if(range.endContainer === container){
                range.endOffset += offset;
                if(newContainer){
                    range.endContainer = newContainer;
                }
            }
        });
    };

    this.css = function(params){
        if(typeof params === 'object'){
            let selection = window.getSelection();
            if(!this.instance.editZone.is(':focus')){
                this.instance.editZone[0].focus();
                let range = selection.getRangeAt(0);
                this.range = range;
                this.rangeCount = 1;
            }
            if(!this.instance.editZone.html()){
                const block = document.createElement('div');
                const child = document.createElement('span');
                child.appendChild(document.createTextNode('\u200b'));
                block.appendChild(child);
                $(child).css(params);
                this.instance.editZone.append(block);
                const newRange = document.createRange();
                newRange.setStart(child.firstChild, 0);
                newRange.setEnd(child.firstChild, child.textContent.length);
                selection.removeAllRanges();
                selection.addRange(newRange);
            } else {
                this.ranges = [];
                for(let i = 0; i < selection.rangeCount; i++){
                    let range = selection.getRangeAt(i);
                    this.ranges.push(range);
                }
                this.ranges
                    .filter(r => isRangeMisplacedInList(r))
                    .forEach(r => {
                        const targetedNode = findLatestChildTextNode(r.endContainer.previousSibling);
                        r.setStart(targetedNode, getNormalizedEndOffset(targetedNode));
                        r.setEnd(targetedNode, getNormalizedEndOffset(targetedNode));
                    });
                this.ranges
                    .forEach(range => applyCssToRange(this.instance.editZone.get(0), range, Object.keys(params)[0], params));
                selection.removeAllRanges();
                this.ranges.forEach(r => selection.addRange(r));
            }

            //cleanup
            that.editZone.find('span').each(function(index, item){
                if(item.childNodes.length > 1){
                    let child = item.firstChild;
                    while(child !== null){
                        let nextChild = child.nextSibling;
                        if(child.nodeType === 3 && child.textContent === ""){
                            child.parentNode.removeChild(child);
                        }
                        child = nextChild;
                    }
                }
                if(item.childNodes.length === 1 && item.childNodes[0].nodeType === 1 && item.childNodes[0].nodeName === 'SPAN'){
                    for(let i = 0; i < item.childNodes[0].style.length; i++){
                        let prop = item.childNodes[0].style[i];
                        let val = $(item.childNodes[0]).css(prop);
                        if(prop === 'text-decoration'){
                            val = val.split(' ')[0];
                        }
                        if(prop === 'text-decoration-style' || prop === 'text-decoration-color'){
                            continue;
                        }
                        if(prop === 'text-decoration-line'){
                            prop = 'text-decoration';
                        }
                        $(item).css(prop, $(item.childNodes[0]).css(prop));
                    }
                    let sel = window.getSelection();
                    let newRanges = [];
                    for(let i = 0; i < sel.rangeCount; i++){
                        let range = {
                            startContainer: sel.getRangeAt(i).startContainer,
                            endContainer: sel.getRangeAt(i).endContainer,
                            startOffset: sel.getRangeAt(i).startOffset,
                            endOffset: sel.getRangeAt(i).endOffset
                        };

                        if(range.startContainer === item.childNodes[0]){
                            if(range.startContainer.nodeType === 1 && item.nodeType === 3 && range.startOffset === 1){
                                range.startOffset = item.textContent.length;
                            }
                            range.startContainer = item;
                        }
                        if(range.endContainer === item.childNodes[0]){
                            if(range.endContainer.nodeType === 1 && item.nodeType === 3 && range.endOffset === 1){
                                range.endOffset = item.textContent.length;
                            }
                            range.endContainer = item;
                        }
                        newRanges.push(range);
                    }

                    while(item.childNodes[0].childNodes.length){
                        $(item).append(item.childNodes[0].childNodes[0]);
                    }
                    item.removeChild(item.childNodes[0]);

                    sel.removeAllRanges();
                    newRanges.forEach(function(rangeDef){
                        let range = document.createRange();
                        range.setStart(rangeDef.startContainer, rangeDef.startOffset);
                        range.setEnd(rangeDef.endContainer, rangeDef.endOffset);
                        sel.addRange(range);
                    });
                }
                /* Remove items which :
                 * - have no text node
                 * - have a parent node which is not a "block" element (div, ul, ol, li, p...) with only 1 child
                 * - have no child nodes (<span> sometimes have images (smileys) and are not considered a "block" element)
                 */
                if (    item.textContent === "" 
                        && item.childNodes.length === 0
                        && !(isHTMLBlockElement(item.parentNode) && item.parentNode.childNodes.length === 1)
                    ) {
                    $(item).remove();
                }
            });

            removeEmptyChildTextNodes(that.editZone.get(0));
            let ranges = [];
            for (let i = 0; i < window.getSelection().rangeCount; i++) {
                ranges.push(window.getSelection().getRangeAt(i));
            }
            that.editZone.find('span').each((i, span) => tryToRemoveOrMergeTextElementOutOfRange(span, ranges));
            that.instance.addState(that.editZone.html());
            that.instance.trigger('contentupdated');
        }
        else {
            if (!this.range) {
                return;
            }
            var node = this.range.commonAncestorContainer;
            if (node.nodeType === 1) {
                return $(node).css(params);
            }
            else {
                return $(node.parentNode).css(params);
            }
        }
    };

    this.replaceHTML = function(htmlContent){
        that.instance.addState(that.editZone.html());
        var wrapper = $('<div></div>');
        wrapper.html(htmlContent + '&#8203;');
        if (this.range) {
            this.range.deleteContents();
            this.range.insertNode(wrapper[0]);
        }
        else{
            this.editZone.append(wrapper);
        }

        that.instance.trigger('change');
    };

    this.replaceHTMLInline = function (htmlContent) {
        if(this.range && this.range.startContainer === this.editZone[0] && this.range.endContainer === this.editZone[0]){
            const newDiv = $('<div>&#8203;</div>');
            newDiv.html(this.editZone.html());
            this.editZone.html('');
            this.editZone.append(newDiv);
            let sel = window.getSelection();
            let range = document.createRange();
            range.setStart(newDiv[0], 0);
            sel.removeAllRanges();
            sel.addRange(range);
            this.range = range;
        }
        that.instance.addState(that.editZone.html());
        let wrapper = $('<span></span>');
        wrapper.html(htmlContent);
        if (this.range) {
            this.range.deleteContents();
            this.range.insertNode(wrapper[0]);
        }
        else {
            this.editZone.append(htmlContent);
            let sel = window.getSelection();
            let range = document.createRange();
            range.setStart(wrapper[0], wrapper[0].childNodes.length);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        that.instance.trigger('change');
    };

    this.$ = function(){
        var jSelector = $();
        this.selectedElements.forEach(function(item){
            if(!item){
                return;
            }
            if(item.nodeType === 1){
                jSelector = jSelector.add(item);
            }
            else{
                jSelector = jSelector.add(item.parentNode);
            }

        });
        return jSelector;
    };
};
