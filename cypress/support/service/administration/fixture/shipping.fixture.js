const AdminFixtureService = require('../fixture.service.js');

class ShippingFixtureService extends AdminFixtureService {
    setShippingFixture(userData) {
        const findRuleId = () => this.search('rule', {
            type: 'equals',
            value: 'Cart >= 0 (Payment)'
        });
        const findDeliveryTimeId = () => this.search('delivery-time', {
            type: 'equals',
            value: '3-4 weeks'
        });

        return Promise.all([
            findRuleId(),
            findDeliveryTimeId()
        ]).then(([rule, deliveryTime]) => {
            return this.mergeFixtureWithData(userData, {
                availabilityRuleId: rule.id,
                deliveryTimeId: deliveryTime.id
            });
        }).then((finalShippingData) => {
            return this.apiClient.post(`/${Cypress.env('apiVersion')}/shipping-method?_response=true`, finalShippingData);
        });
    }
}

module.exports = ShippingFixtureService;

global.ShippingFixtureService = new ShippingFixtureService();
