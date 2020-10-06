const AdminFixtureService = require('../fixture.service.js');

class NewsletterRecipient extends AdminFixtureService {
    setNewsletterRecipientFixture(userData) {
        const findUserId = () => this.search('salutation', {
            field: 'displayName',
            type: 'equals',
            value: ''
        });
    }
}

module.exports = NewsletterRecipient;
global.NewsletterRecipientFixtureService = new NewsletterRecipient();