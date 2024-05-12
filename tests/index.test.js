require("dotenv").config()

const {
  default: wertik,
  withLogger,
  withWinstonTransport,
  withIndependentWebSocketsServer,
  withSocketIO,
  withWebSockets,
  withMailer,
  withApolloGraphql,
} = require("./../lib/index")

test("Expect no configuration can start the server", async () => {
  await expect(wertik()).resolves.not.toThrowError()
})

test("Expect empty configuration object an start the server", async () => {
  await expect(wertik()).resolves.not.toThrowError()
})

test("Expect null configuration does not causes error", async () => {
  await expect(wertik(null)).resolves.not.toThrowError()
})

test("Expect mailer to work without configuration and does not causes error", async () => {
  await expect(
    wertik({
      mailer: {
        default: withMailer({
          name: "Default",
        }),
      },
    })
  ).resolves.not.toThrowError()
})

test("Expect graphql to work with withApolloGraphql and does not causes error", async () => {
  await expect(
    wertik({
      graphql: withApolloGraphql(),
    })
  ).resolves.not.toThrowError()
})

test("Expect withWebSockets, withIndependentWebSocketsServer and withSocketIO works and does not throw any error", async () => {
  await expect(
    wertik({
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
    }).then((app) => {
      app.sockets.mySockets2.close()
    })
  ).resolves.not.toThrowError()
})

test("Expect logger to run without throwing any error", async () => {
  await expect(
    wertik({
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
    })
  ).resolves.not.toThrowError()
})
