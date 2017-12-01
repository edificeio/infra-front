import { $ } from "../libs/jquery/jquery";

export function onPressEnter(e, editorInstance, editZone, textNodes){
    editorInstance.addState(editZone.html());
    
    var parentContainer = range.startContainer;

    if (
            (parentContainer.nodeType === 1 && parentContainer.nodeName === 'LI') ||
            (parentContainer.parentNode.nodeType === 1 && parentContainer.parentNode.nodeName === 'LI') ||
            (parentContainer.nodeType === 1 && parentContainer.nodeName === 'TD') ||
            (parentContainer.parentNode.nodeType === 1 && parentContainer.parentNode.nodeName === 'TD')
        ) {
        return;
    }

    var blockContainer = parentContainer;
    while (blockContainer.nodeType !== 1 || textNodes.indexOf(blockContainer.nodeName) !== -1) {
        blockContainer = blockContainer.parentNode;
    }
    if (parentContainer === editZone[0]) {
        var wrapper = $('<div></div>');
        $(editZone[0]).append(wrapper);
        wrapper.html('&#8203;');
        blockContainer = wrapper[0];
        parentContainer = wrapper[0];
    }
    if (blockContainer === editZone[0]) {
        var startOffset = range.startOffset;
        var wrapper = $('<div></div>');
        
        while (editZone[0].childNodes.length) {
            $(wrapper).append(editZone[0].childNodes[0]);
        }
        $(blockContainer).append(wrapper);
        blockContainer = wrapper[0];
        var sel = document.getSelection();
        var r = document.createRange();
        r.setStart(parentContainer, startOffset);
        sel.removeAllRanges();
        sel.addRange(r);
        range = r;
    }
    var newNodeName = 'div';
    if ((parentContainer.nodeType === 1 && range.startOffset < parentContainer.childNodes.length)
        || (parentContainer.nodeType === 3 && range.startOffset < parentContainer.textContent.length)) {
        newNodeName = blockContainer.nodeName.toLowerCase();
    }
    var newLine = $('<' + newNodeName + '>&#8203;</' + newNodeName + '>');

    blockContainer.parentNode.insertBefore(newLine[0], blockContainer.nextSibling);

    newLine.attr('style', $(blockContainer).attr('style'));
    newLine.attr('class', $(blockContainer).attr('class'));
    
    e.preventDefault();
    var rangeStart = 1;
    if(parentContainer.nodeType === 3){
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
        if (nodeCursor.nodeType === 1) {
            let nodeName = nodeCursor.nodeName.toLowerCase();
            if(nodeName === 'a'){
                nodeName = 'span';
            }
            cursorClone = document.createElement(nodeName);
            $(cursorClone).attr('class', $(nodeCursor).attr('class'));
            for(let prop in nodeCursor.style){
                if(cursorClone.style[prop] !== nodeCursor.style[prop]){
                    cursorClone.style[prop] = nodeCursor.style[prop];
                }
            }
            
            $(cursorClone).append(newLine[0].firstChild);
            newLine.prepend(cursorClone);
        }
                
        var sibling = nodeCursor.nextSibling;
        while (sibling !== null) {
            //order matters here. appending sibling before getting nextsibling breaks the loop
            var currentSibling = sibling;
            sibling = sibling.nextSibling;
            if(currentSibling.nodeType === 3){
                let newNode = document.createElement('span');
                
                for(let prop in currentSibling.parentElement.style){
                    if(newNode.style[prop] !== currentSibling.parentElement.style[prop]){
                        newNode.style[prop] = currentSibling.parentElement.style[prop];
                    }
                }
                newNode.appendChild(currentSibling);
                currentSibling = newNode;
            }
            newLine.append(currentSibling);
        }

        nodeCursor = nodeCursor.parentNode as HTMLElement;
    }

    if (!(parentContainer as any).wholeText && parentContainer.nodeType === 3) {
        // FF forces encode on textContent, this is a hack to get the actual entities codes,
        // since innerHTML doesn't exist on text nodes
        parentContainer.textContent = $('<div>&#8203;</div>')[0].textContent;
    }

    var range = document.createRange();
    var newStartContainer = newLine[0];
    while(newStartContainer.firstChild){
        newStartContainer = newStartContainer.firstChild;
    }
    range.setStart(newStartContainer, rangeStart);

    sel.removeAllRanges();
    sel.addRange(range);
}