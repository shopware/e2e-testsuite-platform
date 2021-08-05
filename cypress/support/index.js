// Import general dependencies
const _ = require('lodash');
const uuid = require('uuid/v4');

require('@cypress/skip-test/support');

// Import commands.js
require('./commands/commands');

// Import api commands.js
require('./commands/api-commands');

// Import fixture commands.js
require('./commands/fixture-commands');

// Import fixture commands.js
require('./commands/storefront-api-commands');

// Import fixture commands.js
require('./commands/system-commands');

Cypress.on('uncaught:exception', (err, runnable) => {
    // returning false here prevents Cypress from
    // failing the test
    return false;
});

before(() => {
    cy.activateShopwareTheme();
});

Cypress.Screenshot.defaults({
    capture: 'viewport'
});
