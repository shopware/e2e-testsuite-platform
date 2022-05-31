const sample = require('lodash.sample');
const { v4: uuid } = require('uuid');

const ProductWishlistFixture = require('../service/fixture/product-wishlist.fixture');
const RuleBuilderFixture = require('../service/fixture/rule-builder.fixture');

/**
 * Sends a POST using the admin api to the server
 * @memberOf Cypress.Chainable#
 * @name createViaAdminApi
 * @param {Object} data - Custom data
 * @function
 */
Cypress.Commands.add('createViaAdminApi', (data) => {
    return cy.requestAdminApi(
        'POST',
        `${Cypress.env('apiPath')}/${data.endpoint}?response=true`,
        data
    ).then((responseData) => {
        return responseData;
    });
});

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
 * Performs Storefront API Requests
 * @memberOf Cypress.Chainable#
 * @name storefrontApiRequest
 * @function
 * @param {string} method HTTP-Method
 * @param {string} endpoint name
 * @param {Object} [header={}]
 * @param {Object} [body={}]
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
            url: `/store-api/${endpoint}`
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
        const randomProduct = sample(result.elements);

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
 * @param {Object} userData - Custom data for the customer to be created
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
        return cy.requestAdminApiStorefront({
            endpoint: 'customer',
            data: result
        });
    });
});

/**
 * Creates an entity using Shopware API at the given endpoint
 * @memberOf Cypress.Chainable#
 * @name requestAdminApiStorefront
 * @function
 * @param {Object} data - Necessary  for the API request
 */
Cypress.Commands.add('requestAdminApiStorefront', (data) => {
    return cy.requestAdminApi(
        'POST',
        `${Cypress.env('apiPath')}/${data.endpoint}?response=true`,
        data
    ).then((responseData) => {
        return responseData;
    });
});

/**
 * Create customer fixture using Shopware API at the given endpoint, tailored for Storefront
 * @memberOf Cypress.Chainable#
 * @name createCustomerFixtureStorefront
 * @function
 * @param {Object} userData - Options concerning creation
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
        return cy.requestAdminApiStorefront({
            endpoint: 'customer',
            data: result
        });
    });
});

/**
 * Sets the analytics tracking to the desired state in Storefront sales channel
 * @memberOf Cypress.Chainable#
 * @name setAnalyticsFixtureToSalesChannel
 * @function
 * @param {Boolean} state - true: tracking is activated, false: tracking is deactivated
 */
Cypress.Commands.add('setAnalyticsFixtureToSalesChannel', (state) => {
    return cy.searchViaAdminApi({
        endpoint: 'sales-channel',
        data: {
            field: 'name',
            value: 'Storefront'
        }
    }).then((result) => {
        return cy.updateViaAdminApi('sales-channel', result.id, {
            data: {
                analytics: {
                    trackingId: 'UA-000000000-0',
                    active: state,
                    trackOrders: state,
                    anonymizeIp: state
                }
            }
        })
    });
});

/**
 * Create rule by fixture, tailored for Storefront
 * @memberOf Cypress.Chainable#
 * @name loginByGuestAccountViaApi
 * @function
 * @param {Object} [userData={}] - Options concerning creation
 * @param {String} [shippingMethodName="Standard"] - NAme of the shipping method
 */
Cypress.Commands.add('createRuleFixtureStorefront', (userData = {}, shippingMethodName = 'Standard') => {
    return cy.authenticate().then((authInformation) => {
        const fixture = new RuleBuilderFixture(authInformation);

        return cy.fixture('rule-builder-shipping-payment.json').then((result) => {
            return Cypress._.merge(result, userData);
        }).then((data) => {
            return fixture.setRuleFixture(data, shippingMethodName);
        })
    });
});

/**
 * Set the product to the wishlist
 * @memberOf Cypress.Chainable#
 * @name setProductWishlist
 * @function
 * @param {Object} obj - Product information
 * @param {String} obj.productId - Id of required product
 * @param {String} obj.customer - Customer of wishlist
 */
Cypress.Commands.add('setProductWishlist', ({productId, customer}) => {
    const fixture = new ProductWishlistFixture();

    return fixture.setProductWishlist(productId, customer);
});

/**
 * Login by guest account, tailored for Storefront
 * @memberOf Cypress.Chainable#
 * @name loginByGuestAccountViaApi
 * @param {Object} userData - Custom data
 * @function
 */
Cypress.Commands.add('loginByGuestAccountViaApi', (userData) => {
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

    return cy.fixture('guest').then((result) => {
        customerJson = Cypress._.merge(result, userData);

        return cy.fixture('guest-address')
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
            billingAddress: {
                customerId: customerId,
                salutationId: salutationId,
                id: addressId,
                countryId: countryId
            }
        }, customerAddressJson);
    }).then(() => {
        return Cypress._.merge(customerJson, {
            salutationId: salutationId,
            defaultPaymentMethodId: paymentId,
            salesChannelId: salesChannelId,
            groupId: groupId,
            defaultBillingAddressId: addressId,
            defaultShippingAddressId: addressId,
            storefrontUrl: Cypress.config('baseUrl'),
            _csrf_token: '1b4dfebfc2584cf58b63c72c20d521d0frontend.store-api.proxy#'
        });
    }).then((result) => {
        return Cypress._.merge(result, finalAddressRawData);
    }).then((result) => {
        cy.storefrontApiRequest('POST', '/account/register&response=true', {}, result);
    });
});