import { selectBlockParentPure } from './justify';

describe('selectBlockParentPure', () => {
    it('should select the first parent block element when the range is inside a block element', () => {
        const root = document.createElement('div');
        root.setAttribute('contenteditable', 'true');
        const div = document.createElement('div');
        const span = document.createElement('span');
        const text = document.createTextNode('test');

        span.appendChild(text);
        div.appendChild(span);
        root.appendChild(div);

        const range = document.createRange();
        range.setStart(text, 0);
        range.setEnd(text, text.length);

        const expectedRange = selectBlockParentPure(range);
        expect(expectedRange.startContainer).toBe(div);
        expect(expectedRange.endContainer).toBe(div);
    });
});
