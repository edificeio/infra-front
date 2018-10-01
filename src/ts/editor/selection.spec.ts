import { Selection as RTESelection } from "./selection";
import { $ } from "../libs";

class SelectionBuilder {
    constructor(private editZone: any, private instance: any) {}

    value(): Selection {
        this.instance.editZone = this.editZone;
        // hack the prototype of the class to set editZone and instance, since we are not using Model.
        RTESelection.prototype.editZone = this.editZone;
        RTESelection.prototype.instance = this.instance;
        return new RTESelection({editZone: this.editZone, instance: this.instance});
    }
}

class MockSelection implements Partial<Selection> {
    private ranges = [];
    get rangeCount () {
        return this.ranges.length;
    };

    public addRange(r: Range) {
        this.ranges.push(r);
    }

    public getRangeAt(i: number): Range {
        return this.ranges[i];
    }

    public removeAllRanges() {
        this.ranges = [];
    }
}

function toHtmlAndSelection(content: string): {editZoneElement: HTMLElement, mockSelection: MockSelection} {
    const editZoneElement = document.createElement('div');
    editZoneElement.innerHTML = content;
    let range = document.createRange();

    const start = findNodeAndOffsetOf(editZoneElement, '↦');
    const end = findNodeAndOffsetOf(editZoneElement, '↤');
    const startAndEndOnSameNode = (start.node === end.node);

    start.node.nodeValue = start.node.nodeValue.replace('↦', '');
    end.node.nodeValue = end.node.nodeValue.replace('↤', '');

    if(startAndEndOnSameNode) {
        range.setStart(end.node, start.offset);
        range.setEnd(end.node, end.offset - 1);
    } else {
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
    }

    const mockSelection = new MockSelection();
    mockSelection.addRange(range);

    return {editZoneElement, mockSelection}
}

function applyCSS(content: string, properties: {[property: string]: any}): string {
    const {editZoneElement, mockSelection} = toHtmlAndSelection(content);
    spyOn(window, 'getSelection');
    (window.getSelection as jasmine.Spy).and.returnValue(mockSelection);
    const instance = jasmine.createSpyObj('Instance', ['addState', 'on', 'trigger']);
    const editZone = $(editZoneElement);
    const selection = new SelectionBuilder(editZone, instance).value();
    (selection as any).css(properties);
    return editZoneElement.innerHTML;
}

function getCSS(content: string, property: string): string {
    const {editZoneElement, mockSelection} = toHtmlAndSelection(content);
    spyOn(window, 'getSelection');
    (window.getSelection as jasmine.Spy).and.returnValue(mockSelection);
    const instance = jasmine.createSpyObj('Instance', ['addState', 'on', 'trigger']);
    const editZone = $(editZoneElement);
    const selection = new SelectionBuilder(editZone, instance).value();
    (selection as any).range = mockSelection.getRangeAt(0);
    return (selection as any).css(property);
}

describe('Selection', () => {
   describe('css', () => {
        describe('in setting mode', () => {
            it(`should adds color red to <span></span>
                when editZone is <span></span> and given {color: red}`, () => {
                expect(applyCSS(`<span>↦test↤</span>`, {color: 'red'}))
                    .toBe('<span style="color: red;">test</span>');
            });

            it(`should adds color red to child <span></span>
                when editZone is <span><span></span></span> and given {color: red} to the child <span></span>`, () => {
                expect(applyCSS(`<span style="color: blue;">test1<span>↦test2↤</span></span>`, {color: 'red'}))
                    .toBe('<span style="color: blue;">test1<span style="color: red;">test2</span></span>');
            });

            it(`should replace the blue color to rgb(0, 0, 0)
                when editZone is an empty blue <span></span> and given {color: red}`, () => {
                expect(applyCSS(`<span style="color: blue;">↦↤</span>`, {color: '#000'}))
                    .toBe('<span style="color: rgb(0, 0, 0);">\u200b</span>');
            });

            it(`should create a tag to adds the color red
                when editZone is empty and given {color: red}`, () => {
                expect(applyCSS(`↦↤`, {color: 'red'}))
                    .toBe('<div><span style="color: red;">\u200b</span><span>\u200b</span></div>');
            });

            it(`should create a new red child <span></span> with the selection
                when editZone is a blue <span></span>, selection is a subpart of the <span></span> and given {color: red}`, () => {
                expect(applyCSS(`<span style="color: blue;">test1↦test2↤</span>`, {color: 'red'}))
                    .toBe('<span style="color: blue;">test1<span style="color: red;">test2</span></span>');
            });

            it(`should apply the blue color to the selection and next siblings`, () => {
                expect(applyCSS(`<div><span>↦test1↤<span>test2</span></span></div>`, {color: 'blue'}))
                    .toBe('<div><span style="color: blue;">test1<span style="color: blue;">test2</span></span></div>');
            });

            it(`should apply the blue color to the selection and previous siblings`, () => {
                expect(applyCSS(`<div><span><em>test1</em>↦test2↤</span></div>`, {color: 'blue'}))
                    .toBe('<div><span style="color: blue;"><em style="color: blue;">test1</em>test2</span></div>');
            });

            it(`should set font-size to 12px to all selected nodes and adds a 12px <span></span> with the subselected text
                            when editZone is a set of <span></span> and the selection is on the subtext of a <span></span> and multiple <span></span>`, () => {
                expect(applyCSS(`<div><span>te↦st1</span><span>test2</spanspan><span>test3↤</span></div>`, {'font-size': '12px'}))
                    .toBe('<div><span>te<span style="font-size: 12px;">st1</span><span style="font-size: 12px;">test2</span><span style="font-size: 12px;">test3</span></span></div>');
            });

            it(`should merge <span></span> tags if the next <span></span> is blue
                when editZone <span></span><span blue></span> and given {color: blue} on the first <span></span>`, () => {
                expect(applyCSS(`<div><span>↦test1↤</span><span style="color: blue;">test2</span></div>`, {color: 'blue'}))
                    .toBe('<div><span style="color: blue;">test1test2</span></div>');
            });

            // must be related to issue 19610
            xit(`should merge <span></span> tags if the next <span></span> is blue
                when editZone <span></span><span blue></span> and given {color: blue} on the first <span></span>`, () => {
                expect(applyCSS(`<ul><li>test1</li>↦↤</ul>`, {color: 'blue'}))
                    .toBe('<ul><li style="color: blue;">test1</li></ul>');
            });

            describe('cleanup', () => {
                it(`should removes empty <span></span> tags`, () => {
                    expect(applyCSS(`<div><span>↦test1↤</span><span></span></div><span></span>`, {color: 'blue'}))
                        .toBe('<div><span style="color: blue;">test1</span></div>');
                });

                it(`should affect sub node style to span`, () => {
                    expect(applyCSS(`<div><span><span style="color: rgb(1, 2, 3);">test2</span></span><span>↦test1↤</span></div>`, {color: 'blue'}))
                        .toBe('<div><span style="color: rgb(1, 2, 3);">test2</span><span style="color: blue;">test1</span></div>');
                });
            });
        });

        describe('in getting mode', () => {
            it(`it should return red when editZone is a red <span></span>`, () => {
               expect(getCSS(`<span style="color: rgb(1, 2 ,3);">↦test↤</span>`, 'color')).toBe('rgb(1, 2, 3)');
            });
        })
   });
});

function findNodeAndOffsetOf(node: Node, char: string): { node: Node, offset: number } {
    const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);

    let currentNode: Node;
    while (currentNode = tw.nextNode()) {
        let text = currentNode.nodeValue;
        if (text.indexOf(char) > -1) {
            return {node: currentNode, offset: text.indexOf(char)};
        }
    }
}
