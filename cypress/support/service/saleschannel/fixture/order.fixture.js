const SalesChannelFixtureService = require('../fixture.service.js');

class OrderFixtureService extends SalesChannelFixtureService {
    createOrder(productId, customer) {
        return this.getClientId()
            .then((result) => {
                this.apiClient.setAccessKey(result);
            })
            .then(() => {
                return this.apiClient.post('/**/customer/login', JSON.stringify({
                    username: customer.username,
                    password: customer.password
                }));
            })
            .then((contextToken) => {
                return this.apiClient.setContextToken(contextToken['sw-context-token']);
            })
            .then(() => {
                return this.apiClient.post('/**/checkout/cart');
            })
            .then(() => {
                return this.apiClient.post(`/**/checkout/cart/line-item/${productId}`, {
                    type: 'product',
                    referencedId: productId,
                    stackable: true
                });
            })
            .then(() => {
                return this.apiClient.post('/**/checkout/order');
            })
            .catch((err) => {
                console.log('err :', err);
            });
    }

    createGuestOrder(productId, json) {
        let customerRawData = json;

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

        return this.getClientId()
            .then((result) => {
                this.apiClient.setAccessKey(result);
            })
            .then(() => {
                return Promise.all([
                    findSalutationId(),
                    findCountryId()
                ]);
            })
            .then(([salutation, country]) => {
                customerRawData = this.mergeFixtureWithData(customerRawData, {
                    salutationId: salutation.id,
                    billingAddress: {
                        salutationId: salutation.id,
                        countryId: country.id
                    }
                });
            })
            .then(() => {
                return this.apiClient.setContextToken(this.createUuid().replace(/-/g, ''));
            })
            .then(() => {
                return this.apiClient.post('/**/checkout/cart');
            })
            .then(() => {
                return this.apiClient.post(`/**/checkout/cart/line-item/${productId}`, {
                    type: 'product',
                    referencedId: productId,
                    stackable: true
                });
            })
            .then(() => {
                return this.apiClient.post('/**/checkout/guest-order', customerRawData);
            })
            .catch((err) => {
                console.log('err :', err);
            });
    }

    setPromotionFixture(userData) {
        return this.adminApiClient.post('/**/promotion?_response=true', userData);
    }

    setDiscountFixture(userData, promotionId) {
        userData.promotion_discount.payload.forEach(item => {
            item.promotionId = promotionId;
        });

        return this.adminApiClient.post('/**/_action/sync', userData);
    }
}

module.exports = OrderFixtureService;

global.OrderFixtureService = new OrderFixtureService();
