import { Model, ModelAttributes, ModelCtor, Sequelize } from "sequelize"
import { databaseDefaultOptions } from "../../utils/defaultOptions"
import { WithMysqlDatabaseProps } from "../../types/database"
import get from "lodash.get"
import {
  wLog,
  wLogWithError,
  wLogWithInfo,
  wLogWithSuccess,
} from "../../utils/log"
import { getMysqlTableInfo } from "./getTableInfo"
import {
  convertWordIntoSingular,
  generateEnumTypeForGraphql,
  generateGenerateGraphQLCrud,
  getInsertSchema,
  getOrderSchema,
  getUpdateSchema,
} from "../../modules/modulesHelpers"
import { wertikApp } from "../../store"

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
      let models: ModelCtor<Model<any, any>>[] = []
      obj.tables?.forEach(async (table) => {

        let graphqlSchema = [`type ${table.name} {`]
        let listSchema = ""
        let filterSchema = [
          `input ${convertWordIntoSingular(table.name)}_filter_input {`,
        ]
        let updateSchema = ""
        let insertSchema = ""
        let orderSchema = ""

        const tableInfo = await getMysqlTableInfo(table.name, sequelize)

        let fields: ModelAttributes<Model<any, any>, any> = {}

        tableInfo.columns.forEach((column) => {
          if (column.columnName === "id") return

          if (column.isEnum) {
            wertikApp.store.graphql.typeDefs = wertikApp.store.graphql.typeDefs.concat(
              generateEnumTypeForGraphql(column)
            )
          }

          updateSchema = getUpdateSchema(table, tableInfo)
          insertSchema = getInsertSchema(table, tableInfo)
          orderSchema = getOrderSchema(table, tableInfo)

          graphqlSchema.push(`${column.columnName}: ${column.graphqlType}`)

          let filter_input =
            column.databaseType.toLowerCase() === "enum"
              ? `${column.columnName}: ${column.graphqlType}`
              : `${
                  column.columnName
                }: ${column.graphqlType.toLowerCase()}_filter_input`

          filterSchema.push(filter_input)

          fields[column.columnName] = {
            type: column.databaseType,
            allowNull: column.isNull,
            defaultValue: column.default,
            primaryKey: column.isPrimary,
            values: column.isEnum ? column.enumValues : null,
          }
        })
        graphqlSchema.push("}")
        filterSchema.push("}")

        const tableInstance = sequelize.define(
          table.name,
          {
            ...fields,
            ...get(table, "extendFields", {}),
          },
          {
            ...get(table, "tableOptions", {}),
            ...databaseDefaultOptions.sql.defaultTableOptions,
          }
        )


        wertikApp.models[table.name] = tableInstance
        const schemaInformation = {
          moduleName: table.name,
          tableInstance: tableInstance,
          schema: graphqlSchema.join(`\n`),
          inputSchema: {
            insert: insertSchema || "",
            update: updateSchema || "",
            list: listSchema,
            filters: filterSchema.join("\n"),
            order_schema: orderSchema || "",
          },
        }

        generateGenerateGraphQLCrud(table, schemaInformation)

        models.push(tableInstance)
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
        models: models,
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
