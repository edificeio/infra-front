Contributing
---

## Running unit tests

```shell
# install dependencies:
npm install

# run unit tests on local firefox and chrome:
npm run test

# override the default browsers, e.g. run unit tests only on local firefox:
npm run test -- --browsers=Firefox

# /!\ needs env. variables BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESSKEY
# run unit tests on browserStack:
npm run test:compatibility
# only on ie11:
npm run test:compatibility -- --browsers=bs_ie_11_windows10
```

## Running end-to-end tests

```shell
# /!\ needs env. variables E2E_USERNAME and E2E_PASSWORD
# which are the credentials to connect to the entcore platform
E2E_USERNAME=myUsername E2E_PASSWORD=myPassword npm run test:end-to-end

# On BrowserStack browsers
BROWSERSTACK=true E2E_USERNAME=myUsername E2E_PASSWORD=myPassword npm run test:end-to-end

# With a different base URL (default is http://localhost:8090/)
E2E_BASE_URL=http://my-example.com E2E_USERNAME=myUsername E2E_PASSWORD=myPassword npm run test:end-to-end
```


## choices

- why karma?

Karma is a javascript test runner that runs unit tests in browser environments.
Most alternative test runners run tests in the node.js environment.

- why jasmine?

Jasmine is a full-featured (assertions, mocks, etc.) test framework.
A lot of resources can be found in the web about Jasmine.

- why webdriver.io?

Webdriver.io is a low level API to write functional tests using the standard web driver api.

