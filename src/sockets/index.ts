import {
  Server as SocketIOServer,
  ServerOptions as SocketIOServerOptions,
} from "socket.io"
import { wLogWithSuccess } from "../utils/log"
import {
  Server as WebSocketServer,
  ServerOptions as WebSocketServerOptions,
} from "ws"
import { WertikApp, WertikConfiguration } from "../types"

/**
 * Creates WS instance attaches to http server.
 * @param props see interface WebSocketServerOptions
 * @returns WebSocketServer instance
 */
export const withWebSockets = (props: WebSocketServerOptions = {}) => {
  return ({
    configuration,
    wertikApp,
  }: {
    configuration: WertikConfiguration
    wertikApp: WertikApp
  }) => {
    if (!props.path) {
      throw new Error("Path must be passed for useWebSockets")
    }
    wLogWithSuccess(
      `[Wertik-WebSockets]`,
      `ws://localhost:${configuration.port}${props.path}`
    )
    return new WebSocketServer({
      server: wertikApp.httpServer,
      ...props,
    })
  }
}

/**
 * Create independent web sockets server that runs on different port.
 * @param props see interface WebSocketServerOptions
 * @returns WebSocketServer instance
 */
export const withIndependentWebSocketsServer = (
  props: WebSocketServerOptions = {}
) => {
  return ({
    configuration,
    wertikApp,
  }: {
    configuration: WertikConfiguration
    wertikApp: WertikApp
  }) => {
    wLogWithSuccess(
      "[Wertik-WebSocket]",
      `ws://localhost:${props.port}/${props.path ?? ""}`
    )
    return new WebSocketServer({
      ...props,
    })
  }
}

/**
 * Creates sockets io server on current http server.
 * @param props see interface SocketIOServerOptions from socket.io
 * @returns SocketIOServer
 */
export const withSocketIO = (props: any = {}) => {
  return ({
    configuration,
    wertikApp,
  }: {
    configuration: WertikConfiguration
    wertikApp: WertikApp
  }) => {
    wLogWithSuccess(
      `[Wertik-Socket.IO]`,
      `http://localhost:${configuration.port}${props.path ?? "/socket.io"}`
    )
    return new SocketIOServer(wertikApp.httpServer, props ?? {})
  }
}
