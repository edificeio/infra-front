# Contributing

Thanks for taking the time to contribute! :+1:

## Code contributions

The minimum requirements for code contributions are:

1. The project build must
   [pass locally](#running-the-project-build)
2. The tests must
   [pass locally](#running-the-tests)
3. Commit message must
   [respect the conventional commits specs](https://www.conventionalcommits.org),
   please [lint your commit message](#lint-commit-message) before pushing
4. Put yourself as
   [a contributor of the project](#recognize-contributions)

### Running the project build

Please follow the instructions given in the [referential manual](https://opendigitaleducation.gitbooks.io/reference-manual/content/)
and in the [install guide](INSTALL.md).

### Running the tests

#### Unit tests

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

#### End-to-end tests

```shell
# /!\ needs env. variables E2E_USERNAME and E2E_PASSWORD
# which are the credentials to connect to the entcore platform
E2E_USERNAME=myUsername E2E_PASSWORD=myPassword npm run test:end-to-end

# On BrowserStack browsers
BROWSERSTACK=true E2E_USERNAME=myUsername E2E_PASSWORD=myPassword npm run test:end-to-end

# With a different base URL (default is http://localhost:8090/)
E2E_BASE_URL=http://my-example.com E2E_USERNAME=myUsername E2E_PASSWORD=myPassword npm run test:end-to-end
```

### Lint commit message

You can lint your commit message before pushing with the following command:
```shell
npm run lint:commit
```

## Choices

- why karma?

Karma is a javascript test runner that runs unit tests in browser environments.
Most alternative test runners run tests in the node.js environment.

- why jasmine?

Jasmine is a full-featured (assertions, mocks, etc.) test framework.
A lot of resources can be found in the web about Jasmine.

- why webdriver.io?

Webdriver.io is a low level API to write functional tests using the standard web driver api.

# Maintaining

## Code of conduct

To update the code of conduct run:

```shell
npm run code-of-conduct
```

## Changelog

The `changelog` script can help you maintaining the changelog:

```shell
npm run changelog
```

Check the diffs (ex. revert irrelevant changes, fix non-semantic entry, etc.).

## Recognize contributions

To check contributors against the github contributors run:

```shell
npm run contributors:check
```

To add a new contributor run:

```shell
npm run contributors:add -- username scope1,scope2
# example with a contributor who did bug reports and documentation
npm run contributors:add -- SGrenet bug,doc
```