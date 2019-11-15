import {
    applyCssToRange,
    explodeRangeOnChildNodes,
    isHTMLBlockElement,
    isHTMLElement,
    isParentOfComparedNode,
    textNodes
} from '../selection';
import { findClosestBlockElement } from "../onPressDelete";

function findBlockParent(node: Node) {
    if (node.nodeType === 1 && textNodes.indexOf(node.nodeName) === -1) {
        return node;
    }
    if (node.attributes && node.attributes['contenteditable'] && node.nodeName === 'DIV') {
        const newNode = document.createElement('div');
        node.appendChild(newNode);
        for (let i = 0; i < node.childNodes.length; i++) {
            newNode.appendChild(node.childNodes[i]);
        }
        return node;
    }
    if (node.nodeType !== 1 || textNodes.indexOf(node.nodeName) !== -1) {
        return findBlockParent(node.parentNode);
    }
}

export function projectRangeOnBlockElements(range: Range, root: HTMLElement): Range[] {
    let ancestor = range.commonAncestorContainer;

    if (ancestor === root) {
        return explodeRangeOnChildNodes(range, root)
            .map(obj => obj.range)
            .map(r => {
                const newRange = document.createRange();
                let blockElement: Node;
                if (isHTMLElement(r.commonAncestorContainer) && isHTMLBlockElement(r.commonAncestorContainer)) {
                    blockElement = r.commonAncestorContainer;
                } else {
                    blockElement = findClosestBlockElement(r.commonAncestorContainer, root);
                }
                newRange.setStart(blockElement, 0);
                newRange.setEnd(blockElement, blockElement.childNodes.length);
                return newRange;
            });
    }

    let started = false;
    const newRange = document.createRange();
    ancestor = findBlockParent(ancestor);
    for (let i = 0; i < ancestor.childNodes.length; i++) {
        const blockParent = findBlockParent(ancestor.childNodes[i]);
        const childNodePositionComparedWithRangeStart = ancestor.childNodes[i].compareDocumentPosition(range.startContainer);
        const rangeStartPositionComparedWithChildNode = range.startContainer.compareDocumentPosition(ancestor.childNodes[i]);
        if (ancestor.childNodes[i] === range.startContainer
            || isParentOfComparedNode(childNodePositionComparedWithRangeStart)
            || isParentOfComparedNode(rangeStartPositionComparedWithChildNode)) {
            started = true;
            newRange.setStart(blockParent, 0);
        }

        if (!started) {
            continue;
        }

        const childNodePositionComparedWithRangeEnd = ancestor.childNodes[i].compareDocumentPosition(range.endContainer);
        const rangeEndPositionComparedWithChildNode = range.endContainer.compareDocumentPosition(ancestor.childNodes[i]);
        if (ancestor.childNodes[i] === range.startContainer
            || isParentOfComparedNode(childNodePositionComparedWithRangeEnd)
            || isParentOfComparedNode(rangeEndPositionComparedWithChildNode)) {
            newRange.setEnd(blockParent, blockParent.childNodes.length);
        }
    }
    return [newRange];
}

function applyTextAlignToSelection(selection: Selection, root: HTMLElement, value: string) {
    const ranges: Range[] = [];
    const projectedRanges: Range[] = [];

    for (let i = 0; i < selection.rangeCount; i++) {
        let range = selection.getRangeAt(i);
        ranges.push(range);
    }
    ranges.forEach(range => projectedRanges.push(...projectRangeOnBlockElements(range, root)));
    projectedRanges.forEach(range => applyCssToRange(root, range, 'text-align', {'text-align': value}));
}

export const justifyLeft = {
    name: 'justifyLeft',
    run: function (instance) {
        return {
            template: '<i tooltip="editor.option.justify.left"></i>',
            link: function (scope, element, attributes) {
                element.addClass('toggled');
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }
                    applyTextAlignToSelection(window.getSelection(), instance.editZone.get(0), 'left');
                    if (document.queryCommandState('justifyLeft')) {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });

                instance.on('selectionchange', function (e) {
                    if (document.queryCommandState('justifyLeft') && instance.selection.css('float') !== 'right' && instance.selection.css('z-index') !== "1") {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function (e) {
                    if (document.queryCommandState('justifyLeft') && instance.selection.css('float') !== 'right' && instance.selection.css('z-index') !== "1") {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const justifyCenter = {
    name: 'justifyCenter',
    run: function (instance) {
        return {
            template: '<i tooltip="editor.option.justify.center"></i>',
            link: function (scope, element, attributes) {
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }
                    if (!document.queryCommandState('justifyCenter')) {
                        applyTextAlignToSelection(window.getSelection(), instance.editZone.get(0), 'center');
                        element.addClass('toggled');
                    } else {
                        applyTextAlignToSelection(window.getSelection(), instance.editZone.get(0), 'left');
                        element.removeClass('toggled');
                    }
                });

                instance.on('selectionchange', function (e) {
                    // z-index is a hack to track margin width; auto width is computed as 0 in FF
                    if (document.queryCommandState('justifyCenter')
                        || (instance.selection.css('margin-left') === instance.selection.css('margin-right') && instance.selection.css('z-index') === '1')) {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function (e) {
                    // z-index is a hack to track margin width; auto width is computed as 0 in FF
                    if (document.queryCommandState('justifyCenter')
                        || (instance.selection.css('margin-left') === instance.selection.css('margin-right') && instance.selection.css('z-index') === '1')) {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const justifyRight = {
    name: 'justifyRight',
    run: function (instance) {
        return {
            template: '<i tooltip="editor.option.justify.right"></i>',
            link: function (scope, element, attributes) {
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }
                    if (!document.queryCommandState('justifyRight')) {
                        applyTextAlignToSelection(window.getSelection(), instance.editZone.get(0), 'right');
                        element.addClass('toggled');
                    } else {
                        applyTextAlignToSelection(window.getSelection(), instance.editZone.get(0), 'left');
                        element.removeClass('toggled');
                    }
                });

                instance.on('selectionchange', function (e) {
                    if (document.queryCommandState('justifyRight') || instance.selection.css('float') === 'right') {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function (e) {
                    if (document.queryCommandState('justifyRight') || instance.selection.css('float') === 'right') {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};

export const justifyFull = {
    mobile: false,
    name: 'justifyFull',
    run: function (instance) {
        return {
            template: '<i tooltip="editor.option.justify.full"></i>',
            link: function (scope, element, attributes) {
                element.on('click', function () {
                    if (!instance.editZone.is(':focus')) {
                        instance.focus();
                    }

                    if (!document.queryCommandState('justifyFull')) {
                        applyTextAlignToSelection(window.getSelection(), instance.editZone.get(0), 'justify');
                        element.addClass('toggled');
                    } else {
                        applyTextAlignToSelection(window.getSelection(), instance.editZone.get(0), 'left');
                        element.removeClass('toggled');
                    }
                });

                instance.on('selectionchange', function (e) {
                    if (document.queryCommandState('justifyFull')) {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });

                instance.on('justify-changed', function (e) {
                    if (document.queryCommandState('justifyFull')) {
                        element.addClass('toggled');
                    } else {
                        element.removeClass('toggled');
                    }
                });
            }
        };
    }
};