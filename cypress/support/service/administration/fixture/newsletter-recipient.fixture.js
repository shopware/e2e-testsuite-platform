const AdminFixtureService = require('../fixture.service.js');

class NewsletterRecipient extends AdminFixtureService {
    setNewsletterRecipientFixture(customer) {
        return this.getClientId()
            .then((result) => {
                this.apiClient.setAccessKey(result);
            })
            .then(() => {
                return this.apiClient.post(`/${Cypress.env('apiVersion')}/customer/login`, JSON.stringify({
                    username: customer.username,
                    password: customer.password
                }));
            }).then((contextToken) => {
                this.apiClient.setContextToken(contextToken['sw-context-token']).then(() => {
                    this.apiClient.post('/widgets/account/newsletter')
                });
            })
    }
}

module.exports = NewsletterRecipient;
global.NewsletterRecipientFixtureService = new NewsletterRecipient();