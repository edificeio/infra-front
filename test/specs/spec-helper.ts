import loginPage from '../po/login.po';
import timelinePage from '../po/timeline.po';
import blogListPage from '../po/blog.list.po';
import blogPage from '../po/blog.po';
import editor from '../po/editor.po';

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

export function authenticate(username: string, password: string) {
    loginPage.navigateToPage();
    loginPage.username.addValue(username);
    loginPage.password.addValue(password);
    loginPage.submitButton.click();

    timelinePage.waitForVisible();
}

export function setWideScreen() {
    browser.setViewportSize({
        width: 1280,
        height: 1024
    });
}

export function openNewBlogPostPage() {
    authenticate(username, password);

    blogListPage.navigateToPage();
    blogListPage.card.click();

    blogPage.waitForVisible();
    blogPage.newPost.click();

    editor.waitForVisible();
}