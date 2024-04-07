# Modules

Wertik-js allows extending your app with more features using the `modules` term. To use a module Wertik JS provides a method called `useModule` which allows you to create a new module. Let's create a module.

```js
import wertik, {
  withMysqlDatabase,
  withMailer,
  withModule,
  withGraphql,
} from "wertik-js/lib/";

weritk({
  port: 1200,
  database: {
    default: withMysqlDatabase({
      name: "default",
      password: "pass",
      host: "localhost",
      port: 3306,
      username: "root",
    }),
  },
  graphql: withGraphql,(),
  mailer: {
    default: withMailer(),
  },
  modules: {
    users: withModule({
      table: "users",
      database: "default",
      name: "users",
      useDatabase: true,
    }),
  },
});
```

Please check this [interface](https://github.com/Uconnect-Technologies/wertik-js/blob/master/src/next/types/modules.ts#:~:text=export%20interface%20useModuleProps%20%7B) file for what type of options does `useModule` function requires.

# Modules GraphQL Schema and Database operations

When you provide `useMysqlDatabase: true`, `table` and `database`, Wertik JS automatically generates GraphQL schema, `updateInput` and `createInput`. For example let's say you have a table called `Games` with following fields:

- name: varchar
- publisher: varchar

You have to initialize its module in this way:

```js
import wertik, { useModule, useMysqlDatabase, withGraphql, } from "wertik-js/lib/";
wertik({
  port: 1200,
  graphql: withGraphql,(),
  database: {
    default: useMysqlDatabase({
      name: "dbname",
      password: "pass",
      host: "localhost",
      port: 3306,
      username: "root",
    }),
  },
  modules: {
    games: useModule({
      useMysqlDatabase: true,
      name: "Games",
      table: "games",
      database: "default",
    }),
  },
});
```

Wertik JS will create a type called `Games`:

```graphql
type Games {
  name: String
  publisher: String
}
```

And for Update and Create inputs it will create inputs like this:

```graphql
input createGamesInput {
  name: String
  publisher: String
}

input updateGamesInput {
  name: String
  publisher: String
}
```

For filtering data from `games` table, Wertik JS will also create an input for filtering:

```graphql
input Gamesfilter_input {
  name: Stringfilter_input
  publisher: Stringfilter_input
}
```

To explore more about `Stringfilter_input` and other filter input please visit GraphQL Playground to get more familiar with it.

## This will generate

### Queries:

- view
- list
- count

```graphql
type Query {
  version: String
  viewGames(where: Gamesfilter_input): Games
  listGames(
    pagination: PaginationInput
    where: Gamesfilter_input
    sorting: [SortingInput]
  ): GamesList
  countGames(where: Gamesfilter_input): Int
}
```

**Note:** When you are using enums in table please make sure that your enum value doesn't contains dashes, it should be something like this `enum('X_SMALL','X_LARGE')` not `enum('X-SMALL','X-LARGE')`.
### Mutations:

- update
- create
- delete
- createOrUpdate

```graphql
type Mutation {
  version: String
  updateGames(
    input: updateGamesInput
    where: Gamesfilter_input!
  ): GamesBulkMutationResponse
  createGames(input: [createGamesInput]): GamesBulkMutationResponse
  deleteGames(where: Gamesfilter_input!): SuccessResponse
  createOrUpdateGames(id: Int, input: createGamesInput): Games
}
```

You can try these `Mutations` and `Queries` in your GraphQL playground. If you find any issues please create a new issue [Here](https://github.com/Uconnect-Technologies/wertik-js/issues/new).

# More on filtering rows from a table

When you provide `useMysqlDatabase: true` for a module called Games. Wertik JS will create a query as:

```graphql
listGames(
  pagination: PaginationInput
  where: Gamesfilter_input
  sorting: [SortingInput]
): GamesList
```

Where `PaginationInput` is

```graphql
input PaginationInput {
  page: Int
  limit: Int
}
```

And `Gamesfilter_input` is same as Sequelize search object but main keywords such as like, `eq` or `like` starts with `_`, For example:

```graphql
query GamesList {
  listGames(where: { publisher: { _eq: "rockstar" } }) {
    list {
      publisher
    }
  }
}
```

And for sorting it is

```graphql
input SortingInput {
  column: String
  type: String
}
```

Sorting Example:

```graphql
query GamesList {
  listGames(sorting: [{ column: "id", type: "asc" }]) {
    list {
      publisher
    }
  }
}
```

To get more familiar with Schema please open your schema from Apollo Playground running at `http://localhost:1200/graphql` where `1200` is the default port of Wertik JS.

If you find any issues with `Filtering`, `Sorting` or `Paginating` rows. You can open a new issue [Here](https://github.com/Uconnect-Technologies/wertik-js/issues/new).

# Using events with GraphQL CRUD operations

When you run a Query or Mutation on a module(Please check [Mutations and Queries](#this-will-generate)) Wertik JS fires an event, Please check Typescript interface called `useModuleProps.events`. Those are the list of events that you can use. To explore more about types you can click `Go to Type Definition` of method `useModule`.

When events are running you get access to Apollo GraphQL Resolver arguments where you can access Request params as well. For more please see about [Crud](https://github.com/Uconnect-Technologies/wertik-js/blob/master/src/next/crud/index.ts#L76-L80)

**Note:** When you return something from event it will be considered as args, For more please see [This file](https://github.com/Uconnect-Technologies/wertik-js/blob/master/src/next/crud/index.ts#L81)

Example:

```js
import wertik, { useMysqlDatabase, useModule } from "wertik-js/lib/";

wertik({
  port: 1200,
  database: {
    default: useMysqlDatabase({
      name: "default",
      password: "pass",
      host: "localhost",
      port: 3306,
      username: "root",
    }),
  },
  modules: {
    games: useModule({
      useMysqlDatabase: true,
      name: "Games",
      table: "games",
      database: "jscontainer",
      events: {
        beforeCreate(_, args, context, info) {
          console.log("This will run before creating a game");
        },
      },
    }),
  },
});
```

List of available events:

- beforeView
- beforeCount
- beforeList
- beforeCreate
- beforeDelete
- beforeUpdate
- beforeCreateOrUpdate

# Using useModule on method to add more features to your module

When using Wertik JS modules. `useModule` has a function called `on` which can be used to extend more features like:

- Adding a Mutation.
- Adding a Query.
- Adding a database relationship to other module.
- Adding a Graphql schema
- Accesing Express instance

Example:

```js
import wertik, { useModule } from "wertik-js/lib/";
wertik({
  port: 1200,
  modules: {
    games: useModule({
      useMysqlDatabase: true,
      name: "Games",
      table: "games",
      database: "jscontainer",
      on({ useExpress, useQuery, useMutation, useSchema }) {
        useExpress((express) => {
          express.get("/404", (req, res) => res.status(404).send("404"));
        });
        useQuery({
          name: "getGames",
          query: "getGames: [Games]",
          resolver() {
            return [];
          },
        });
        useMutation({
          name: "updateAllGames",
          query: "updateAllGames: [Games]",
          resolver() {
            return [];
          },
        });
        useSchema(`
            type MyType {
              id: Int
              name: String
            }
          `);
      },
    }),
  },
});
```

To see `on` method interface please check this [Interface File](https://github.com/Uconnect-Technologies/wertik-js/blob/next/src/next/types/modules.ts#L102)
