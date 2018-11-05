export default new class BlogListPo {
    navigateToPage(): void {
        browser.url('/blog');
        this.card.waitForVisible();
    }

    get card(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>('.card');
    }
}
