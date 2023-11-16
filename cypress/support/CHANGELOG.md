# Changelog

All notable changes to this project will be documented in this file.

## [7.0.6] - 16.11.2023

### Changed
- Added auto close to the `typeAndCheckSearchField` command

## [7.0.3] - 01.02.2023

### Added
- Added correct expiry value with same calculation as in the administration

## [7.0.0] - 10.01.2023

### Changed

- Changed `typeSingleSelectAndCheck` to work with Cypress 12
- Changed `authenticate` to utilize `cy.session()`

### Removed

- Removed `loginViaApi` use `authenticate` instead
