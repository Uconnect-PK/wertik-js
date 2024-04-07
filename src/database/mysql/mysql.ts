import { Sequelize } from "sequelize"
import { databaseDefaultOptions } from "../../utils/defaultOptions"
import { WithMysqlDatabaseProps } from "../../types/database"
import get from "lodash.get"
import {
  wLog,
  wLogWithError,
  wLogWithInfo,
  wLogWithSuccess,
} from "../../utils/log"

export const getAllRelationships = (dbName: string) => {
  return `
    SELECT *
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE CONSTRAINT_SCHEMA = '${dbName}'
      AND REFERENCED_TABLE_SCHEMA IS NOT NULL
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND REFERENCED_COLUMN_NAME IS NOT NULL
  `
}

export const withMysqlDatabase = function (obj: WithMysqlDatabaseProps) {
  return async () => {
    try {
      let sequelize = new Sequelize(obj.name, obj.username, obj.password, {
        host: obj.host,
        dialect: "mysql",
        logging: false,
        ...get(obj, "options", {}),
        ...(databaseDefaultOptions as any).sql.dbInitializeOptions,
      })
      await sequelize.authenticate().catch((error) => {
        wLogWithError("[DB] Connecting failed to database", obj.name)
        wLogWithError("[DB] Error", error.message)
        wLogWithInfo("[DB] Error Info")
        wLog(error)
        process.exit(1)
      })
      wLogWithSuccess(
        `[Wertik-Mysql-Database]`,
        `Successfully connected to database ${obj.name}`
      )
      ;(sequelize as any).relationships = await sequelize.query(
        getAllRelationships(obj.name)
      )
      return {
        credentials: obj,
        instance: sequelize,
      }
    } catch (e) {
      wLog(`[DB] Connecting failed to database ${obj.name}`)
      wLog(e.message)
    }
  }
}

/**
 * @deprecated use useMysqlDatabase, useDatabase is deprecated and will be removed in 3.5.0 version.
 */
export const useDatabase = withMysqlDatabase
