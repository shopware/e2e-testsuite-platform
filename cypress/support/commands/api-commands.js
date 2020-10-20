const Fixture = require('../service/administration/fixture.service');

/**
 * Authenticate towards the Shopware API
 * @memberOf Cypress.Chainable#
 * @name authenticate
 * @function
 */
Cypress.Commands.add('authenticate', () => {
    return cy.request(
        'POST',
        '/api/oauth/token',
        {
            grant_type: Cypress.env('grant') ? Cypress.env('grant') : 'password',
            client_id: Cypress.env('client_id') ? Cypress.env('client_id') : 'administration',
            scopes: Cypress.env('scope') ? Cypress.env('scope') : 'write',
            username: Cypress.env('username') ? Cypress.env('user') : 'admin',
            password: Cypress.env('password') ? Cypress.env('pass') : 'shopware'
        }
    ).then((responseData) => {
        return {
            access: responseData.body.access_token,
            refresh: responseData.body.refresh_token,
            expiry: Math.round(+new Date() / 1000) + responseData.body.expires_in
        };
    });
});

/**
 * Logs in silently using Shopware API
 * @memberOf Cypress.Chainable#
 * @name loginViaApi
 * @function
 */
Cypress.Commands.add('loginViaApi', () => {
    return cy.authenticate().then((result) => {
        return cy.window().then((win) => {
            cy.setCookie('bearerAuth', JSON.stringify(result));

            // Return bearer token
            return cy.getCookie('bearerAuth');
        });
    });
});

/**
 * Add role with Permissions
 * @memberOf Cypress.Chainable#
 * @name loginAsUserWithPermissions
 * @function
 * @param {Array} permissions - The permissions for the role
 */
Cypress.Commands.add('loginAsUserWithPermissions', {
    prevSubject: false
}, (permissions) => {
    cy.window().then(($w) => {
        const roleID = 'ef68f039468d4788a9ee87db9b3b94de';
        const localeId = $w.Shopware.State.get('session').currentUser.localeId;
        const headers = {
            Accept: 'application/vnd.api+json',
            Authorization: `Bearer ${$w.Shopware.Context.api.authToken.access}`,
            'Content-Type': 'application/json'
        };

        // save role
        cy.request({
            url: `/api/${Cypress.env('apiVersion')}/acl-role`,
            method: 'POST',
            headers: headers,
            body: {
                id: roleID,
                name: 'e2eRole',
                privileges: (() => {
                    const privilegesService = $w.Shopware.Service('privileges');

                    const requiredPermissions = privilegesService.getRequiredPrivileges();
                    const selectedPrivileges = permissions.reduce((selectedPrivileges, { key, role }) => {
                        const identifier = `${key}.${role}`;

                        selectedPrivileges.push(
                            identifier,
                            ...privilegesService.getPrivilegeRole(identifier).privileges
                        );

                        return selectedPrivileges;
                    }, []);

                    return [
                        ...selectedPrivileges,
                        ...requiredPermissions
                    ];
                })()
            }
        }).then(response => {
            // get user verification
            cy.request({
                url: '/api/oauth/token',
                method: 'POST',
                headers: headers,
                body: {
                    client_id: 'administration',
                    grant_type: 'password',
                    password: 'shopware',
                    scope: 'user-verified',
                    username: 'admin'
                }
            });
        }).then(response => {
            // save user
            cy.request({
                url: `/api/${Cypress.env('apiVersion')}/user`,
                method: 'POST',
                headers: {
                    Accept: 'application/vnd.api+json',
                    Authorization: `Bearer ${response.body.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: {
                    aclRoles: [{ id: roleID }],
                    admin: false,
                    email: 'max@muster.com',
                    firstName: 'Max',
                    id: 'b7fb49e9d86d4e5b9b03c9d6f929e36b',
                    lastName: 'Muster',
                    localeId: localeId,
                    password: 'Passw0rd!',
                    username: 'maxmuster'
                }
            });
        });

        // logout
        cy.get('.sw-admin-menu__user-actions-toggle').click();
        cy.clearCookies();
        cy.get('.sw-admin-menu__logout-action').click();
        cy.get('.sw-login__container').should('be.visible');
        cy.reload().then(() => {
            cy.get('.sw-login__container').should('be.visible');

            // login
            cy.get('#sw-field--username').type('maxmuster');
            cy.get('#sw-field--password').type('Passw0rd!');
            cy.get('.sw-login__login-action').click();
            cy.contains('Max Muster');
        })

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
    const fixture = new Fixture();

    return fixture.search(data.endpoint, {
        field: data.data.field,
        type: 'equals',
        value: data.data.value
    });
});

/**
 * Handling API requests
 * @memberOf Cypress.Chainable#
 * @name requestAdminApi
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
            const responseBodyObj = response.body ? JSON.parse(response.body) : response;

            if (Array.isArray(responseBodyObj.data) && responseBodyObj.data.length <= 1) {
                return responseBodyObj.data[0];
            }
            return responseBodyObj.data;
        }
        return response;
    });
});

/**
 * Handling API requests
 * @memberOf Cypress.Chainable#
 * @name clearCacheAdminApi
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
    return cy.requestAdminApi('PATCH', `${Cypress.env('apiPath')}/${endpoint}/${id}`, data).then((responseData) => {
        return responseData;
    });
});
