const path = require('path');
const fs = require('fs');

/**
 * Activates Shopware theme for Cypress test runner
 * @memberOf Cypress.Chainable#
 * @name activateShopwareTheme
 * @function
 */
Cypress.Commands.add('activateShopwareTheme', () => {
    const isStyleLoaded = $head => $head.find('#cypress-dark').length > 0;
    const themeFilename = 'node_modules/@shopware/e2e-testsuite/theme/shopware.css';

    // Cypress includes jQuery
    const $head = Cypress.$(parent.window.document.head); // eslint-disable-line no-restricted-globals
    if (isStyleLoaded($head) || !Cypress.config('useShopwareTheme')) {
        return;
    }

    $head.append(
        `<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/brands.css" integrity="sha384-i2PyM6FMpVnxjRPi0KW/xIS7hkeSznkllv+Hx/MtYDaHA5VcF0yL3KVlvzp8bWjQ" crossorigin="anonymous">
<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/fontawesome.css" integrity="sha384-sri+NftO+0hcisDKgr287Y/1LVnInHJ1l+XC7+FOabmTTIK0HnE2ID+xxvJ21c5J" crossorigin="anonymous">
<link rel="stylesheet" href="https://gitcdn.xyz/repo/shopware/e2e-testsuite/master/theme/shopware.css" crossorigin="anonymous">`
    );
});

/**
 * Cleans up any previous state by restoring database and clearing caches
 * @memberOf Cypress.Chainable#
 * @name cleanUpPreviousState
 * @function
 */
Cypress.Commands.add('cleanUpPreviousState', () => {
    if (Cypress.env('localUsage')) {
        return cy.exec(`${Cypress.env('projectRoot')}/psh.phar e2e:restore-db`)
            .its('stdout').should('contain', 'All commands successfully executed!');
    }

    return cy.request(`http://${new URL(Cypress.config('baseUrl')).hostname}:8005/cleanup`)
        // ToDo: Remove when cypress issue #5150 is released:
        //  https://github.com/cypress-io/cypress/pull/5150/files
        .its('body').should('eq', 'success');
});

/**
 * Cleans up any previous state by restoring database and clearing caches
 * @memberOf Cypress.Chainable#
 * @name openInitialPage
 * @function
 */
Cypress.Commands.add('openInitialPage', (url) => {
    // Request we want to wait for later
    cy.server();
    cy.route(`${Cypress.env('apiPath')}/_info/me`).as('meCall');


    cy.visit(url);
    cy.wait('@meCall').then((xhr) => {
        expect(xhr).to.have.property('status', 200);
    });
    cy.get('.sw-desktop').should('be.visible');
});

/**
 * Switches administration UI locale to EN_GB
 * @memberOf Cypress.Chainable#
 * @name setLocaleToEnGb
 * @function
 */
Cypress.Commands.add('setLocaleToEnGb', () => {
    return cy.window().then((win) => {
        win.localStorage.setItem('sw-admin-locale', Cypress.env('locale'));
    });
});

// WaitUntil command is from https://www.npmjs.com/package/cypress-wait-until
const logCommand = ({ options, originalOptions }) => {
    if (options.log) {
        options.logger({
            name: options.description,
            message: options.customMessage,
            consoleProps: () => originalOptions
        });
    }
};
const logCommandCheck = ({ result, options, originalOptions }) => {
    if (!options.log || !options.verbose) return;

    const message = [result];
    if (options.customCheckMessage) {
        message.unshift(options.customCheckMessage);
    }
    options.logger({
        name: options.description,
        message,
        consoleProps: () => originalOptions
    });
};

const waitUntil = (subject, checkFunction, originalOptions = {}) => {
    if (!(checkFunction instanceof Function)) {
        throw new Error("`checkFunction` parameter should be a function. Found: " + checkFunction);
    }

    const defaultOptions = {
        // base options
        interval: 200,
        timeout: 5000,
        errorMsg: "Timed out retrying",

        // log options
        description: "waitUntil",
        log: true,
        customMessage: undefined,
        logger: Cypress.log,
        verbose: false,
        customCheckMessage: undefined
    };
    const options = { ...defaultOptions, ...originalOptions };

    // filter out a falsy passed "customMessage" value
    options.customMessage = [options.customMessage, originalOptions].filter(Boolean);

    let retries = Math.floor(options.timeout / options.interval);

    logCommand({ options, originalOptions });

    const check = result => {
        logCommandCheck({ result, options, originalOptions });
        if (result) {
            return result;
        }
        if (retries < 1) {
            throw new Error(options.errorMsg);
        }
        cy.wait(options.interval, { log: false }).then(() => {
            retries--;
            return resolveValue();
        });
    };

    const resolveValue = () => {
        const result = checkFunction(subject);

        const isAPromise = Boolean(result && result.then);
        if (isAPromise) {
            return result.then(check);
        } else {
            return check(result);
        }
    };

    return resolveValue();
};

/**
 * Extend Cypress waiting capabilities to wait for (almost everything)
 * @memberOf Cypress.Chainable#
 * @name setLocaleToEnGb
 * @function
 */
Cypress.Commands.add("waitUntil", { prevSubject: "optional" }, waitUntil);
