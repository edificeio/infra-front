import { isElementNodeWithName, onPressEnter, toKebabCase } from "./onPressEnter";
import { textNodes } from "./selection";
import { $ } from "../libs";

describe('toKebabCase', () => {
    it(`should return 'color' when given 'color'`, () => {
        expect(toKebabCase('color')).toBe('color');
    });
    it(`should return 'background-color' when given 'backgroundColor'`, () => {
        expect(toKebabCase('backgroundColor')).toBe('background-color');
    });
    it(`should return 'border-top-left-radius' when given 'borderTopLeftRadius'`, () => {
        expect(toKebabCase('borderTopLeftRadius')).toBe('border-top-left-radius');
    });
});

describe('isElementNodeWithName', () => {
    it(`should return true when given (<div><div>, 'DIV')`, () => {
        expect(isElementNodeWithName(document.createElement('div'), 'DIV')).toBe(true);
    });
    it(`should return true when given (<span><span>, 'SPAN')`, () => {
        expect(isElementNodeWithName(document.createElement('span'), 'SPAN')).toBe(true);
    });
    it(`should return false when given (<span><span>, 'DIV')`, () => {
        expect(isElementNodeWithName(document.createElement('span'), 'DIV')).toBe(false);
    });
    it(`should return false when given (textNode, 'DIV')`, () => {
        expect(isElementNodeWithName(document.createTextNode('test'), 'DIV')).toBe(false);
    });
});

// in the following spec:
//      ↵ represents where we are going to press enter
//      ‸ represents the expected start position of the range
describe('onPressEnter', () => {
    let selection;
    beforeEach(() => {
        jasmine.addMatchers(customMatchers);
        spyOn(document, "getSelection");
        selection = jasmine.createSpyObj("Selection", ["removeAllRanges", "addRange"]);
        (document.getSelection as jasmine.Spy).and.returnValue(selection);
    });

    it(`should addState <span>test</span>
            when editZone initially contains <span>test</span>`, () => {
        let {instance} = pressEnter('<span>test↵</span>', selection);
        expect(instance.addState).toHaveBeenCalledWith('<span>test</span>');
    });

    it(`should wrap the initial text in a <div></div> and create a new <div></div>
            when pressing enter in the editor root node`, () => {
        expect(pressEnter('test↵', selection))
            .toBeEditedAs('<div>test</div><div>&#8203;‸</div>');
    });

    it(`should wrap the new line in a <span></span>
            when pressing enter in a <a></a>`, () => {
        expect(pressEnter('<a>test↵</a>', selection))
            .toBeEditedAs('<div><a>test</a></div><div><span>&#8203;‸</span></div>');
    });

    it(`should copy the style prop in the new <div></div>
            when pressing enter in a <div style="color: red;"></div>`, () => {
        expect(pressEnter('<div style="color: red;">test↵</div>', selection))
            .toBeEditedAs('<div style="color: red;">test</div><div style="color: red;">&#8203;‸</div>');
    });

    it(`should adds a &#8203; in the textNode and adds a new line
            when pressing enter in a tag without text`, () => {
        expect(pressEnter('<div><span>test1</span>↵<span>test2</span></div>', selection))
            .toBeEditedAs('<div><span>test1</span>&#8203;</div><div>&#8203;‸<span>test2</span></div>');
    });

    it(`should create a new <div><span></span></div> and copy style properties from the styled <span></span>
            when pressing enter in a styled <span></span>`, () => {
        expect(pressEnter('<div>test1<span style="background-color: rgb(217, 28, 28);">test2↵test3</span></div>', selection))
            .toBeEditedAs('<div>test1<span style="background-color: rgb(217, 28, 28);">test2</span></div><div><span style="background-color: rgb(217, 28, 28);">‸test3</span></div>');
    });

    it(`should wrap the <span></span> tag in a <div></div> tag
            and create a new <div><span></span></div> tags
            when pressing enter in a root <span></span>`, () => {
        expect(pressEnter('<span>test↵</span>', selection))
            .toBeEditedAs('<div><span>test</span></div><div><span>&#8203;‸</span></div>');
    });

    function generateListSuite(uol: string) {
        it(`should leave the browser handle the situation when pressing enter in a <li></li> tag`, () => {
            let {editZone, range, event} = pressEnter(`<${uol}><li>test</li><li>test↵</li></${uol}>`, selection);
            expect({editZone, range}).toBeEditedAs(`<${uol}><li>test</li><li>test‸</li></${uol}>`);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it(`should create a new <li><span></span></li> tag
            when pressing enter in a <li><span></span></li> tag`, () => {
            let {editZone, range, event} = pressEnter(`<${uol}><li>test</li><li>abc<span>d↵ef</span>gh</li></${uol}>`, selection);
            expect({
                editZone,
                range
            }).toBeEditedAs(`<${uol}><li>test</li><li>abc<span>d</span></li><li><span>‸ef</span><span>gh</span></li></${uol}>`);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it(`should create a new <li><span><em></em></span></li> tag
            when pressing enter in a <li><span><em></em></span></li> tag`, () => {
            let {editZone, range, event} = pressEnter(`<${uol}><li>test</li><li>abc<span><em>d↵ef</em></span><span>gh</span></li></${uol}>`, selection);
            expect({
                editZone,
                range
            }).toBeEditedAs(`<${uol}><li>test</li><li>abc<span><em>d</em></span></li><li><span><em>‸ef</em></span><span>gh</span></li></${uol}>`);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it(`should create a <div></div> after the list and remove the last <li></li>
            when pressing enter in the last empty <li></li>`, () => {
            let {editZone, range, event} = pressEnter(`<${uol}><li>test</li><li>↵</li></${uol}>`, selection);
            expect({editZone, range}).toBeEditedAs(`<${uol}><li>test</li></${uol}><div>&#8203;‸</div>`);
            expect(event.preventDefault).toHaveBeenCalled();
        });

        it(`should leave the browser handle the situation
            when pressing enter in an empty <li></li> if it is not the last <li></li>`, () => {
            let {editZone, range, event} = pressEnter(`<${uol}><li>test</li><li>↵</li><li>test</li></${uol}>`, selection);
            expect({editZone, range}).toBeEditedAs(`<${uol}><li>test</li><li>‸</li><li>test</li></${uol}>`);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });

        it(`should leave the browser handle the situation
            when pressing enter in an empty <li></li> tag in a nested list`, () => {
            let {editZone, range, event} = pressEnter(`<${uol}><li>test</li><li><${uol}><li>test</li><li>↵</li></${uol}></li></${uol}>`, selection);
            expect({
                editZone,
                range
            }).toBeEditedAs(`<${uol}><li>test</li><li><${uol}><li>test</li><li>‸</li></${uol}></li></${uol}>`);
            expect(event.preventDefault).not.toHaveBeenCalled();
        });
    }

    describe('in an unordered list', () => {
        generateListSuite('ul');
    });

    describe('in an ordered list', () => {
        generateListSuite('ol');
    });
});

function showZWScharacters(s: string): string {
    return s.split('\u200b').join('&#8203;');
}

function hideZWScharacters(s: string): string {
    return s.split('&#8203;').join('\u200b');
}

function stringifyNode(node: Node): string {
    return `${node.parentNode.nodeName}<-${node.nodeName}-(${node.nodeValue})`;
}

const customMatchers: jasmine.CustomMatcherFactories = {
    toBeEditedAs: function (util: jasmine.MatchersUtil, customEqualityTesters: Array<jasmine.CustomEqualityTester>): jasmine.CustomMatcher {
        return {
            compare: function (actual: { editZone: any, range: Range }, expected): jasmine.CustomMatcherResult {
                const editHtml = showZWScharacters(actual.editZone.html()),
                    range = actual.range;
                if (!util.equals(editHtml, expected.replace('‸', ''), customEqualityTesters)) {
                    return {pass: false, message: `Expected '${editHtml}' to be '${expected.replace('‸', '')}'`};
                }
                const el = document.createElement('div');
                el.innerHTML = hideZWScharacters(expected);
                const {node, offset} = findNodeAndOffsetOf(el, '‸');
                node.nodeValue = node.nodeValue.replace('‸', '');
                const rangeContainer = range.startContainer;
                if (!node.isEqualNode(rangeContainer)) {
                    return {
                        pass: false,
                        message: `Expected range.startContainer '${stringifyNode(rangeContainer)}' to be '${stringifyNode(node)}'`
                    };
                }
                if (range.startOffset !== offset) {
                    return {pass: false, message: `Expected range.startOffset '${range.startOffset}' to be '${offset}'`}
                }
                return {pass: true};
            }
        }
    }
};

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

function pressEnter(content: string, selection: Selection): { event: any, range: Range, instance: any, editZone: any } {
    const event = jasmine.createSpyObj('KeyboardEvent', ['preventDefault']);
    const instance = jasmine.createSpyObj('Instance', ['addState']);
    let range = document.createRange();
    const editZoneElement = document.createElement('div');

    editZoneElement.innerHTML = content;
    // find and remove ↵ char, start the range at its position
    const {node, offset} = findNodeAndOffsetOf(editZoneElement, '↵');
    node.nodeValue = node.nodeValue.replace('↵', '');
    range.setStart(node, offset);

    const editZone = $(editZoneElement);
    onPressEnter(event, range, instance, editZone, textNodes);
    if ((selection.addRange as jasmine.Spy).calls.mostRecent()) {
        range = (selection.addRange as jasmine.Spy).calls.mostRecent().args[0];
    }

    return {event, range, instance, editZone}
}
