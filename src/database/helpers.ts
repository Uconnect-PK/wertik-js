import { MysqlColumnInfoDescribeTable, SqlTable } from "../types/database"
import { capitalizeFirstLetter } from "../utils/capitalizeFirstLetter"
import {
  numberTypes,
  dateTypes,
  stringTypes,
  enumTypes,
  jsonTypes,
} from "./mysql/getTableInfo"
import { WertikApp } from "../types"
import get from "lodash.get"
import { wLogWithError, wLogWithInfo } from "../utils/log"

export const convertDatabaseTypeIntoGraphqlType = (
  columnInfo: MysqlColumnInfoDescribeTable,
  tableName: string
) => {
  let isPrimary = columnInfo.Key === "PRI"
  // let limit = columnInfo.Type.match(/\d+/g)
  let isRequiredIndicator = columnInfo.Null === "NO" ? "!" : ""

  if (columnInfo.Type.toLowerCase() === "tinyint(1)") {
    return {
      graphqlType: `Boolean`,
      graphqlInsertInputType: `Boolean${isRequiredIndicator}`,
      graphqlUpdateInputType: `Boolean${isRequiredIndicator}`,
      databaseType: "INTEGER",
    }
  } else if (numberTypes.find((c) => columnInfo.Type.includes(c))) {
    return {
      graphqlType: `Int`,
      graphqlInsertInputType: `Int`,
      graphqlUpdateInputType: `Int${isPrimary ? "!" : ""}`,
      databaseType: "INTEGER",
    }
  } else if (jsonTypes.find((c) => columnInfo.Type.includes(c))) {
    return {
      graphqlType: `JSON`,
      graphqlInsertInputType: `String${isRequiredIndicator}`,
      graphqlUpdateInputType: `String${isRequiredIndicator}`,
      databaseType: "STRING",
    }
  } else if (stringTypes.find((c) => columnInfo.Type.includes(c))) {
    return {
      graphqlType: `String`,
      graphqlInsertInputType: `String${isRequiredIndicator}`,
      graphqlUpdateInputType: `String${isRequiredIndicator}`,
      databaseType: "STRING",
    }
  } else if (dateTypes.find((c) => columnInfo.Type.includes(c))) {
    return {
      graphqlType: `String`,
      graphqlInsertInputType: `String${isRequiredIndicator}`,
      graphqlUpdateInputType: `String${isRequiredIndicator}`,
      databaseType: "STRING",
      isDateColumn: true,
    }
  } else if (enumTypes.find((c) => columnInfo.Type.includes(c))) {
    return {
      graphqlType: `${capitalizeFirstLetter(tableName)}${capitalizeFirstLetter(
        columnInfo.Field
      )}Enum`,
      graphqlInsertInputType: `${capitalizeFirstLetter(
        tableName
      )}${capitalizeFirstLetter(columnInfo.Field)}Enum${isRequiredIndicator}`,
      graphqlUpdateInputType: `${capitalizeFirstLetter(
        tableName
      )}${capitalizeFirstLetter(columnInfo.Field)}Enum${isRequiredIndicator}`,
      databaseType: "ENUM",
      isEnum: true,
      enumValues: columnInfo.Type.replace("enum(", "")
        .replace("ENUM(", "")
        .replace(")", "")
        .replace(/'/g, "")
        .split(","),
    }
  }
}

export const applyRelationshipsFromStoreToDatabase = async (app: WertikApp) => {
  Object.keys(app.database).forEach((dbName) => {
    let db = app.database[dbName]
    const tables = db?.credentials?.tables || []
    tables.forEach((table) => {
      const currentModel = app.models[table.name]

      for (const [relationshipType, relationships] of Object.entries(
        table.relationships || {}
      )) {
        for (const [relatedTableName, relationshipOptions] of Object.entries<
          SqlTable["relationships"]["belongsTo"]
        >(table.relationships[relationshipType] || {})) {
          const relatedTable = app.models[relatedTableName]
          if (!relatedTable) {
            wLogWithError(
              `[DB] Related table not found:`,
              `model '${relatedTableName}' not found for relationship '${relationshipType}' in table '${table.name}'`
            )
            process.exit()
          }
          wLogWithInfo(
            `[DB] Applying relationship:`,
            `${table.name}.${relationshipType}(${
              relatedTable.tableName
            },${JSON.stringify(relationshipOptions)})`
          )
          currentModel[relationshipType](relatedTable, relationshipOptions)
          const isManyRelationship = ["hasMany", "belongsToMany"].includes(
            relationshipType
          )
          if (isManyRelationship) {
            app.store.graphql.typeDefs = app.store.graphql.typeDefs.concat(`
            extend type ${table.name} {
              ${relationshipOptions.as}(offset: Int, limit: Int, where: ${table.name}_filter_input, order: ${table.name}_order_input): [${relatedTableName}]
            }
            `)
          } else {
            app.store.graphql.typeDefs = app.store.graphql.typeDefs.concat(`
            extend type ${table.name} {
              ${relationshipOptions.as}: ${relatedTableName}
            }`)
          }
        }
      }
    })
  })
}
