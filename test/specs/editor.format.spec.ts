import { openNewBlogPostPage, setWideScreen } from './spec-helper';
import editor from '../po/editor.po';

describe('editor press enter in a formatted line', () => {
    it('should add a new line with an unformatted <div></div> when pressing enter', () => {
        setWideScreen();
        openNewBlogPostPage();
        editor.content.click();
        editor.content.addValue('Enter');
        editor.content.addValue('abc');
        editor.toolbar.format.click();
        editor.toolbar.format.element('h2').click();
        editor.content.addValue('Enter');
        expect(editor.content.getHTML(false))
            .toBe('<div>\u200b</div><h2>\u200babc</h2><div>\u200b</div>');
    });
});
