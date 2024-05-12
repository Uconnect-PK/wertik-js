import fs from "fs"
import get from "lodash.get"
import omit from "lodash.omit"
import { defaultApolloGraphqlOptions } from "../utils/defaultOptions"
import { ApolloServer } from "apollo-server-express"
import graphqlDepthLimit from "graphql-depth-limit"
import prettier from "prettier"

import {
  WithApolloGraphqlProps,
  GraphqlInitializeProps,
} from "../types/graphql"
import { wLogWithSuccess } from "../utils/log"

export const withApolloGraphql = (props?: WithApolloGraphqlProps) => {
  return ({ wertikApp, expressApp, configuration }: GraphqlInitializeProps) => {
    const depthLimit = get(props, "validation.depthLimit", 7)
    props = props ? props : {}
    wertikApp.store.graphql.typeDefs = wertikApp.store.graphql.typeDefs.concat(
      get(configuration, "graphql.typeDefs", "")
    )

    wertikApp.store.graphql.resolvers.Query = {
      ...wertikApp.store.graphql.resolvers.Query,
      ...get(configuration, "graphql.resolvers.Query", {}),
    }

    wertikApp.store.graphql.resolvers.Mutation = {
      ...wertikApp.store.graphql.resolvers.Mutation,
      ...get(configuration, "graphql.resolvers.Mutation", {}),
    }

    const options = { ...get(configuration, "graphql.options", {}) }

    if (props && props.storeTypeDefFilePath) {
      if (fs.existsSync(props.storeTypeDefFilePath))
        fs.unlinkSync(props.storeTypeDefFilePath)

      const formattedTypeDefs = prettier.format(
        wertikApp.store.graphql.typeDefs,
        {
          filepath: props.storeTypeDefFilePath,
          semi: false,
          parser: "graphql",
        }
      )
      fs.writeFileSync(props.storeTypeDefFilePath, formattedTypeDefs)
    }

    const GraphqlApolloServer = new ApolloServer({
      typeDefs: wertikApp.store.graphql.typeDefs,
      resolvers: {
        ...wertikApp.store.graphql.resolvers,
      },
      ...defaultApolloGraphqlOptions,
      ...omit(options, ["context"]),
      context: async (options) => {
        let contextFromOptions = await get(options, "context", function () {})()

        return {
          wertik: wertikApp,
          req: options.req,
          res: options.res,
          ...contextFromOptions,
        }
      },
      validationRules: [graphqlDepthLimit(depthLimit)],
    })

    GraphqlApolloServer.applyMiddleware({
      app: expressApp,
      ...(props?.applyMiddlewareOptions ?? {}),
    })

    wLogWithSuccess(
      "[Wertik-Graphql]",
      `http://localhost:${configuration.port ?? 1200}/${
        props?.applyMiddlewareOptions?.path ?? "graphql"
      }`
    )

    return GraphqlApolloServer
  }
}
