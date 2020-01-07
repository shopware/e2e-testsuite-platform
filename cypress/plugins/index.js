// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

require('@babel/register');
const selectTestsWithGrep = require('cypress-select-tests/grep');
const logToOutput = require('cypress-log-to-output');

module.exports = (on, config) => {
    logToOutput.install(on);

    // `on` is used to hook into various events Cypress emits
    // `config` is the resolved Cypress config
    on('file:preprocessor', selectTestsWithGrep(config));

    // See: https://github.com/cypress-io/cypress/issues/2102
    on('before:browser:launch', (browser = {}, args) => {
		if (browser.name === 'electron') {
			args.width = 1920;
			args.height = 1080;
			return args;
		}
		if (browser.name === 'chrome') {
			args.push('--window-size=1920,1080');
			return args
		}
	});
};
