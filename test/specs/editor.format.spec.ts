import { openNewBlogPostPage, removeEmptyStyleAttribute, setWideScreen } from './spec-helper';
import editor from '../po/editor.po';

describe('editor press enter in a formatted line', () => {
    it('should add a new line with an unformatted <div></div> when pressing enter', () => {
        setWideScreen();
        openNewBlogPostPage();
        editor.content.click();
        editor.content.addValue('Enter');
        editor.content.addValue('abc');
        browser.pause(1000);
        editor.toolbar.format.click();
        browser.pause(2000);
        editor.toolbar.format.element('h2').click();
        browser.pause(2000);
        editor.content.addValue('Enter');
        browser.pause(1000);
        expect(removeEmptyStyleAttribute(editor.content.getHTML(false)))
            .toBe('<div>\u200b</div><h2>\u200babc</h2><div>\u200b</div>');
    });
});
