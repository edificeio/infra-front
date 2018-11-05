export default new class BlogPo {
    private selector = '[resource=blog][authorize=createPost]';

    waitForVisible(): WebdriverIO.Client<boolean> {
        return browser.waitForVisible(this.selector);
    }

    get newPost(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>(this.selector);
    }
}
