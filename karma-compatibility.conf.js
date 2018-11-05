const karmaBaseConf = require('./karma-base.conf');
const browsers = require('./browsers');
const customLaunchers = {};

browsers.forEach(browser => customLaunchers[browser.name] = {
    base: 'BrowserStack',
    browser: browser.browser,
    os: browser.os,
    os_version: browser.os_version,
    browser_version: browser.browser_version
});

module.exports = function (config) {
    const karmaCompatibilityConf = Object.assign({}, karmaBaseConf, {
        browserStack: {
            username: process.env.BROWSERSTACK_USERNAME,
            accessKey: process.env.BROWSERSTACK_ACCESSKEY
        },
        customLaunchers,
        browsers: Object.keys(customLaunchers),
        singleRun: true
    });

    config.set(karmaCompatibilityConf)
};
