import editor from '../po/editor.po';
import { openNewBlogPostPage, removeEmptyStyleAttribute, setWideScreen } from './spec-helper';

describe('editor press delete', () => {
    it('should remove the character before the caret', () => {
        setWideScreen();
        openNewBlogPostPage();
        editor.content.click();
        editor.content.addValue('Enter');
        editor.content.addValue('Enter');
        editor.content.addValue('abc');
        editor.content.addValue('Backspace');
        expect(removeEmptyStyleAttribute(editor.content.getHTML(false)))
            .toBe('<div>\u200b</div><div>\u200b</div><div>ab</div>');
    });
});
