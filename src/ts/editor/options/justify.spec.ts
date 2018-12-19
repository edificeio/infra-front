import { projectRangeOnBlockElements } from './justify';

describe('projectRangeOnBlockElements', () => {
    it('should select the first parent block element when the range is inside a block element', () => {
        const root = generateRootElement();
        const {div, text} = generateLine('test');

        root.appendChild(div);

        const range = document.createRange();
        range.setStart(text, 0);
        range.setEnd(text, text.length);

        const expectedRanges = projectRangeOnBlockElements(range, root);
        expect(expectedRanges.length).toBe(1);
        expect(expectedRanges[0].startContainer).toBe(div);
        expect(expectedRanges[0].endContainer).toBe(div);
    });

    it('should select all block element of lines when the range is a selection of multiple lines', () => {
        const root = generateRootElement();
        const lines = [
            generateLine('line1'),
            generateLine('line2'),
            generateLine('line3'),
            generateLine('line4')
        ];

        lines.forEach(line => root.appendChild(line.div));

        const range = document.createRange();
        range.setStart(lines[0].text, 0);
        range.setEnd(lines[2].text, 2);

        const expectedRanges = projectRangeOnBlockElements(range, root);

        expect(expectedRanges.length).toBe(3);

        expectedRanges.forEach((range, index) => {
            expect(range.startContainer).toBe(lines[index].div);
            expect(range.startOffset).toBe(0);
            expect(range.endContainer).toBe(lines[index].div);
            expect(range.endOffset).toBe(1);
        });
    });
});

function generateRootElement() {
    const root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    return root;
}

function generateLine(str: string): { div: HTMLElement, text: Text } {
    const div = document.createElement('div');
    const span = document.createElement('span');
    const text = document.createTextNode(str);

    span.appendChild(text);
    div.appendChild(span);

    return {div, text};
}
