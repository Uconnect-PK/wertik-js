require("dotenv").config()

import wertik, {
  withMysqlDatabase,
  withApolloGraphql,
  withModule,
  withWebSockets,
  withSocketIO,
  withIndependentWebSocketsServer,
  withLogger,
  withWinstonTransport,
  withMailer,
  withRedis,
} from "./index"
import modules from "./devServerTestModules"

wertik({
  port: 1200,
  graphql: withApolloGraphql({
    storeTypeDefFilePath: process.cwd() + "/graphqlSchema.graphql",
  }),
  database: {
    ecommerce: withMysqlDatabase({
      name: process.env.TEST_DATABASE_NAME,
      host: process.env.TEST_DATABASE_HOST,
      password: process.env.TEST_DATABASE_PASSWORD,
      port: +process.env.TEST_DATABASE_PORT,
      username: process.env.TEST_DATABASE_USERNAME,
      tables: [
        {
          name: process.env.TEST_DATABASE_TABLE_PRODUCT,
          relationships: {
            belongsTo: {
              user: {
                as: "user",
                foreignKey: "user_id",
                targetKey: "id",
              },
            },
          },
        },
        {
          name: process.env.TEST_DATABASE_TABLE_USER,
          relationships: {
            hasMany: {
              product: {
                as: "products",
                foreignKey: "user_id",
                sourceKey: "id",
              },
            },
          },
        },
      ],
    }),
    default: withMysqlDatabase({
      username: "root",
      password: "pass",
      name: "wapgee_prod",
      host: "localhost",
      port: 3306,
    }),
  },
  sockets: {
    mySockets: withWebSockets({
      path: "/websockets",
    }),
    socketio: withSocketIO({
      path: "/mysocketioserver",
    }),
    mySockets2: withIndependentWebSocketsServer({
      port: 1500,
    }),
  },
  logger: withLogger({
    transports: withWinstonTransport((winston) => {
      return [
        new winston.transports.File({
          filename: "info.log",
          level: "info",
        }),
      ]
    }),
  }),
  // mailer: {
  //   instances: {
  //     default: withMailer({
  //       name: "Default",
  //     }),
  //   },
  // },
  redis: {
    testRedis: withRedis({
      name: "testRedis",
    }),
  },
})
