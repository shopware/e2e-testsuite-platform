# Changelog

All notable changes to this project will be documented in this file.

## [7.0.0] - 10.01.2023

### Changed

- Changed `typeSingleSelectAndCheck` to work with Cypress 12
- Changed `authenticate` to utilize `cy.session()`

### Removed

- Removed `loginViaApi` use `authenticate` instead