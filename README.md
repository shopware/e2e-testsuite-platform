# E2E Testsuite for Shopware 6

![GitHub](https://img.shields.io/github/license/shopware/e2e-testsuite)
![GitHub last commit](https://img.shields.io/github/last-commit/shopware/e2e-testsuite)


This package contains the e2e test suite for Shopware 6. The test suite is built on top of [Cypress](https://github.com/cypress-io/cypress).

## Setup for plugins

Depending on your enviroment (administration or storefront) please create the following folder structure:

```text
Resources
  `-- app
    `-- administration
      `-- test
        `-- e2e
          `-- cypress
            |-- fixtures
            |-- integration
            |-- plugins
            `-- support
```

Inside the `Resources/app/<enviroment>/test/e2e` folder, please run `npm init -y` to create a `package.json`. It's very convinient to place a script inside the newly created `package.json` to run the tests locally. To do so, please add the following section:

```json
"scripts": {
   "open": "node_modules/.bin/cypress open"
},
```

Now install this package using the following command:

```bash
npm install --save @shopware/e2e-testsuite#master
```

Next up, please create a new file `e2e/cypress/plugins/index.js` with the following content:

```js
require('@shopware/e2e-testsuite/cypress/plugins');

module.exports = () => {};
```

Last but not least, create a new file `e2e/cypress/support/index.js` with the following content:

```js
// Require test suite commons
require('@shopware/e2e-testsuite/cypress/support');
```

## Running tests

Please head over to the [Cypress documentation](https://docs.cypress.io/guides/getting-started/writing-your-first-test.html#Add-a-test-file) to get familiar with the testing framework. As please get familar with our [guide on how to write test using Cypress](https://docs.shopware.com/en/shopware-platform-dev-en/how-to/end-to-end-tests-in-plugins).

## Locally running tests

Switch to the folder `Resources/app/<enviroment>/test/e2e` and execute the following command:

```bash
CYPRESS_baseUrl=<your-url> npm run open
```

It opens up the Cypress test runner which allows you to run and debug your tests.

### Gitlab integration

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
        - forever start custom/plugins/$PLUGINAME/src/Resources/app/$MODULE/test/e2e/node_modules/@shopware/e2e-testsuite/routes/cypress.js
        - docker exec cypress npx cypress run --project /e2e --browser chrome --config baseUrl=http://docker.vm:8000 --config numTestsKeptInMemory=0 --spec e2e/cypress/integration/**/*
        - docker rm -f cypress

Administration E2E:
    extends: .E2E
    variables:
        MODULE: "administration"
        PLUGINAME: "SwagCustomizedProduct"
```

At the bottom of the configuration file we created another job called `Administration E2E`. It extends the previously created job `.E2E` and sets up enviroment variables to modify the plugin name as well as the enviroment (administration or storefront).
