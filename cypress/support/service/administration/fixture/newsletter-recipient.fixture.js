const AdminFixtureService = require('../fixture.service.js');

class NewsletterRecipient extends AdminFixtureService {
    setNewsletterRecipientFixture(recipient) {

        cy.getSalesChannelId().then((accessKey) => {
            const headers = {
                "Content-Type": "application/json",
                "SW-Access-Key": accessKey
            };

            function getSalutation() {
                const url = '/sales-channel-api/v3/salutation';
                return fetch(url, { method: 'GET', headers })
                    .then((resp) => resp.json())
                    .then((json) => json.data[0]);
            }

            function subscribeRecipient(recipient) {
                const url = '/sales-channel-api/v3/newsletter/subscribe';
                const body = JSON.stringify(recipient);
                return fetch(url, { method: 'POST', headers, body })
                    .then(response => {
                        if (response.statusText !== "No Content") {
                            throw new Error('Recipient creation failed')
                        }
                    });
            }

            return getSalutation().then(salutation => {
                recipient['salutationId'] = salutation.id;
                return subscribeRecipient(recipient);

            });


        })
    }
}

module.exports = NewsletterRecipient;
global.NewsletterRecipientFixtureService = new NewsletterRecipient();