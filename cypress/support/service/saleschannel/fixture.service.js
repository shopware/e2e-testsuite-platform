const _ = require('lodash');
const uuid = require('uuid/v4');
const StoreApiService = require('./store-api.service');
const AdminApiService = require('../administration/admin-api.service');
const AdminFixtureService = require('../administration/fixture.service.js');

class SalesChannelFixtureService {
    constructor() {
        this.apiClient = new StoreApiService(process.env.APP_URL);
        this.adminApiClient = new AdminApiService(process.env.APP_URL);
    }

    createUuid() {
        return uuid();
    }

    mergeFixtureWithData(...args) {
        const result = _.merge({}, ...args);
        return result;
    }

    search(type, filter) {
        const adminFixtures = new AdminFixtureService();
        return adminFixtures.search(type, filter).then((result) => {
            return result;
        });
    }

    getClientId(salesChannelName = 'Storefront') {
        return this.adminApiClient.post('/search/sales-channel?response=true', {
            filter: [{
                field: 'name',
                type: 'equals',
                value: salesChannelName
            }]
        }).then((result) => {
            return result.attributes.accessKey;
        });
    }
}


module.exports = SalesChannelFixtureService;

global.SalesChannelFixtureService = new SalesChannelFixtureService();
