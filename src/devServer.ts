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

wertik({
  port: 1200,
  graphql: withApolloGraphql({
    storeTypeDefFilePath: process.cwd() + "/graphqlSchema.graphql",
  }),
  database: {
    wertik: withMysqlDatabase({
      port: 3306,
      name: "wertik_test",
      host: "127.0.0.1",
      password: "pass",
      username: "root",
    }),
  },
  modules: {
    Product: withModule({
      name: "Product",
      useDatabase: true,
      database: "wertik",
      table: "product",
      on: function ({ belongsTo }) {
        belongsTo({
          database: "wertik",
          graphqlKey: "user",
          module: "User",
          options: {
            as: "user",
            foreignKey: "user_id",
            targetKey: "id",
          },
        })
      },
    }),
    User: withModule({
      name: "User",
      useDatabase: true,
      database: "wertik",
      table: "user",
      on: function ({ hasMany }) {
        hasMany({
          database: "wertik",
          graphqlKey: "products",
          module: "Product",
          options: {
            as: "products",
            foreignKey: "user_id",
            sourceKey: "id",
          },
        })
      },
    }),
    Category: withModule({
      name: "Category",
      useDatabase: true,
      database: "wertik",
      table: "category",
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
