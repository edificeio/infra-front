export class ToolbarPo {
    private justifyRightSelector = `.option.justify-right`;
    private formatSelector = `.option.format`;

    get justifyRight(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>(this.justifyRightSelector);
    }

    get format(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>(this.formatSelector);
    }
}

export default new class EditorPo {
    private contentSelector = `.drawing-zone`;
    private toolbarPo = new ToolbarPo();

    waitForVisible(): WebdriverIO.Client<boolean> {
        return browser.waitForVisible(this.contentSelector);
    }

    get content(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>(this.contentSelector);
    }

    get toolbar(): ToolbarPo {
        return this.toolbarPo;
    }
}
