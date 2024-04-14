import get from "lodash.get"
import { WithModuleProps } from "../types/modules"
import { SqlTable, TableInfo } from "../types/database"
import { capitalizeFirstLetter } from "../utils/capitalizeFirstLetter"
import crud from "../crud"
import { wertikApp } from "../store"
import pluralize from "pluralize"
import snackCase from "lodash.snakecase"
import isPlainObject from "lodash.isplainobject"
import { print } from "util"

export const generateDataTypeFromDescribeTableColumnType = (Type: string) => {
  let length = Type.match(/[0-9]/g)?.join("")
  let type = Type.replace(/[0-9]/g, "")
    .replace("(", "")
    .replace(")", "")
    .split(" ")[0]
    .toUpperCase()

  if (type.toLowerCase().includes("varchar")) {
    type = "STRING"
  }

  if (type.toLowerCase() === "int") {
    type = "INTEGER"
  }

  return { length, type }
}

export const getGraphQLTypeNameFromSqlType = (
  column: {
    Type: string
    Field: string
  },
  module
) => {
  let type = column.Type
  if (typeof column.Type === "string") {
    type = type.toLowerCase()
  } else {
    return
  }
  if (type.includes("enum")) {
    return `${capitalizeFirstLetter(module.name)}${capitalizeFirstLetter(
      column.Field
    )}Enum`
  }
  if (
    type.includes("varchar") ||
    type.includes("timestamp") ||
    type.includes("datetime") ||
    type.includes("text")
  ) {
    return `String`
  }

  if (type.includes("json")) {
    return "JSON"
  }

  if (type.includes("int")) {
    return `Int`
  }
}

export const getUpdateSchema = (
  table: SqlTable,
  tableInfo: TableInfo
) => {
  const optionsUpdateSchema = get(table, "graphql.updateSchema", "")
  if (optionsUpdateSchema) return optionsUpdateSchema
  let updateSchema = [`input update_${table.name}_input {`]
  tableInfo.columns.forEach((column) => {
    if (column.columnName !== "id" && !column.isDateColumn) {
      updateSchema.push(
        `${column.columnName}: ${column.graphqlUpdateInputType}`
      )
    }
  })
  updateSchema.push("}")

  return updateSchema.join("\n")
}

export const getInsertSchema = (
  table: SqlTable,
  tableInfo: TableInfo
) => {
  const optionsInsertSchema = get(table, "graphql.createSchema", "")
  const rowsFieldName = convertWordIntoPlural(table.name)
  if (optionsInsertSchema) return optionsInsertSchema
  let insertSchema = [`input insert_${rowsFieldName}_input {`]
  tableInfo.columns.forEach((column) => {
    if (column.columnName !== "id" && !column.isDateColumn) {
      insertSchema.push(
        `${column.columnName}: ${column.graphqlInsertInputType}`
      )
    }
  })
  insertSchema.push("}")

  return insertSchema.join("\n")
}

export const getOrderSchema = (table: SqlTable, tableInfo) => {
  let orderSchema = [
    `input ${convertWordIntoSingular(table.name)}_order_input {`,
  ]
  let relationships = wertikApp.store.database.relationships.filter(
    (c) => c.currentModule === table.name
  )
  tableInfo.columns.forEach((column) => {
    orderSchema.push(`${column.columnName}: order_by`)
  })

  orderSchema.push("}")

  return orderSchema.join("\n")
}

export const generateEnumTypeForGraphql = (column: TableInfo["columns"][0]) => {
  return `enum ${column.graphqlType} {
    ${column.enumValues.join("\n")}
   }`
}

export const generateGenerateGraphQLCrud = (
  props,
  schemaInformation
) => {
  const { graphql } = crud(props, schemaInformation, wertikApp.store)
  const resolvers = graphql.generateCrudResolvers()

  wertikApp.store.graphql.typeDefs = wertikApp.store.graphql.typeDefs.concat(
    `\n ${schemaInformation.schema} 
    \n ${schemaInformation.inputSchema.filters}
    \n ${schemaInformation.inputSchema.insert}
    \n ${schemaInformation.inputSchema.update}
    \n ${schemaInformation.inputSchema.order_schema}
    `
  )

  wertikApp.store.graphql.typeDefs = wertikApp.store.graphql.typeDefs.concat(
    `\n ${graphql.generateQueriesCrudSchema()}`
  )
  wertikApp.store.graphql.typeDefs = wertikApp.store.graphql.typeDefs.concat(
    `\n ${graphql.generateMutationsCrudSchema()}`
  )

  wertikApp.store.graphql.resolvers.Query = {
    ...wertikApp.store.graphql.resolvers.Query,
    ...resolvers.Query,
  }

  wertikApp.store.graphql.resolvers.Mutation = {
    ...wertikApp.store.graphql.resolvers.Mutation,
    ...resolvers.Mutation,
  }
}

/**
 * Extract relational fields that were requested in a GraphQL query.
 */
export const getRelationalFieldsRequestedInQuery = (
  module,
  requestedFields
) => {
  const fields = Object.keys(requestedFields)
  // Filter all relationships for provided modules, based on fields provided filter out those relationships.
  const relationalFields = wertikApp.store.database.relationships
    .filter((c) => c.currentModule === module.name)
    .filter((relationship) => fields.includes(relationship.graphqlKey))
  return relationalFields
}

export const generateRequestedFieldsFromGraphqlInfo = (tableName, info) => {
  const keysToIgnore = [
    ...Object.keys(wertikApp.models[tableName].associations),
    "__typename",
    "__arguments",
  ]

  return Object.keys(info).filter((c) => !keysToIgnore.includes(c))
}

export const convertWordIntoSingular = (moduleName) => {
  return snackCase(pluralize.singular(moduleName)).toLowerCase()
}
export const convertWordIntoPlural = (moduleName) => {
  let fieldName = snackCase(pluralize.plural(moduleName)).toLowerCase()
  if (convertWordIntoSingular(moduleName) == fieldName) {
    return fieldName + "s"
  }
  return fieldName
}
