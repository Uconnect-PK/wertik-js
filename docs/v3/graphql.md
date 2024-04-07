# GraphQL

For GraphQL, Wertik JS uses Apollo GraphQL under the hood. We choose Apollo GraphQL because it is well managed and bug-free. To set up Graphql Wertik JS provides a function called `withGraphql` to use Graphql in your app.

```javascript
import wertik, { withGraphql } from "wertik-js/lib/";
wertik({
  port: 1200,
  graphql: withGraphql(WithGraphqlProps),
});
```

This will initialize GraphQL on URL: http://localhost:1200/graphql. If you visit this link you will Apollo GraphQL playground.

#### WithGraphqlProps

WithGraphqlProps is an argument which is optional when using `withGraphql` method.

```typescript
export interface WithGraphqlProps {
  options?: {
    [key: string]: any;
  };
  applyMiddlewareOptions?: GetMiddlewareOptionsGraphql;
  resolvers?: {
    Mutation: {};
    Query: {};
  };
  typeDefs?: string;
}
```

- options includes ApolloServer options.
- applyMiddlewareOptions includes options while integrating Apollo Server with express server with same port.
- resolvers for defined schema in WithGraphqlProps.typeDefs.
- typeDefs is your graphql schema.
