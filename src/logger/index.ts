import winston, { LoggerOptions } from "winston"
import { wLogWithSuccess } from "../utils/log"

/**
 * Creates a winston instance
 * @param props see interface LoggerOptions from winston
 * @returns winston instance
 */
export const withLogger = (options?: LoggerOptions) => {
  wLogWithSuccess(`[Wertik-WinstonLogger]`, `Initialized winston logger`)
  return winston.createLogger(options)
}
/**
 * Allows creating multiple logger instances
 * @param fn callback function, withWinstonTransport expects a function and withWinstonTransport runs that function with winston passed so you can return transport instances
 * @returns should return array of winston transport object.
 */
export const withWinstonTransport = (
  fn = (winstonInstance = winston) => []
) => {
  return fn(winston)
}
