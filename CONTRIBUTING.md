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