export default new class EditorPo {
    private selector = `.drawing-zone`;

    waitForVisible(): WebdriverIO.Client<boolean> {
        return browser.waitForVisible(this.selector);
    }

    get editor(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>(this.selector);
    }
}
