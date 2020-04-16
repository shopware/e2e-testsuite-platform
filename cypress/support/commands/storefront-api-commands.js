const sample = require('lodash.sample');

/**
 * Get the sales channel Id via Admin API
 * @memberOf Cypress.Chainable#
 * @name getSalesChannelId
 * @function
 */
Cypress.Commands.add('getSalesChannelId', () => {
    return cy.authenticate().then((result) => {
        const parameters = {
            data: {
                headers: {
                    Accept: 'application/vnd.api+json',
                    Authorization: `Bearer ${result.access}`,
                    'Content-Type': 'application/json'
                },
                field: 'name',
                value: Cypress.env('salesChannelName')
            },
            endpoint: 'sales-channel'
        };

        return cy.searchViaAdminApi(parameters).then((data) => {
            return data.attributes.accessKey;
        });
    });
});

/**
 * Performs Storefront Api Requests
 * @memberOf Cypress.Chainable#
 * @name storefrontApiRequest
 * @function
 * @param {string} HTTP-Method
 * @param {string} endpoint name
 * @param {Object} header
 * @param {Object} body
 */
Cypress.Commands.add('storefrontApiRequest', (method, endpoint, header = {}, body = {}) => {
    return cy.getSalesChannelId().then((salesChannelAccessKey) => {
        const requestConfig = {
            headers: {
                'SW-Access-Key': salesChannelAccessKey,
                ...header
            },
            body: {
                ...body
            },
            method: method,
            url: `/sales-channel-api/**/${endpoint}`
        };

        return cy.request(requestConfig).then((result) => {
            return result.body.data;
        });
    });
});

/**
 * Returns random product with id, name and url to view product
 * @memberOf Cypress.Chainable#
 * @name getRandomProductInformationForCheckout
 * @function
 */
Cypress.Commands.add('getRandomProductInformationForCheckout', () => {
    return cy.storefrontApiRequest('GET', 'product').then((result) => {
        const randomProduct = sample(result);

        return {
            id: randomProduct.id,
            name: randomProduct.name,
            net: randomProduct.price.net,
            gross: randomProduct.price.gross,
            listingPrice: randomProduct.calculatedListingPrice.unitPrice,
            url: `/detail/${randomProduct.id}`
        };
    });
});

/**
 * Create customer fixture using Shopware API at the given endpoint
 * @memberOf Cypress.Chainable#
 * @name createCustomerFixtureStorefront
 * @function
 * @param {Object} [userData={}] - Custom data for the customer to be created
 */
Cypress.Commands.add('createCustomerFixtureStorefront', (userData) => {
    const addressId = uuid().replace(/-/g, '');
    const customerId = uuid().replace(/-/g, '');
    let customerJson = {};
    let customerAddressJson = {};
    let finalAddressRawData = {};
    let countryId = '';
    let groupId = '';
    let paymentId = '';
    let salesChannelId = '';
    let salutationId = '';

    return cy.fixture('customer').then((result) => {
        customerJson = Cypress._.merge(result, userData);

        return cy.fixture('customer-address')
    }).then((result) => {
        customerAddressJson = result;

        return cy.searchViaAdminApi({
            endpoint: 'country',
            data: {
                field: 'iso',
                value: 'DE'
            }
        });
    }).then((result) => {
        countryId = result.id;

        return cy.searchViaAdminApi({
            endpoint: 'payment-method',
            data: {
                field: 'name',
                value: 'Invoice'
            }
        });
    }).then((result) => {
        paymentId = result.id;

        return cy.searchViaAdminApi({
            endpoint: 'sales-channel',
            data: {
                field: 'name',
                value: 'Storefront'
            }
        });
    }).then((result) => {
        salesChannelId = result.id;

        return cy.searchViaAdminApi({
            endpoint: 'customer-group',
            data: {
                field: 'name',
                value: 'Standard customer group'
            }
        });
    }).then((result) => {
        groupId = result.id;

        return cy.searchViaAdminApi({
            endpoint: 'salutation',
            data: {
                field: 'displayName',
                value: 'Mr.'
            }
        });
    }).then((salutation) => {
        salutationId = salutation.id;

        finalAddressRawData = Cypress._.merge({
            addresses: [{
                customerId: customerId,
                salutationId: salutationId,
                id: addressId,
                countryId: countryId
            }]
        }, customerAddressJson);
    }).then(() => {
        return Cypress._.merge(customerJson, {
            salutationId: salutationId,
            defaultPaymentMethodId: paymentId,
            salesChannelId: salesChannelId,
            groupId: groupId,
            defaultBillingAddressId: addressId,
            defaultShippingAddressId: addressId
        });
    }).then((result) => {
        return Cypress._.merge(result, finalAddressRawData);
    }).then((result) => {
        return cy.createViaAdminApi({
            endpoint: 'customer',
            data: result
        });
    });
});

/**
 * Create a customer group and assign it to a customer
 * @memberOf Cypress.Chainable#
 * @name setCustomerGroup
 * @function
 * @param {String} endpoint - API endpoint for the request
 * @param {Object} [options={}] - Options concerning deletion
 */
Cypress.Commands.add('setCustomerGroup', (customerNumber, customerGroupData) => {
    let customer = '';

    return cy.fixture('customer-group').then((json) => {
        return cy.createViaAdminApi({
            endpoint: 'customer-group',
            data: customerGroupData
        });
    }).then(() => {
        return cy.searchViaAdminApi({
            endpoint: 'customer',
            data: {
                field: 'customerNumber',
                value: customerNumber
            }
        });
    }).then((result) => {
        customer = result;

        return cy.searchViaAdminApi({
            endpoint: 'customer-group',
            data: {
                field: 'name',
                value: customerGroupData.name
            }
        });
    }).then((result) => {
        return cy.updateViaAdminApi('customer', customer.id, {
            data: {
                groupId: result.id
            }
        })
    });
});