import {
    findClosestHTMLElement,
    hasStyleProperty,
    isBeforeComparedNode,
    isHTMLBlockElement,
    isRangeMisplacedInList,
    Selection as RTESelection
} from './selection';
import { $ } from '../libs';


describe('Selection', () => {
    describe('css', () => {
        describe('in setting mode', () => {
            beforeEach(() => jasmine.addMatchers(customMatchers));

            it(`should create a tag to adds the color red
                when editZone is empty and given {color: red}`, () => {
                expect(applyCss(`↦↤`, {color: 'red'}))
                    .toBeStyledAs('<div><span style="color: red;">↦\u200b↤</span></div>');
            });

            it(`should adds color red to <span></span>
                when editZone contains a <span></span> and given {color: red}`, () => {
                expect(applyCss(`<span>↦test↤</span>`, {color: 'red'}))
                    .toBeStyledAs('<span style="color: red;">↦test↤</span>');
            });

            it(`should create a red <span></span> surrounding the text
                when apply color red to the editor`, () => {
                expect(applyCssToEditZone(`<div>test</div>`, {color: 'red'}))
                    .toBeStyledAs('<div><span style="color: red;">↦test↤</span></div>');
            });

            it(`should apply color blue to the existing <span></span>
                when apply color blue to the editor`, () => {
                expect(applyCssToEditZone(`<div><span style="color: red;">test</span></div>`, {color: 'blue'}))
                    .toBeStyledAs('<div><span style="color: blue;">↦test↤</span></div>');
            });

            it(`should apply align right to the <div></div>
                when apply align right to a block element`, () => {
                expect(applyCssToFirstElementMatching(`<div><span>test</span></div>`, 'div', {'text-align': 'right'}))
                    .toBeStyledAs('<div style="text-align: right;"><span>↦test↤</span></div>');
            });

            it(`should adds a red <span></span>
                when editZone is a textnode and given {color: red}`, () => {
                expect(applyCss(`test1↦↤`, {color: 'red'}))
                    .toBeStyledAs('test1<span style="color: red;">↦\u200b↤</span>');
            });

            it(`should adds a red <span></span>
                when editZone is <div> with text nodes and given {color: red}`, () => {
                expect(applyCss(`<div>test1↦test2↤test3</div>`, {color: 'red'}))
                    .toBeStyledAs('<div>test1<span style="color: red;">↦test2↤</span>test3</div>');
            });

            it(`should remove the properties vertical-align and font-size on a subscript <span></span>
                when given {verticalAlign: '', fontSize: ''}`, () => {
                expect(applyCss(`<div>test1<span style="vertical-align: sub; font-size: 12px;">↦↤</span>test2</div>`, {
                    verticalAlign: '',
                    fontSize: ''
                })).toBeStyledAs('<div>test1<span>↦\u200b↤</span>test2</div>');
            });

            it(`should apply red to selected subtext nodes and <span></span>
                when given {color: red}`, () => {
                expect(applyCss(`<div>te↦st1<span>test2</span>te↤st3</div>`, {color: 'red'}))
                    .toBeStyledAs('<div>te<span style="color: red;">↦st1</span><span style="color: red;">test2</span><span style="color: red;">te↤</span>st3</div>')
            });

            it(`should extract the child <span></span> and adds color red
                when editZone is <span><span></span></span> and given {color: red} to the child <span></span>`, () => {
                expect(applyCss(`<span style="color: blue;">test1<span>↦test2↤</span></span>`, {color: 'red'}))
                    .toBeStyledAs('<span style="color: blue;">test1</span><span style="color: red;">↦test2↤</span>');
            });

            it(`should replace the blue color to rgb(0, 0, 0)
                when editZone is an empty blue <span></span> and given {color: #000}`, () => {
                expect(applyCss(`<span style="color: blue;">↦↤</span>`, {color: '#000'}))
                    .toBeStyledAs('<span style="color: rgb(0, 0, 0);">↦\u200b↤</span>');
            });

            it(`should create a new red child <span></span> with the selection
                when editZone is a blue <span></span>, selection is a subpart of the <span></span> and given {color: red}`, () => {
                expect(applyCss(`<span style="color: blue;">test1↦test2↤</span>`, {color: 'red'}))
                    .toBeStyledAs('<span style="color: blue;">test1</span><span style="color: red;">↦test2↤</span>');
            });

            it(`should apply the blue color to the selection (and not to next siblings)`, () => {
                expect(applyCss(`<div><span>↦test1↤<span>test2</span></span></div>`, {color: 'blue'}))
                    .toBeStyledAs('<div><span style="color: blue;">↦test1↤</span><span>test2</span></div>');
            });

            it(`should apply the blue color to the selection (and not to previous siblings)`, () => {
                expect(applyCss(`<div><span><em>test1</em>↦test2↤</span></div>`, {color: 'blue'}))
                    .toBeStyledAs('<div><span><em>test1</em></span><span style="color: blue;">↦test2↤</span></div>');
            });

            it(`should set font-size to 12px to all selected nodes and adds a 12px <span></span> with the subselected text
                            when editZone is a set of <span></span>
                            and the selection is on the subtext of a <span></span> and multiple <span></span>`, () => {
                expect(applyCss(`<div><span>te↦st1</span><span>test2</span><span>test3↤</span></div>`, {'font-size': '12px'}))
                    .toBeStyledAs('<div><span>te</span><span style="font-size: 12px;">↦st1</span><span style="font-size: 12px;">test2</span><span style="font-size: 12px;">test3↤</span></div>');
            });

            it(`should not merge <span></span> tags in the range
                when editZone <span></span><span blue></span><span blue></span> and given {color: blue} on the first <span></span>
                because don't messing with selection is probably better than light editor weight`, () => {
                expect(applyCss(`<div><span>↦test1↤</span><span style="color: blue;">test2</span><span style="color: blue;">test3</span><span>\u200b</span></div>`, {color: 'blue'}))
                    .toBeStyledAs('<div><span style="color: blue;">↦test1↤</span><span style="color: blue;">test2test3</span></div>');
            });

            it(`should merge <span></span> tags out of range and respect children order
                when editZone <span></span><span blue><span orange></span><span yellow></span></span><span blue></span> and given {color: blue} on the first <span></span>`, () => {
                expect(applyCss(`<div><span>↦test1↤</span><span style="color: blue;"><span style="background: orange;">test2</span><span style="background: yellow;">test3</span></span></span><span style="color: blue;">test4</span><span>\u200b</span></div>`, {color: 'blue'}))
                    .toBeStyledAs('<div><span style="color: blue;">↦test1↤</span><span style="color: blue;"><span style="background: orange;">test2</span><span style="background: yellow;">test3</span>test4</span></div>');
            });

            it(`should select the previous list item and adds a blue span
                when editZone <ul><li></li>#text</ul> and given {color: blue} on the #text`, () => {
                expect(applyCss(`<ul><li>test1</li>↦↤</ul>`, {color: 'blue'}))
                    .toBeStyledAs('<ul><li>test1<span style="color: blue;">↦\u200b↤</span></li></ul>');
            });

            it(`should select the previous list item and adds a blue span
                when editZone <ul><li></li>#text<li></li></ul> and given {color: blue} on the #text`, () => {
                expect(applyCss(`<ul><li>test1</li>↦↤<li>test2</li></ul>`, {color: 'blue'}))
                    .toBeStyledAs('<ul><li>test1<span style="color: blue;">↦\u200b↤</span></li><li>test2</li></ul>');
            });

            it(`should select the previous list item and adds a blue span
                when editZone <ol><li></li>#text</ol> and given {color: blue} on the #text`, () => {
                expect(applyCss(`<ol><li>test1</li>↦↤</ol>`, {color: 'blue'}))
                    .toBeStyledAs('<ol><li>test1<span style="color: blue;">↦\u200b↤</span></li></ol>');
            });

            it(`should select the previous list item and adds a blue span
                when editZone <ol><li></li>#text<li></li></ol> and given {color: blue} on the #text`, () => {
                expect(applyCss(`<ol><li>test1</li>↦↤<li>test2</li></ol>`, {color: 'blue'}))
                    .toBeStyledAs('<ol><li>test1<span style="color: blue;">↦\u200b↤</span></li><li>test2</li></ol>');
            });

            describe(`cleanup`, () => {
                it(`should remove empty <span></span> tags`, () => {
                    expect(applyCss(`<div><span>↦test1↤</span><span></span></div><span></span>`, {color: 'blue'}))
                        .toBeStyledAs('<div><span style="color: blue;">↦test1↤</span></div>');
                });

                it(`should not remove empty <span></span> tags when they are the only tags of a <div></div> tag`, () => {
                    expect(applyCss(`<div><span>↦test1↤</span><span></span></div><span></span><div><span></span></div><div><span></span></div>`, {color: 'blue'}))
                        .toBeStyledAs('<div><span style="color: blue;">↦test1↤</span></div><div><span></span></div><div><span></span></div>');
                });

                it(`should affect sub node style to span`, () => {
                    expect(applyCss(`<div><span><span style="color: rgb(1, 2, 3);">test2</span></span><span>↦test1↤</span></div>`, {color: 'blue'}))
                        .toBeStyledAs('<div><span style="color: rgb(1, 2, 3);">test2</span><span style="color: blue;">↦test1↤</span></div>');
                });
            });
        });

        describe('in getting mode', () => {
            it(`it should return red when editZone is a red <span></span>`, () => {
                expect(getCss(`<span style="color: rgb(1, 2 ,3);">↦test↤</span>`, 'color')).toBe('rgb(1, 2, 3)');
            });
        })
    });
});

describe('findClosestHTMLElement', () => {
    it(`should return <span id='parent'></span> when <span id="parent"><span>test</span></span>`, () => {
        const parent = document.createElement('span');
        parent.id = 'parent';
        const child = document.createElement('span');
        parent.appendChild(child);
        expect(findClosestHTMLElement(child)).toBe(parent);
    });
});

describe('isHTMLBlockElement', () => {
    const blocks = ['li', 'div', 'p', 'h1'];

    for (let block of blocks) {
        it(`should return true when '${block}'`, () => {
            const element = document.createElement(block);
            expect(isHTMLBlockElement(element)).toBe(true);
        });
    }

    const texts = ['a', 'span', 'em', 'img'];

    for (let text of texts) {
        it(`should return false when '${text}'`, () => {
            const element = document.createElement(text);
            expect(isHTMLBlockElement(element)).toBe(false);
        });
    }
});

describe('hasStyleProperty', () => {
    it('should return true when blue <span></span> and given color', () => {
        const el = document.createElement('span');
        el.style.setProperty('color', 'blue');
        expect(hasStyleProperty(el, 'color')).toBe(true);
    });

    it('should return false when blue <span></span> and given margin', () => {
        const el = document.createElement('span');
        el.style.setProperty('color', 'blue');
        expect(hasStyleProperty(el, 'margin')).toBe(false);
    });
});

describe('positional bitmask compare', () => {
    describe('isBeforeComparedNode', () => {
        it('should return true when the comparedNode is following the ref node', () => {
            const position = Node.DOCUMENT_POSITION_FOLLOWING;
            expect(isBeforeComparedNode(position)).toBe(true);
        });
        it('should return false when the comparedNode is following the red node and is contained by the ref node', () => {
            const position = Node.DOCUMENT_POSITION_FOLLOWING & Node.DOCUMENT_POSITION_CONTAINED_BY;
            expect(isBeforeComparedNode(position)).toBe(false);
        });
    });
});

describe('isRangeMisplacedInList', () => {
    function generateSuite(uol: string) {
        it(`should return true when range select a textNode which is a child of the root list element (${uol})`, () => {
            const root = document.createElement(uol);
            const li = document.createElement('li');
            li.appendChild(document.createTextNode('my item'));
            const text = document.createTextNode('');
            root.appendChild(li);
            root.appendChild(text);
            const range = document.createRange();
            range.selectNodeContents(text);
            expect(isRangeMisplacedInList(range)).toBe(true);
        });

        it(`should return false when range select a li which is a child of the root list element (${uol})`, () => {
            const root = document.createElement('ul');
            const li = document.createElement('li');
            li.appendChild(document.createTextNode('my item'));
            const text = document.createTextNode('');
            root.appendChild(li);
            root.appendChild(text);
            const range = document.createRange();
            range.selectNodeContents(li);
            expect(isRangeMisplacedInList(range)).toBe(false);
        });
    }

    generateSuite('ul');
    generateSuite('ol');
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

class SelectionBuilder {
    constructor(private editZone: any, private instance: any) {
    }

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

    get rangeCount() {
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

function toHtmlAndSelection(content: string): { editZoneElement: HTMLElement, mockSelection: MockSelection } {
    const editZoneElement = document.createElement('div');
    editZoneElement.innerHTML = content;
    let range = document.createRange();

    const start = findNodeAndOffsetOf(editZoneElement, '↦');
    const end = findNodeAndOffsetOf(editZoneElement, '↤');
    const startAndEndOnSameNode = (start.node === end.node);

    start.node.nodeValue = start.node.nodeValue.replace('↦', '');
    end.node.nodeValue = end.node.nodeValue.replace('↤', '');

    if (startAndEndOnSameNode) {
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

function applyCss(content: string, properties: { [property: string]: any }): Node {
    const {editZoneElement, mockSelection} = toHtmlAndSelection(content);
    spyOn(window, 'getSelection');
    (window.getSelection as jasmine.Spy).and.returnValue(mockSelection);
    const instance = jasmine.createSpyObj('Instance', ['addState', 'on', 'trigger']);
    const editZone = $(editZoneElement);
    const selection = new SelectionBuilder(editZone, instance).value();
    (selection as any).css(properties);
    return editZoneElement;
}

function applyCssToEditZone(content: string, properties: { [property: string]: any }): Node {
    const editZoneElement = document.createElement('div');
    editZoneElement.innerHTML = content;

    const range = document.createRange();
    range.setStart(editZoneElement, 0);
    range.setEnd(editZoneElement, editZoneElement.childNodes.length);
    const mockSelection = new MockSelection();
    mockSelection.addRange(range);

    spyOn(window, 'getSelection');
    (window.getSelection as jasmine.Spy).and.returnValue(mockSelection);
    const instance = jasmine.createSpyObj('Instance', ['addState', 'on', 'trigger']);
    const editZone = $(editZoneElement);
    const selection = new SelectionBuilder(editZone, instance).value();
    (selection as any).css(properties);
    return editZoneElement;
}

function applyCssToFirstElementMatching(content: string, selector: string, properties: { [property: string]: any }): Node {
    const editZoneElement = document.createElement('div');
    editZoneElement.innerHTML = content;

    const range = document.createRange();
    const targetedElement = editZoneElement.querySelector(selector);
    range.setStart(targetedElement, 0);
    range.setEnd(targetedElement, targetedElement.childNodes.length);
    const mockSelection = new MockSelection();
    mockSelection.addRange(range);

    spyOn(window, 'getSelection');
    (window.getSelection as jasmine.Spy).and.returnValue(mockSelection);
    const instance = jasmine.createSpyObj('Instance', ['addState', 'on', 'trigger']);
    const editZone = $(editZoneElement);
    const selection = new SelectionBuilder(editZone, instance).value();
    (selection as any).css(properties);
    return editZoneElement;
}

function getCss(content: string, property: string): string {
    const {editZoneElement, mockSelection} = toHtmlAndSelection(content);
    spyOn(window, 'getSelection');
    (window.getSelection as jasmine.Spy).and.returnValue(mockSelection);
    const instance = jasmine.createSpyObj('Instance', ['addState', 'on', 'trigger']);
    const editZone = $(editZoneElement);
    const selection = new SelectionBuilder(editZone, instance).value();
    (selection as any).range = mockSelection.getRangeAt(0);
    return (selection as any).css(property);
}

const customMatchers: jasmine.CustomMatcherFactories = {
    toBeStyledAs: function (util: jasmine.MatchersUtil, customEqualityTesters: Array<jasmine.CustomEqualityTester>): jasmine.CustomMatcher {
        return {
            compare: function (actual: Node, expected): jasmine.CustomMatcherResult {
                const editHtml = $(actual).html(),
                    range = window.getSelection().getRangeAt(0);
                if (!util.equals(editHtml, expected.replace('↦', '').replace('↤', ''), customEqualityTesters)) {
                    return {
                        pass: false,
                        message: `Expected '${editHtml}' to be '${expected.replace('↦', '').replace('↤', '')}'`
                    };
                }
                const el = document.createElement('div');
                el.innerHTML = expected;
                const start = findNodeAndOffsetOf(el, '↦');
                const end = findNodeAndOffsetOf(el, '↤');
                const startAndEndOnSameNode = (start.node === end.node);

                start.node.nodeValue = start.node.nodeValue.replace('↦', '');
                end.node.nodeValue = end.node.nodeValue.replace('↤', '');

                const rangeContainer = range.startContainer;
                const endContainer = range.endContainer;
                if (!start.node.isEqualNode(rangeContainer)) {
                    return {
                        pass: false,
                        message: `Expected range.startContainer '${stringifyNode(rangeContainer)}' to be '${stringifyNode(start.node)}'`
                    };
                }
                if (range.startOffset !== start.offset) {
                    return {
                        pass: false,
                        message: `Expected range.startOffset '${range.startOffset}' to be '${start.offset}'`
                    }
                }
                if (!end.node.isEqualNode(endContainer)) {
                    return {
                        pass: false,
                        message: `Expected range.endContainer '${stringifyNode(endContainer)}' to be '${stringifyNode(end.node)}'`
                    };
                }
                if (range.endOffset !== (startAndEndOnSameNode ? end.offset - 1 : end.offset)) {
                    return {pass: false, message: `Expected range.endOffset '${range.endOffset}' to be '${end.offset}'`}
                }
                return {pass: true};
            }
        }
    }
};

function stringifyNode(node: Node): string {
    return `${node.parentNode ? node.parentNode.nodeName : '#root'}<-${node.nodeType === Node.ELEMENT_NODE ? node.nodeName : '#text'}-(${node.nodeValue})`;
}
