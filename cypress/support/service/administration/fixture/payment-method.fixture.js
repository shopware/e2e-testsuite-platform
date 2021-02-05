const AdminFixtureService = require('../fixture.service.js');

class PaymentMethodFixture extends AdminFixtureService {
    setPaymentMethodFixture(paymentMethodData) {
        let finalPaymentMethodData = {};

        const paymentMethodId = this.createUuid();
        const findSalesChannelId = () => this.search('sales-channel', {
            type: 'equals',
            value: 'Storefront'
        });

        const findLanguageId = () => this.search('language', {
            type: 'equals',
            value: 'English'
        });

        return Promise.all([findSalesChannelId(), findLanguageId()])
            .then(([salesChannel, language]) => {
                finalPaymentMethodData = this.mergeFixtureWithData(paymentMethodData, {
                    active: true,
                    translations: [{
                        languageId: language.id,
                        name: paymentMethodData.name
                    }],
                    salesChannels: [
                        { id: salesChannel.id }
                    ]
                });
            })
            .then(() => {
                return this.apiClient.post('/payment-method/?response=true', finalPaymentMethodData);
            });
    }
}

module.exports = PaymentMethodFixture;
global.PaymentMethodFixture = new PaymentMethodFixture();
