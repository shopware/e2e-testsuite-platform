const Fixture = require('../service/administration/fixture.service');

/**
 * Authenticate towards the Shopware API
 * @memberOf Cypress.Chainable#
 * @name authenticate
 * @function
 */
Cypress.Commands.add('authenticate', () => {
    return cy.getCookie('_apiAuth').then((cookie) => {
        if (cookie) {
            return cy.log('cached /api/oauth/token')
                .then(() => JSON.parse(cookie.value));
        }

        return cy.request(
            'POST',
            '/api/oauth/token',
            {
                grant_type: Cypress.env('grant') ? Cypress.env('grant') : 'password',
                client_id: Cypress.env('client_id') ? Cypress.env('client_id') : 'administration',
                scopes: Cypress.env('scope') ? Cypress.env('scope') : 'write',
                username: Cypress.env('username') || Cypress.env('user') || 'admin',
                password: Cypress.env('password') || Cypress.env('pass') || 'shopware'
            }
        ).then((responseData) => {
            let result = responseData.body;
            result.access = result.access_token;
            result.refresh = result.refresh_token;
            result.expiry = Math.round(+new Date() / 1000) + responseData.body.expires_in;

            cy.log('request /api/oauth/token')

            // auth token needs to have at least x seconds of lifetime left
            const minimumLifetime = Cypress.env('minAuthTokenLifetime') || 60;
            return cy.setCookie(
                '_apiAuth',
                JSON.stringify(result),
                { expiry: result.expiry - minimumLifetime}
            ).then(() => result)
        });
    })
});

/**
 * Logs in silently using Shopware API
 * @memberOf Cypress.Chainable#
 * @name loginViaApi
 * @function
 */
Cypress.Commands.add('loginViaApi', () => {
    return cy.authenticate().then((result) => {
        // we do not need to expire this because the refresh token is valid for a week and this cookie is not persisted
        cy.setCookie(
            'bearerAuth',
            JSON.stringify(result),
            {
                path: Cypress.env('admin'),
                sameSite: "strict"
            }
        );

        // Return bearer token
        return cy.getCookie('bearerAuth');
    });
});

/**
 * Search for an existing entity using Shopware API at the given endpoint
 * @memberOf Cypress.Chainable#
 * @name searchViaAdminApi
 * @function
 * @param {Object} data - Necessary data for the API request
 */
Cypress.Commands.add('searchViaAdminApi', (data) => {
    return cy.authenticate().then((authInformation) => {
        const fixture = new Fixture(authInformation);

        return fixture.search(data.endpoint, {
            field: data.data.field,
            type: 'equals',
            value: data.data.value
        });
    });
});

/**
 * Handling Admin API requests
 * @memberOf Cypress.Chainable#
 * @name requestAdminApi
 * @param {String} method
 * @param {String} url
 * @param {Object} [requestData={}]
 * @function
 */
Cypress.Commands.add('requestAdminApi', (method, url, requestData = {}) => {
    return cy.authenticate().then((result) => {
        const requestConfig = {
            headers: {
                Accept: 'application/vnd.api+json',
                Authorization: `Bearer ${result.access}`,
                'Content-Type': 'application/json'
            },
            method: method,
            url: url,
            qs: {
                response: true
            },
            body: requestData.data
        };
        return cy.request(requestConfig);
    }).then((response) => {
        if (response.body) {
            let responseBodyObj;
            if (typeof response.body === 'object') {
                responseBodyObj = response.body;
            } else if(typeof response.body === 'string') {
                responseBodyObj = JSON.parse(response.body);
            } else {
                responseBodyObj = response;
            }

            if (Array.isArray(responseBodyObj.data) && responseBodyObj.data.length <= 1) {
                return responseBodyObj.data[0];
            }
            return responseBodyObj.data;
        }
        return response;
    });
});

/**
 * Clearing cache via API
 * @memberOf Cypress.Chainable#
 * @name clearCacheAdminApi
 * @param {String} method
 * @param {String} url
 * @function
 */
Cypress.Commands.add('clearCacheAdminApi', (method, url) => {
    return cy.authenticate().then((result) => {
        const requestConfig = {
            headers: {
                Authorization: `Bearer ${result.access}`
            },
            method: method,
            url: url
        };
        return cy.request(requestConfig);
    });
});

/**
 * Updates an existing entity using Shopware API at the given endpoint
 * @memberOf Cypress.Chainable#
 * @name updateViaAdminApi
 * @function
 * @param {String} endpoint - API endpoint for the request
 * @param {String} id - Id of the entity to be updated
 * @param {Object} data - Necessary data for the API request
 */
Cypress.Commands.add('updateViaAdminApi', (endpoint, id, data) => {
    return cy.requestAdminApi('PATCH', `api/${endpoint}/${id}`, data).then((responseData) => {
        return responseData;
    });
});
