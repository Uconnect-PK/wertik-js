import generalSchema from "./graphql/generalSchema"
import { WertikApp } from "./types"
import { WithModuleProps } from "./types/modules"

type StoreDatabaseRelationship = {
  currentModule: string
  currentModuleDatabase: string
  graphqlKey: string
  referencedModule: string
  referencedModuleDatabase: string
  options: {
    [key: string]: unknown
  }
}

/**
 * @description This is the store of the app. It contains all the data that is required by the app to run.
 */
export const wertikApp: WertikApp = {
  startServer: () => {},
  appEnv: "local",
  port: 1200,
  modules: {},
  models: {},
  database: {},
  mailer: {},
  graphql: null,
  sockets: {},
  cronJobs: {},
  storage: {},
  queue: {
    jobs: {},
    bullBoard: {},
  },
  redis: {},
  logger: null,
  store: {
    graphql: {
      graphqlKeys: [],
      typeDefs: `
          ${generalSchema}
          type Response {
            message: String
            version: String
          }
          type Query {
            version: String
          }
          type Mutation {
            version: String
          }
          schema {
            query: Query
            mutation: Mutation
          }
      `,
      resolvers: {
        Query: {
          version: () => require("../../package.json").version,
        },
        Mutation: {
          version: () => require("../../package.json").version,
        },
      },
    },
    database: {
      relationships: [],
      models: {},
    },
    modules: [],
  },
}
