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
  restartServer: () => {},
  stopServer: () => {},
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
}

const store: {
  graphql: {
    graphqlKeys: string[]
    typeDefs: string
    resolvers: {
      Query: {
        [key: string]: Function
      }
      Mutation: {
        [key: string]: Function
      }
      [key: string]: {
        [key: string]: Function | string | number | boolean | object | any
      }
    }
  }
  database: {
    relationships: StoreDatabaseRelationship[]
    models: {
      [key: string]: any
    }
  }
  modules: WithModuleProps[]
} = {
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
}

export default store
