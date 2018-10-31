import editorPage from '../po/editor.po';
import blogListPage from '../po/blog.list.po';
import blogPage from '../po/blog.po';
import loginPage from '../po/login.po';
import timelinePage from '../po/timeline.po';

describe('editor press enter', () => {
    it('should adds a new line when pressing enter on an empty editor', () => {
        loginPage.navigateToPage();
        loginPage.username.addValue('celia.alexandre2');
        loginPage.password.addValue('azerty');
        loginPage.submitButton.click();

        timelinePage.waitForVisible();

        blogListPage.navigateToPage();
        blogListPage.card.click();

        blogPage.waitForVisible();
        blogPage.newPost.click();

        editorPage.waitForVisible();
        editorPage.editor.click();
        editorPage.editor.addValue('Enter');
        editorPage.editor.addValue('Enter');
        editorPage.editor.addValue('abc');
        expect(editorPage.editor.getHTML(false)).toBe('<div>\u200b</div><div>\u200babc</div>');
    });
});