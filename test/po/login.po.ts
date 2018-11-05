export default new class LoginPo {
    navigateToPage():  WebdriverIO.Client<boolean> {
        browser.url('/auth/login');
        return this.username.waitForVisible();
    }

    get username(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>('#email');
    }

    get password(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>('#password');
    }

    get form(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>('form');
    }

    get submitButton(): WebdriverIO.Client<WebdriverIO.Element> {
        return browser.element<WebdriverIO.Element>('button.right-magnet')
    }
}
