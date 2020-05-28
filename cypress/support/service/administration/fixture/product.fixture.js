const AdminFixtureService = require('../fixture.service.js');

class ProductFixture extends AdminFixtureService {
    setProductFixture(userData, categoryName = 'Catalogue #1') {
        const taxName = userData.taxName || 'Standard rate';

        delete userData.taxName;

        const findTaxId = (name) => this.search('tax', {
            field: 'name',
            type: 'equals',
            value: name
        });
        const findManufacturerId = () => this.search('product-manufacturer', {
            field: 'name',
            type: 'equals',
            value: 'shopware AG'
        });

        return Promise.all([findManufacturerId(), findTaxId(taxName)])
            .then(([manufacturer, tax]) => {
                return Object.assign({}, {
                    taxId: tax.id,
                    manufacturerId: manufacturer.id
                }, userData);
            }).then((finalProductData) => {
                return this.apiClient.post('/v1/product?_response=true', finalProductData);
            }).then((result) => {
                return this.setProductVisible(userData.name, categoryName);
            });
    }

    setProductVisible(productName, categoryName) {
        let salesChannelId = '';
        let productId = '';

        return this.apiClient.post('/v1/search/sales-channel?response=true', {
            filter: [{
                field: 'name',
                type: 'equals',
                value: 'Storefront'
            }]
        }).then((data) => {
            salesChannelId = data.id;

            return this.apiClient.post('/v1/search/product?response=true', {
                filter: [{
                    field: 'name',
                    type: 'equals',
                    value: productName
                }]
            })
        }).then((data) => {
            productId = data.id;
        }).then(() => {
            return this.apiClient.post('/v1/search/category?response=true', {
                filter: [{
                    field: 'name',
                    type: 'equals',
                    value: categoryName
                }]
            })
        }).then((result) => {
            return this.update({
                id: productId,
                type: 'product',
                data: {
                    visibilities: [{
                        visibility: 30,
                        salesChannelId: salesChannelId
                    }],
                    categories: [{
                        id: result.id
                    }]
                }
            });
        })
    }
}

module.exports = ProductFixture;
global.ProductFixtureService = new ProductFixture();
