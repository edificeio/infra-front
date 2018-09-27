const karmaBaseConf = require('./karma-base.conf');

module.exports = function (config) {
    const karmaCompatibilityConf = Object.assign({}, karmaBaseConf, {
        browserStack: {
            username: process.env.BROWSERSTACK_USERNAME,
            accessKey: process.env.BROWSERSTACK_ACCESSKEY
        },
        customLaunchers: {
            bs_chrome_latest_windows10: {
                base: 'BrowserStack',
                browser: 'Chrome',
                os: 'Windows',
                os_version: '10'
            },
            bs_edge_latest_windows10: {
                base: 'BrowserStack',
                browser: 'Edge',
                os: 'Windows',
                os_version: '10'
            },
            bs_ie_11_windows10: {
                base: 'BrowserStack',
                browser: 'IE',
                browser_version: '11',
                os: 'Windows',
                os_version: '10'
            },
            bs_ie_11_windows8: {
                base: 'BrowserStack',
                browser: 'IE',
                browser_version: '11',
                os: 'Windows',
                os_version: '8.1'
            },
            bs_safari_latest_macOS_HS: {
                base: 'BrowserStack',
                browser: 'Safari',
                os: 'OS X',
                os_version: 'High Sierra'
            }
        },
        browsers: [
            'bs_chrome_latest_windows10',
            'bs_edge_latest_windows10',
            'bs_ie_11_windows10',
            'bs_ie_11_windows8',
            'bs_safari_latest_macOS_HS'
        ],
        singleRun: true
    });

    config.set(karmaCompatibilityConf)
};
