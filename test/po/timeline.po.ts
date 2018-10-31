export default new class TimelinePo {
    waitForVisible(): WebdriverIO.Client<boolean> {
        return browser.waitForVisible('.widgets-friend');
    }
}