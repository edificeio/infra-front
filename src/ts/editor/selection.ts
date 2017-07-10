import { $ } from '../libs/jquery/jquery';

export const textNodes = ['SPAN', 'A', 'STRONG', 'EM', 'B', 'I', 'I18N'];
export const formatNodes = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

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
        var sel = getSelection();
        if(sel.rangeCount === 0){
            return;
        }
        var range = sel.getRangeAt(0);

        var same = this.range && 
        this.range.startContainer === range.startContainer && 
        this.range.startOffset === range.startOffset && 
        this.range.endContainer === range.endContainer && 
        range.endOffset === this.range.endOffset &&
        sel.rangeCount === this.rangeCount;
        same = same || (this.editZone.find(range.startContainer).length === 0 && this.editZone[0] !== range.startContainer);
        var selectedElements = getSelectedElements();

        if(!same && selectedElements){
            this.selectedElements = selectedElements || this.selectedElements;
        }
        if (!same && this.editZone.is(':focus')) {
            this.range = range;
            this.rangeCount = sel.rangeCount;
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
                    elementAtCaret.remove();
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
                elementAtCaret.remove();
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
                    item.remove();
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

    let wrapTextOnNode = function(el, node, last){
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
            el.append(textNode);
            
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
                    el.append(child);
                }
                if(child.nodeType === 1){
                    let last = child.childNodes.length;
                    if(this.range.startContainer === this.range.endContainer){
                        last = this.range.endOffset;
                    }

                    for(let i = this.range.startOffset; i < last; i++){
                        el.append(child.childNodes[i]);
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
                    el.append(textNode);
                }
                
                continue;
            }

            if(child.contains(this.range.startContainer)){
                let container = document.createElement(child.nodeName);
                $(container).attr('style', $(child).attr('style'));
                el.append(container);
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
                        el.append(child.childNodes[i]);
                    }
                }
                else{
                    let textNode = document.createTextNode(child.textContent.substring(0, this.range.endOffset));
                    child.textContent = child.textContent.substring(this.range.endOffset);

                    el.append(textNode);
                }

                break;
            }

            if(child.contains(this.range.endContainer)){
                let container = document.createElement(child.nodeName);
                $(container).attr('style', $(child).attr('style'));
                el.append(container);
                wrapTextOnNode(container, child, true);
                break;
            }

            el.append(child);
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

    function applyCSSCursor(css){
        var elementAtCaret;
        var el = $('<span>&#8203;</span>');
        if (!that.range && !that.editZone.html() || that.range.startContainer === that.editZone[0]) {
            if(that.editZone.children('div').length > 0){
                elementAtCaret = that.editZone.children('div')[0].firstChild;
            }
            else{
                elementAtCaret = $('<div>&#8203;</div>').appendTo(that.editZone)[0].firstChild;
            }
        }
        else {
            elementAtCaret = that.range.startContainer;
            if (elementAtCaret.nodeType === 1 && elementAtCaret.nodeName === 'SPAN') {
                el.attr('style', $(elementAtCaret).attr('style'));
            }
        }
        
        el.css(css);
        var nodeBefore = $('<span>' + elementAtCaret.textContent.substring(0, that.range.startOffset) + '</span>');
        var nodeAfter = $('<span>' + elementAtCaret.textContent.substring(that.range.startOffset) + '</span>');
        if (nodeAfter.text().length) {
            elementAtCaret.parentNode.insertBefore(nodeAfter[0], elementAtCaret);
            elementAtCaret.parentNode.insertBefore(el[0], nodeAfter[0]);
            elementAtCaret.parentNode.insertBefore(nodeBefore[0], el[0]);
            elementAtCaret.remove();
        }
        else {
            elementAtCaret.parentNode.insertBefore(el[0], elementAtCaret.nextSibling);
        }
        
        that.moveCaret(el[0], 1);
    }

    function applyCSSNode(css, range){
        var element = range.startContainer;
        if (element.nodeType !== 1 && element.parentNode.nodeName !== 'SPAN') {
            var el = document.createElement('span');
            el.textContent = element.textContent;
            element.parentNode.insertBefore(el, element.nextSibling);
            $(element).remove();
            element = el;
        }
        else {
            element = element.parentNode;
        }
        $(element).css(css);
        $(element).find('*').css(css);
        that.selectNode(element);
    }

    function applyCSSBetween(range, nodeStart, nodeEnd, css, keepRangeStart?, startOffset?) {
        let startSet = false;
        if (startOffset === undefined) {
            startOffset = range.startOffset;
        }
        var sibling = nodeStart;
        var i = startOffset;
        do {
            if (sibling.nodeType === 1) {
                let r;
                if(!keepRangeStart && !startSet){
                    r = document.createRange();
                    let newStartOffset = 0;
                    if(range.startContainer === sibling){
                        newStartOffset = startOffset;
                    }
                    
                    r.setStart(sibling, newStartOffset);
                    that.nextRanges.push(r);
                    startSet = true;
                }
                else{
                    r = that.nextRanges[that.nextRanges.length - 1];
                }
                r.setEnd(sibling, sibling.childNodes.length);
                if(range.endContainer === sibling){
                    r.setEnd(sibling, range.endOffset);
                }
                
                if($(sibling).find(range.endContainer).length){
                    applyCSSBetween(range, sibling.firstChild, range.endContainer, css, true, 0);
                    break;
                }
                else{
                    $(sibling).css(css);
                    $(sibling).find('*').each(function(index, item){
                        for(var i = 0; i < item.style.length; i++){
                            for(var prop in css){
                                item.style.removeProperty(prop);
                            }
                        }
                    });
                }
            }
            else {
                var el = $('<span></span>')
                    .css(css);
                if (sibling === nodeStart && sibling === nodeEnd) {
                    el.html(sibling.textContent.substring(startOffset, range.endOffset));
                    if (el.html().length > 0) {
                        sibling.parentNode.insertBefore(el[0], sibling);
                        let afterText = document.createTextNode(sibling.textContent.substring(range.endOffset));
                        sibling.parentNode.insertBefore(afterText, el[0].nextSibling);
                        sibling.textContent = sibling.textContent.substring(0, startOffset);
                        that.moveRanges(range, sibling, -(el.text().length), afterText);
                        var r = document.createRange();
                        if (keepRangeStart || startSet) {
                            r = that.nextRanges[that.nextRanges.length - 1];
                            r.setEnd(el[0], 1);
                        }
                        else {
                            startSet = true;
                            r.setStart(el[0], 0);
                            r.setEnd(el[0], 1);
                            that.nextRanges.push(r);
                        }
                    }
                }
                else if (
                    sibling === nodeEnd
                    || (sibling.parentNode === range.endContainer && sibling === range.endContainer.childNodes[range.endOffset])
                ) {
                    el.text(sibling.textContent.substring(0, range.endOffset));
                    if (el.text()) {
                        sibling.parentNode.insertBefore(el[0], sibling);
                        sibling.textContent = sibling.textContent.substring(range.endOffset);
                        range.endOffset = 0;
                        that.moveRanges(range, sibling, -(el.text().length + range.startOffset));
                        let r = that.nextRanges[that.nextRanges.length - 1];
                        r.setEnd(el[0], 1);
                    }
                }
                else if (sibling === nodeStart) {
                    el.text(sibling.textContent.substring(startOffset, sibling.textContent.length));
                    if(el.text()){
                        sibling.parentNode.insertBefore(el[0], sibling.nextSibling);
                        sibling.textContent = sibling.textContent.substring(0, startOffset);
                        if (!keepRangeStart && !startSet) {
                            let r = document.createRange();
                            r.setStart(el[0], 0);
                            r.setEnd(el[0], 1);
                            that.nextRanges.push(r);
                            startSet = true;
                        }
                        else{
                            let r = that.nextRanges[that.nextRanges.length - 1];
                            r.setEnd(el[0], 1);
                        }
                    }
                }
                else {
                    el.text(sibling.textContent.substring(0, sibling.textContent.length));
                    if (el.text()) {
                        sibling.parentNode.insertBefore(el[0], sibling);
                        sibling.textContent = sibling.textContent.substring(sibling.textContent.length);
                        that.moveRanges(range, sibling, -el.text().length);
                    }
                    
                }
            }
            if(sibling === nodeEnd || (sibling.parentNode === range.endContainer && sibling === range.endContainer.childNodes[range.endOffset])){
                break;
            }

            if(sibling !== nodeEnd){
                sibling = sibling.nextSibling;
            }
            
            i++;
        } while (sibling);
    }

    function applyCSSText(css, range){
        var el = $(document.createElement('span'));
        $(el).css(css);

        el.html(range.startContainer.textContent.substring(range.startOffset, range.endOffset));
        var textBefore = document.createTextNode('');
        textBefore.textContent = range.startContainer.textContent.substring(0, range.startOffset);
        range.startContainer.parentNode.insertBefore(el[0], range.startContainer);
        range.startContainer.parentNode.insertBefore(textBefore, el[0]);
        range.startContainer.textContent = range.startContainer.textContent.substring(range.endOffset);

        that.moveRanges(range, range.startContainer, -(el.text().length + range.startOffset));

        var r = document.createRange();
        r.setStart(el[0], 0);
        r.setEnd(el[0], 1);
        that.nextRanges.push(r);
    }

    function applyCSS(css, range) {
        that.instance.addState(that.editZone.html());

        if(that.isCursor()){
            applyCSSCursor(css);
            return;
        }
        
        if (range.startContainer === range.endContainer &&
            (
                range.startContainer.nodeType === 3 &&
                range.startOffset === 0 &&
                range.endOffset === range.startContainer.textContent.length
            )
        ) {
            applyCSSNode(css, range)
        }
        else if(range.startContainer === range.endContainer && 
            (
                range.startContainer.nodeType === 1 &&
                range.startOffset === 0 &&
                range.endOffset === range.startContainer.childNodes.length
            )
        ){
            if(range.startContainer !== that.editZone[0]){
                $(range.startContainer).css(css);
                $(range.startContainer).find('span').css(css);
            }
            else{
                $(range.startContainer).find('*').css(css);
            }
        }
        else{
            if(range.commonAncestorContainer.nodeType === 3){
                applyCSSText(css, range);
            }
            else{
                var foundFirst = false;
                for(var i = 0; i < range.commonAncestorContainer.childNodes.length; i++){
                    var sibling = range.commonAncestorContainer.childNodes[i];
                    if(
                        sibling === range.startContainer || 
                        (sibling.nodeType === 1 && $(sibling).find(range.startContainer).length) || 
                        (range.startContainer.nodeType === 1 && $(range.startContainer).find(sibling).length && range.startOffset === i)
                    ){
                        foundFirst = true;
                    }
                    if(!foundFirst){
                        continue;
                    }

                    if(
                        (sibling === range.endContainer && range.endOffset === 0) ||
                        ($(range.endContainer).find(sibling).length && range.endOffset === i)
                    ){
                        break;
                    }

                    if (
                        sibling.nodeType === 1 && $(sibling).find(range.startContainer).length
                    ) {
                        let currentNode = range.startContainer;
                        while(currentNode.parentNode !== sibling){
                            applyCSSBetween(range, currentNode.nextSibling, range.endContainer, css);
                            currentNode = currentNode.parentNode;
                        }
                        applyCSSBetween(range, range.startContainer, range.endContainer, css);
                        
                        continue;
                    }

                    if (
                        (
                            range.startContainer.nodeType === 1
                            && $(range.startContainer).find(sibling).length
                            && range.startOffset === i
                        )
                        || sibling === range.startContainer
                    ) {
                        applyCSSBetween(range, sibling, range.endContainer, css);
                        continue;
                    }

                    if (
                        sibling.nodeType === 1 
                        && $(sibling).find(range.endContainer).length
                    ) {
                        var firstChild = sibling.firstChild;
                        var startOffset = 0;
                        if ($(sibling).find(range.startContainer).length) {
                            firstChild = range.startContainer;
                            startOffset = range.startOffset;
                        }
                        applyCSSBetween(range, firstChild, range.endContainer, css, true, startOffset);
                        break;
                    }

                    if (
                            sibling === range.endContainer
                        )
                    {
                        var firstChild = range.endContainer.firstChild;
                        if (!firstChild) {
                            firstChild = range.endContainer;
                        }
                        applyCSSBetween(range, firstChild, range.endContainer, css, true, 0);
                        break;
                    }

                    if(sibling.nodeType === 1){
                        $(sibling).css(css);
                        $(sibling).find('*').css(css);
                        continue;
                    }
                    else{
                        var el = $(document.createElement('span'));
                        el.css(css);
                        el.text(sibling.textContent);
                        sibling.parentNode.insertBefore(el[0], sibling);
                        sibling.remove();
                    }

                    if(sibling === range.endContainer){
                        break;
                    }
                }
            }
        }
    }

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
    }

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
            if(!this.instance.editZone.html()){
                this.instance.editZone.html('<div>&#8203;</div>');
            }
            if(!this.instance.editZone.is(':focus')){
                this.instance.editZone[0].focus();
                let range = selection.getRangeAt(0);
                this.range = range;
                this.rangeCount = 1;
            }
            this.ranges = [];
            for(let i = 0; i < selection.rangeCount; i++){
                let range = selection.getRangeAt(i);
                this.ranges.push({
                    startContainer: range.startContainer,
                    endContainer: range.endContainer,
                    startOffset: range.startOffset,
                    endOffset: range.endOffset,
                    commonAncestorContainer: range.commonAncestorContainer
                });
                
            }
            this.ranges.forEach(function(range){
                applyCSS(params, range);
            });
            if(this.nextRanges.length){
                this.applyNextRanges();
            }
            
            //cleanup
            that.editZone.find('span').each(function(index, item){
                if(item.childNodes.length > 1){
                    let child = item.firstChild;
                    while(child !== null){
                        let nextChild = child.nextSibling;
                        if(child.nodeType === 3 && child.textContent === ""){
                            child.remove();
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
                    item.childNodes[0].remove();

                    sel.removeAllRanges();
                    newRanges.forEach(function(rangeDef){
                        let range = document.createRange();
                        range.setStart(rangeDef.startContainer, rangeDef.startOffset);
                        range.setEnd(rangeDef.endContainer, rangeDef.endOffset);
                        sel.addRange(range);
                    });
                }
                if(item.nextSibling && item.nextSibling.nodeType === 1 && item.nextSibling.nodeName === 'SPAN'){
                    let sameStyle = true;
                    for(let i = 0; i < item.nextSibling.style.length; i++){
                        sameStyle = sameStyle && $(item).css(item.nextSibling.style[i]) === $(item.nextSibling).css(item.nextSibling.style[i]);
                    }
                    for(let i = 0; i < item.style.length; i++){
                        sameStyle = sameStyle && $(item.nextSibling).css(item.style[i]) === $(item).css(item.style[i]);
                    }
                    if(sameStyle){
                        while(item.childNodes.length){
                            $(item.nextSibling).prepend(item.childNodes[item.childNodes.length - 1]);
                        }
                        item.remove();
                    }
                }
                if($(item).html() === ""){
                    $(item).remove();
                }
            });

            that.instance.addState(that.editZone.html());
            that.instance.trigger('contentupdated');
        }
        else {
            if (!this.selectedElements.length) {
                if (!this.range) {
                    return;
                }
                var node = this.range.startContainer;
                if (node.nodeType === 1) {
                    return $(node).css(params);
                }
                else {
                    return $(node.parentNode).css(params);
                }
            }
            var different = false;
            var val = undefined;
            this.selectedElements.forEach(function (item) {
                if(!item){
                    return;
                }
                var itemVal;
                if (item.nodeType === 1) {
                    itemVal = $(item).css(params);
                }
                else{
                    itemVal = $(item.parentNode).css(params);
                }

                if (itemVal !== val && val !== undefined) {
                    different = true;
                }
                val = itemVal;
            });
            if (different) {
                val = undefined;
            }
            return val;
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
        that.instance.addState(that.editZone.html());
        var wrapper = $('<span></span>');
        wrapper.html(htmlContent);
        if (this.range) {
            this.range.deleteContents();
            this.range.insertNode(wrapper[0]);
        }
        else {
            this.editZone.append(wrapper);
            var sel = window.getSelection();
            var range = document.createRange();
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