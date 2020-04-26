const _ = require('lodash');
const uuid = require('uuid/v4');
const AdminApiService = require('./admin-api.service');
class AdminFixtureService {
    constructor() {
        this.apiClient = new AdminApiService();
    }

    create(endpoint, rawData) {
        return this.apiClient.post(`/${Cypress.env('apiVersion')}/${endpoint}?response=true`, rawData);
    }

    update(userData) {
        if (!userData.id) {
            throw new Error('Update fixtures must always contain an id');
        }
        return this.apiClient.patch(`/${Cypress.env('apiVersion')}/${userData.type}/${userData.id}`, userData.data);
    }

    authenticate() {
        return this.apiClient.loginToAdministration();
    }

    search(type, filter) {
        return this.apiClient.post(`/${Cypress.env('apiVersion')}/search/${type}?response=true`, {
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
        return this.apiClient.delete(`/${Cypress.env('apiVersion')}/_action/cache`).catch((err) => {
            console.log('Cache could not be cleared')
        });
    }
}

module.exports = AdminFixtureService;

global.AdminFixtureService = new AdminFixtureService();
