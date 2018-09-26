import { $ } from "../libs/jquery/jquery";

function isElementNode(node: Node): node is HTMLElement {
    return node.nodeType === Node.ELEMENT_NODE;
}

export function isElementNodeWithName(node: Node, nodeName: string): boolean {
    return isElementNode(node) && node.nodeName === nodeName;
}

export function toKebabCase(s: string): string {
    return s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function copyStyle(dest: HTMLElement, src: HTMLElement) {
    for (const camelCasedProperty in src.style) {
        const property = toKebabCase(camelCasedProperty);
        if (dest.style.getPropertyValue(property) !== src.style.getPropertyValue(property) ||
            dest.style.getPropertyPriority(property) !== src.style.getPropertyPriority(property)) {
            dest.style.setProperty(property,
                src.style.getPropertyValue(property),
                src.style.getPropertyPriority(property)
            );
        }
    }
}

export function onPressEnter(e, range, editorInstance, editZone, textNodes){
    editorInstance.addState(editZone.html());
    
    var parentContainer = range.startContainer;

    if(parentContainer !== editZone.get(0)) {
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

                    const sel = document.getSelection();
                    sel.removeAllRanges();
                    const range = document.createRange();
                    range.setStart(nextElement.firstChild, nextElement.textContent.length);
                    sel.addRange(range);
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
        let r = document.createRange();
        r.setStart(parentContainer, 1);
        replaceSelection(r);
        range = r;
    }
    if (blockContainer === editZone[0]) {
        let startOffset = range.startOffset;
        let wrapper = $('<div></div>');
        
        while (editZone[0].childNodes.length) {
            $(wrapper).append(editZone[0].childNodes[0]);
        }
        $(blockContainer).append(wrapper);
        blockContainer = wrapper[0];
        let r = document.createRange();
        r.setStart(parentContainer, startOffset);
        replaceSelection(r);
        range = r;
    }
    var newNodeName = 'div';
    if ((parentContainer.nodeType === Node.ELEMENT_NODE && range.startOffset < parentContainer.childNodes.length)
        || (parentContainer.nodeType === Node.TEXT_NODE && range.startOffset < parentContainer.textContent.length)) {
        newNodeName = blockContainer.nodeName.toLowerCase();
    }
    var newLine = $('<' + newNodeName + '>&#8203;</' + newNodeName + '>');

    blockContainer.parentNode.insertBefore(newLine[0], blockContainer.nextSibling);

    newLine.attr('style', $(blockContainer).attr('style'));
    newLine.attr('class', $(blockContainer).attr('class'));
    
    e.preventDefault();
    var rangeStart = 1;
    if(parentContainer.nodeType === Node.TEXT_NODE){
        var content = parentContainer.textContent.substring(range.startOffset, parentContainer.textContent.length);
        if(!content){
            content = '&#8203;';
        }
        else {
            rangeStart = 0;
        }
        newLine.html(content);
        parentContainer.textContent = parentContainer.textContent.substring(0, range.startOffset);
    }
    else{
        while(parentContainer.childNodes.length > range.startOffset){
            newLine.append(parentContainer.childNodes[range.startOffset]);
        }
    }

    var nodeCursor = parentContainer as HTMLElement;
    while (nodeCursor !== blockContainer) {
        var cursorClone;
        if (nodeCursor.nodeType === Node.ELEMENT_NODE) {
            let nodeName = nodeCursor.nodeName.toLowerCase();
            if(nodeName === 'a'){
                nodeName = 'span';
            }
            cursorClone = document.createElement(nodeName);
            $(cursorClone).attr('class', $(nodeCursor).attr('class'));
            copyStyle(cursorClone, nodeCursor);
            $(cursorClone).append(newLine[0].firstChild);
            newLine.prepend(cursorClone);
        }

        var sibling = nodeCursor.nextSibling;
        while (sibling !== null) {
            //order matters here. appending sibling before getting nextsibling breaks the loop
            var currentSibling = sibling;
            sibling = sibling.nextSibling;
            if(currentSibling.nodeType === Node.TEXT_NODE){
                let newNode = document.createElement('span');
                let currentSiblingParentElement = currentSibling.parentNode;

                while(currentSiblingParentElement && (currentSiblingParentElement.nodeType !== Node.ELEMENT_NODE)) {
                    currentSiblingParentElement = currentSiblingParentElement.parentNode;
                }

                if (isElementNode(currentSiblingParentElement)) {
                    copyStyle(newNode, currentSiblingParentElement);
                }
                newNode.appendChild(currentSibling);
                currentSibling = newNode;
            }
            newLine.append(currentSibling);
        }

        nodeCursor = nodeCursor.parentNode as HTMLElement;
    }

    if (!(parentContainer as any).wholeText && parentContainer.nodeType === Node.TEXT_NODE) {
        // FF forces encode on textContent, this is a hack to get the actual entities codes,
        // since innerHTML doesn't exist on text nodes
        parentContainer.textContent = $('<div>&#8203;</div>')[0].textContent;
    }

    let newRange = document.createRange();
    let newStartContainer = newLine[0];
    while(newStartContainer.firstChild){
        newStartContainer = newStartContainer.firstChild;
    }
    newRange.setStart(newStartContainer, rangeStart);
    replaceSelection(newRange);
}

function replaceSelection(range: Range): Range {
    const sel = document.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    return range;
}
