## Started changelog after version 3.2.9

### 3.4.0

- Added eager loading for list and view queries.
- Improved lazy loading behavior in GraphQL to avoid unnecessary queries.
- Added support for loading only requested fields in Sequelize.
- Added recursion support for both list and view queries.
- Added support for filtering associated data in recursive queries.
- Replaced moment.js with dayjs.
- Scanned and verified fixes with SonarQube.
- Removed lodash and installed its child packages to reduce app size.
- Added methods: `startServer()`, `restartServer()`, `stopServer()`.
- Removed query `list`. For example for Module `Users`, `listUsers` will become `users`, `EcommerceUsers` will become `ecommerce_users`.
- From single query item `view` is removed, For example `viewUser` will become `user` and `EcommerceUser` will become `ecommerce_user`
- Changed GraphQL list field from `list` to `rows`.
- Removed `applyRelationshipsFromStoreToGraphql` method due to the shift towards eager loading.
- Appended `Module` after module names in GraphQL types, e.g., `User` is now `UserModule`.
- Added tests to ensure GraphQL operations function correctly.
- Introduced an option to output GraphQL type definitions in a file.
- Change configuration prop `skip` to `selfStart` to make it more intuitive.


### 3.3.0

- When sending emails fails, also throws errors in console
- When taking backup and provides invalid table/module name, the backup process failed with an error.
- Added `extendFields` to `useModule` to extend `sequelize.model` table fields.

### 3.3.1 

- Removed old legacy wertik framework.
- Now wertik can be import from `wertik-js/lib` instead of `wertik-js/lib/ndex`
- Added more types support.
- Change the way mysql is initialized so that it can open doors for postgres and mongoose in future.