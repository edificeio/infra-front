import editor from '../po/editor.po';
import { openNewBlogPostPage, removeEmptyStyleAttribute, setWideScreen } from './spec-helper';

describe('editor press enter', () => {
    it('should add a new line when pressing enter on an empty editor', () => {
        setWideScreen();
        openNewBlogPostPage();
        editor.content.click();
        editor.content.addValue('Enter');
        editor.content.addValue('Enter');
        editor.content.addValue('abc');
        expect(removeEmptyStyleAttribute(editor.content.getHTML(false)))
            .toBe('<div>\u200b</div><div>\u200b</div><div>\u200babc</div>');
    });
});
