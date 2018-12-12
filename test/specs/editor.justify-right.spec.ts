import editor from '../po/editor.po';
import { openNewBlogPostPage, removeEmptyStyleAttribute, setWideScreen } from './spec-helper';

describe('editor justify right', () => {
    it('should align right the current line when clicking on the justify right button', () => {
        setWideScreen();
        openNewBlogPostPage();
        editor.content.click();
        editor.content.addValue('abc');
        browser.pause(1000);
        editor.toolbar.justifyRight.click();
        browser.pause(1000);
        expect(removeEmptyStyleAttribute(editor.content.getHTML(false)))
            .toBe('<div style="text-align: right;">abc</div>');
    });
});
