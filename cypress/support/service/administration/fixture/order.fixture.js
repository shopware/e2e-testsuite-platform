const AdminFixtureService = require('../fixture.service.js');
const uuid = require('uuid/v4');

class OrderFixture extends AdminFixtureService {
    setOrderFixture(userData = {}) {
        const customerData = {
            firstName: 'Max',
            lastName: 'Mustermann',
            email: 'example@shopware.com',
            street: 'Ebbinghoff 10',
            zipcode: '48624',
            city: 'Schöppingen'
        };

        const findSalutationId = () => this.search('salutation', {
            field: 'displayName',
            type: 'equals',
            value: 'Mr.'
        });
        const findCountryId = () => this.search('country', {
            field: 'iso',
            type: 'equals',
            value: 'DE'
        });
        const findCurrencyId = () => this.search('currency', {
            field: 'name',
            type: 'equals',
            value: 'Euro'
        });
        const findStateId = () => this.search('state-machine-state', {
            field: 'technicalName',
            type: 'equals',
            value: 'open'
        });
        const findSalesChannelId = () => this.search('sales-channel', {
            field: 'name',
            type: 'equals',
            value: 'Headless'
        });

        return Promise.all([
            findSalutationId(),
            findCountryId(),
            findCurrencyId(),
            findStateId(),
            findSalesChannelId()
        ]).then(([salutation, country, currency, state, salesChannel]) => {
            if (state && state.length > 1) {
                state = state[0];
            }

            return Object.assign({}, {
                currencyId: currency.id,
                currencyFactor: currency.attributes.factor,
                stateId: state.id,
                salesChannelId: salesChannel.id,
                billingAddress: {
                    ...customerData,
                    salutationId: salutation.id,
                    countryId: country.id
                },
                orderCustomer: {
                    ...customerData,
                    salutationId: salutation.id,
                    billingAddress: {
                        ...customerData,
                        salutationId: salutation.id,
                        countryId: country.id
                    }
                }
            }, userData);
        }).then((finalOrderData) => {
            return this.apiClient.post('/order?_response=true', finalOrderData);
        });
    }
}

module.exports = OrderFixture;
global.OrderFixtureService = new OrderFixture();
