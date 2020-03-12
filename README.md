# E2E Platform Testsuite for Shopware 6

![GitHub](https://img.shields.io/github/license/shopware/e2e-testsuite-platform)
![GitHub last commit](https://img.shields.io/github/last-commit/shopware/e2e-testsuite-platform)
![David](https://img.shields.io/david/shopware/e2e-testsuite-platform)
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/shopware/e2e-testsuite-platform)

* [Setup for plugins](#setup-for-plugins)
* [Writing tests](#writing-tests)
* [Locally running tests](#locally-running-tests)
* [Gitlab integration](#gitlab-integration)
* [Commands](#commands)
  + [General commands](#general-commands)
  + [Storefront commands](#storefront-commands)
  + [System commands](#system-commands)
  + [API commands](#api-commands)
* [Local development of the testsuite](#local-development-of-the-testsuite)

This package contains the e2e test suite for Shopware 6. The test suite is built on top of [Cypress](https://github.com/cypress-io/cypress) as well as the following Cypress plugins:

- [`cypress-select-tests`](https://github.com/bahmutov/cypress-select-tests)
- [`cypress-log-to-output`](https://github.com/flotwig/cypress-log-to-output)
- [`cypress-file-upload`](https://github.com/abramenal/cypress-file-upload)

## Setup for plugins

Depending on your environment (administration or storefront) please create the following folder structure:

```text
Resources
  `-- app
    `-- <environment>
      `-- test
        `-- e2e
          `-- cypress
            |-- fixtures
            |-- integration
            |-- plugins
            `-- support
```

Inside the `Resources/app/<environment>/test/e2e` folder, please run `npm init -y` to create a `package.json`. It's very convenient to place a script inside the newly created `package.json` to run the tests locally. To do so, please add the following section:

```json
"scripts": {
   "open": "node_modules/.bin/cypress open"
},
```

Now install this package using the following command:

```bash
npm install --save @shopware-ag/e2e-testsuite-platform
```

Next up, please create a new file `e2e/cypress/plugins/index.js` with the following content:

```js
module.exports = require('@shopware-ag/e2e-testsuite-platform/cypress/plugins');
```

Last but not least, create a new file `e2e/cypress/support/index.js` with the following content:

```js
// Require test suite commons
require('@shopware-ag/e2e-testsuite-platform/cypress/support');
```

## Writing tests

Please head over to the [Cypress documentation](https://docs.cypress.io/guides/getting-started/writing-your-first-test.html#Add-a-test-file) to get familiar with the testing framework. As please get familar with our [documentation for Cypress in Shopware](https://docs.shopware.com/en/shopware-platform-dev-en/internals/testing/end-to-end-testing) and our  [how-to guide on how to write test using Cypress](https://docs.shopware.com/en/shopware-platform-dev-en/how-to/end-to-end-tests-in-plugins).

## Locally running tests

Switch to the folder `Resources/app/<enviroment>/test/e2e` and execute the following command:

```bash
CYPRESS_baseUrl=<your-url> npm run open
```

It opens up the Cypress test runner which allows you to run and debug your tests.

## Gitlab integration

In the following configuration, a new job called `.E2E` was created as a template. It installs shopware, installs the plugin, initializes the administration and storefront, sets up a testing database and executes the tests.

```yml
.E2E:
    stage: E2E
    dependencies: []
    services:
        -   name: docker:18.09.7-dind
            alias: docker
        -   name: mariadb:10.3
            alias: mysql
    artifacts:
        when: always
        paths:
            - development/build/artifacts/e2e/
        reports:
            junit: development/build/artifacts/e2e/*.xml
    script:
        - ./psh.phar init --APP_ENV="prod"
        - php bin/console plugin:refresh
        - php bin/console plugin:install --activate $PLUGINAME -c
        - ./psh.phar storefront:init --APP_ENV="prod" --DB_NAME="shopware_e2e"
        - ./psh.phar administration:init --APP_ENV="prod"
        - ./psh.phar e2e:dump-db --APP_ENV="prod"
        - chown -R 1000:1000 .
        - docker run --name cypress -d -t --add-host="docker.vm:$(hostname -I)" -e CYPRESS_baseUrl=http://docker.vm:8000 -v $(pwd)/custom/plugins/$PLUGINAME/src/Resources/app/$MODULE/test/e2e:/e2e -v $(pwd):/app cypress/browsers:node10.11.0-chrome75
        - docker exec cypress npm clean-install --prefix /e2e
        - forever start custom/plugins/$PLUGINAME/src/Resources/app/$MODULE/test/e2e/node_modules/@shopware-ag/e2e-testsuite/routes/cypress.js
        - docker exec cypress npx cypress run --project /e2e --browser chrome --config baseUrl=http://docker.vm:8000 --config numTestsKeptInMemory=0 --spec e2e/cypress/integration/**/*
        - docker rm -f cypress

Administration E2E:
    extends: .E2E
    variables:
        MODULE: "administration"
        PLUGINAME: "SwagCustomizedProduct"

Storefront E2E:
    extends: .E2E
    variables:
        MODULE: "storefront"
        PLUGINAME: "SwagCustomizedProduct"
```

At the bottom of the configuration file we created another job called `Administration E2E`. It extends the previously created job `.E2E` and sets up enviroment variables to modify the plugin name as well as the enviroment (administration or storefront).

## Commands

The package contains a bunch of pre-built commands for easier navigation in the administration as well as storefront using Cypress.

### General commands

#### Switches administration UI locale to EN_GB

```js
cy.setLocaleToEnGb()
```

#### Logs in to the Administration manually

```js
cy.login(userType)
```

#### Types in an input element and checks if the content was correctly typed

```js
cy.get('input[name="companyName"]').typeAndCheck('shopware AG');
```

#### Clears field, types in an input element and checks if the content was correctly typed

```js
cy.get('input[name="companyName"]').clearTypeAndCheck('shopware AG');
```

#### Clears field, types in an input element, checks if the content was correctly typed and presses enter

```js
cy.get('input[name="companyName"]').clearTypeCheckAndEnter('shopware AG');
```

#### Types in a sw-select field and checks if the content was correctly typed (multi select)

```js
cy.get('.select-payment-method')
  .typeMultiSelectAndCheck('Invoice', {
    searchTerm: 'Invoice'
  });
```

#### Types in an sw-select field (single select)

```js
cy.get('.sw-sales-channel-switch')
  .typeSingleSelect('Storefront', '.sw-entity-single-select');
```

#### Types in an sw-select field and checks if the content was correctly typed (single select)

```js
cy.get('.sw-sales-channel-switch')
  .typeSingleSelectAndCheck('Storefront', '.sw-entity-single-select');
```

#### Types in an legacy swSelect field and checks if the content was correctly typed

```js
cy.get('.sw-settings-shipping-detail__delivery-time')
  .typeLegacySelectAndCheck(
    '1-3 days', {
        searchTerm: '1-3 days'
    }
);
```

#### Types in the global search field and verify search terms in url

```js
cy.get('.sw-search-bar__input').typeAndCheckSearchField('Ruler');
```

#### Wait for a notification to appear and check its message

```js
cy.awaitAndCheckNotification('Shipping method "Luftpost" has been deleted.');
```

#### Click context menu in order to cause a desired action

```js
cy.clickContextMenuItem(
    '.sw-customer-list__view-action',
    '.sw-context-button__button',
    `.sw-data-grid__row--0`
);
```

#### Navigate to module by clicking the corresponding main menu item

```js
cy.clickMainMenuItem({
    targetPath: '#/sw/product/index',
    mainMenuId: 'sw-catalogue',
    subMenuId: 'sw-product'
});
```

#### Click user menu to open it up

```js
cy.openUserActionMenu();
```

#### Performs a drag and drop operation

```js
cy.get('.sw-cms-sidebar__block-preview')
  .first()
  .dragTo('.sw-cms-section__empty-stage');
```

### Storefront commands

#### Get the sales channel Id via Admin API

```js
cy.getSalesChannelId()
```

#### Performs Storefront Api Requests

```js
cy.storefrontApiRequest(method, endpoint, header = {}, body = {})
```

#### Returns random product with id, name and url to view product

```js
cy.getRandomProductInformationForCheckout()
```

### System commands

#### Activates Shopware theme for Cypress test runner

```js
cy.activateShopwareTheme();
```

#### Cleans up any previous state by restoring database and clearing caches

```js
cy.cleanUpPreviousState();
```

#### Opens up the administration initially and waits for the "me" call to be successful

```js
cy.openInitialPage();
```

### API commands

#### Authenticate towards the Shopware API

```js
cy.authenticate()
```

#### Logs in silently using Shopware API

```js
cy.loginViaApi()
```

#### Search for an existing entity using Shopware API at the given endpoint

```js
cy.searchViaAdminApi(data)
```

#### Handling API requests

```js
cy.requestAdminApi(method, url, requestData)
```

#### Updates an existing entity using Shopware API at the given endpoint

```js
cy.updateViaAdminApi(endpoint, id, data)
```

## Local development of the testsuite

It's possible to use a local clone of the testsuite instead of the package here on Github. It opens up the ability to write new commands and / or modify the behavior of the testsuite without pushing it to the `master` branch. [`npm link`](https://docs.npmjs.com/cli/link.html) provides a convenient way for it.

```bash
git clone git@github.com:shopware/e2e-testsuite-platform.git
cd e2e-testsuite-platform
npm link

# Switch to the e2e folder inside your project for example:
# custom/plugins/customized-product/src/Resources/app/storefront/test/e2e

npm uninstall # removes the remote copy of the package from github
npm link @shopware-ag/e2e-testsuite-platform
```
