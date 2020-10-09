const SalesChannelFixtureService = require('../../saleschannel/fixture.service.js');

class NewsletterRecipientFixture extends SalesChannelFixtureService {
    setNewsletterRecipientFixture(recipientData) {
        let finalRecipientData = {};

        return this.getClientId()
            .then((accessKey) => {
                this.apiClient.setAccessKey(accessKey);
            })
            .then(() => {
                finalRecipientData = this.mergeFixtureWithData({
                    firstName: 'Pep',
                    lastName: 'Eroni',
                    email: 'test@example.com',
                    option: 'direct',
                    storefrontUrl: `${Cypress.config('baseUrl')}`
                }, recipientData);

                return this.apiClient.post(`/${Cypress.env('apiVersion')}/newsletter/subscribe?response=true`, finalRecipientData);
            });
    }
}

module.exports = NewsletterRecipientFixture;
global.NewsletterRecipientFixtureService = new NewsletterRecipientFixture();