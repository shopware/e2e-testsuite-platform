const _ = require('lodash');
const { v4: uuid } = require('uuid');
const AdminApiService = require('./admin-api.service');
class AdminFixtureService {
    constructor() {
        this.apiClient = new AdminApiService();
    }

    create(endpoint, rawData) {
        return this.apiClient.post(`/${endpoint}?response=true`, rawData);
    }

    update(userData) {
        if (!userData.id) {
            throw new Error('Update fixtures must always contain an id');
        }
        return this.apiClient.patch(`/${userData.type}/${userData.id}`, userData.data);
    }

    authenticate() {
        return this.apiClient.loginToAdministration();
    }

    search(type, filter) {
        return this.apiClient.post(`/search/${type}?response=true`, {
            filter: [{
                field: filter.field ? filter.field : 'name',
                type: 'equals',
                value: filter.value
            }]
        });
    }

    createUuid() {
        return uuid().replace(/-/g, '');
    }

    mergeFixtureWithData(...args) {
        return _.merge({}, ...args);
    }

    clearCache() {
        return this.apiClient.delete('/_action/cache').catch((err) => {
            console.log('Cache could not be cleared')
        });
    }
}

module.exports = AdminFixtureService;

global.AdminFixtureService = new AdminFixtureService();
