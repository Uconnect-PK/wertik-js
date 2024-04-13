import get from "lodash.get"
import express from "express"
import store, { wertikApp } from "./store"
import { applyRelationshipsFromStoreToDatabase } from "./database/database"
import { emailSender } from "./mailer/index"
import http from "http"
import { WertikConfiguration, WertikApp } from "./types"
import { initializeBullBoard } from "./queue/index"
import { wLogWithInfo, wLogWithSuccess } from "./utils/log"
import { validateModules } from "./modules/modules"

export * from "./database/database"
export * from "./modules/modules"
export * from "./graphql"
export * from "./mailer"
export * from "./cronJobs"
export * from "./storage"
export * from "./helpers/modules/backup"
export * from "./sockets"
export * from "./queue"
export * from "./redis"
export * from "./logger"
export * from "./database/mysql/mysql"
export * from "./database/database"

const Wertik: (configuration?: WertikConfiguration) => Promise<WertikApp> = (
  configuration: WertikConfiguration
) => {
  configuration = configuration ? configuration : {}
  return new Promise(async (resolve, reject) => {
    try {
      configuration.appEnv = configuration.appEnv ?? "local"

      const port = get(configuration, "port", 1200)
      const selfStart = get(
        configuration,
        "selfStart",
        get(configuration, "skip", true)
      )
      const expressApp = get(configuration, "express", express())
      const httpServer = http.createServer(expressApp)

      wertikApp.appEnv = configuration.appEnv
      wertikApp.httpServer = httpServer
      wertikApp.express = expressApp
      wertikApp.port = configuration.port

      if (configuration?.mailer?.instances) {
        for (const mailName of Object.keys(
          configuration.mailer.instances || {}
        )) {
          wertikApp.mailer[mailName] = await configuration.mailer.instances[
            mailName
          ]()
        }
      }

      if (configuration?.storage) {
        for (const storageName of Object.keys(configuration.storage || {})) {
          wertikApp.storage[storageName] = configuration.storage[storageName]({
            configuration: configuration,
            wertikApp: wertikApp,
          })
        }
      }

      if (configuration?.cronJobs) {
        for (const cronName of Object.keys(configuration.cronJobs || {})) {
          wertikApp.cronJobs[cronName] = configuration.cronJobs[cronName]({
            configuration: configuration,
            wertikApp: wertikApp,
          })
        }
      }

      if (configuration.sockets) {
        for (const socketName of Object.keys(configuration.sockets || {})) {
          wertikApp.sockets[socketName] = configuration.sockets[socketName]({
            configuration: configuration,
            wertikApp: wertikApp,
          })
        }
      }

      if (configuration.database) {
        for (const databaseName of Object.keys(configuration.database || {})) {
          try {
            wertikApp.database[databaseName] = await configuration.database[
              databaseName
            ]()
          } catch (e) {
            throw new Error(e)
          }
        }
      }

      if (configuration.modules) {
        for (const moduleName of Object.keys(configuration.modules || {})) {
          wertikApp.modules[moduleName] = await configuration.modules[
            moduleName
          ]({
            store: store,
            configuration: configuration,
            app: wertikApp,
          })
        }
      }

      if (configuration?.queue?.jobs) {
        for (const queueName of Object.keys(configuration?.queue?.jobs || {})) {
          wertikApp.queue.jobs[queueName] =
            configuration.queue.jobs[queueName]()
        }
      }

      if (configuration?.queue?.options?.useBullBoard === true) {
        wertikApp.queue.bullBoard = initializeBullBoard({
          wertikApp,
          configuration,
        })
      }

      if (configuration.redis) {
        for (const redisName of Object.keys(configuration.redis || {})) {
          wertikApp.redis[redisName] = configuration.redis[redisName]({
            wertikApp,
            configuration,
          })
        }
      }

      if (configuration.logger) {
        wertikApp.logger = configuration.logger
      }

      applyRelationshipsFromStoreToDatabase(store, wertikApp)

      expressApp.get("/w/info", function (req, res) {
        res.json({
          message: "You are running wertik-js v3",
          version: require(`${process.cwd()}/package.json`).version,
        })
      })

      wertikApp.sendEmail = emailSender({
        wertikApp,
        configuration,
      })

      if (wertikApp?.models) {
        store.database.models = wertikApp.models
      }

      if (configuration.graphql) {
        wertikApp.graphql = configuration.graphql({
          wertikApp: wertikApp,
          store: store,
          configuration: configuration,
          expressApp: expressApp,
        })
      }

      expressApp.use(async function (req, _res, next) {
        req.wertik = wertikApp
        next()
      })

      validateModules(wertikApp)

      let startServer = () => {
        httpServer.listen(port, () => {
          wLogWithSuccess(`[Wertik-App]`, `http://localhost:${port}`)
        })
      }

      let stopServer = () => {
        wLogWithInfo(`[Wertik-App]`, `Stopping server`)
        httpServer.close(() => {
          wLogWithSuccess(`[Wertik-App]`, `Server stopped`)
          process.exit()
        })
      }

      let restartServer = () => {
        wLogWithInfo(`[Wertik-App]`, `Restarting server`)
        httpServer.close(() => {
          setTimeout(() => {
            startServer()
          }, 500)
        })
      }

      if (!new Object(process.env).hasOwnProperty("TEST_MODE")) {
        setTimeout(async () => {
          if (selfStart === true) {
            startServer()
          }
          resolve({
            ...wertikApp,
            restartServer,
            stopServer,
            startServer,
          })
        }, 500)
      } else {
        resolve({
          ...wertikApp,
          restartServer,
          stopServer,
          startServer,
        })
      }
    } catch (e) {
      console.error(e)
      reject(e)
    }
  })
}

export default Wertik
