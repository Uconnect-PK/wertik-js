import get from "lodash.get"
import { WithModuleProps } from "../types/modules"
import { TableInfo } from "../types/database"
import { capitalizeFirstLetter } from "../utils/capitalizeFirstLetter"
import crud from "../crud"
import store from "../store"
import pluralize from "pluralize"
import snackCase from "lodash.snakecase"

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
  module: WithModuleProps,
  tableInfo: TableInfo
) => {
  const optionsUpdateSchema = get(module, "graphql.updateSchema", "")
  if (optionsUpdateSchema) return optionsUpdateSchema
  let updateSchema = [`input update${module.name}Input {`]
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
  module: WithModuleProps,
  tableInfo: TableInfo
) => {
  const optionsInsertSchema = get(module, "graphql.createSchema", "")
  const rowsFieldName = generateRowsFieldNameForModuleName(module.name)
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

export const generateEnumTypeForGraphql = (column: TableInfo["columns"][0]) => {
  return `enum ${column.graphqlType} {
    ${column.enumValues.join("\n")}
   }`
}

export const generateGenerateGraphQLCrud = (
  props,
  schemaInformation,
  store
) => {
  const { graphql } = crud(props, schemaInformation, store)
  const resolvers = graphql.generateCrudResolvers()

  store.graphql.typeDefs = store.graphql.typeDefs.concat(
    `\n ${schemaInformation.schema} 
    \n ${schemaInformation.inputSchema.filters}
    \n ${schemaInformation.inputSchema.insert}
    \n ${schemaInformation.inputSchema.update}
    `
  )

  store.graphql.typeDefs = store.graphql.typeDefs.concat(
    `\n ${graphql.generateQueriesCrudSchema()}`
  )
  store.graphql.typeDefs = store.graphql.typeDefs.concat(
    `\n ${graphql.generateMutationsCrudSchema()}`
  )

  store.graphql.resolvers.Query = {
    ...store.graphql.resolvers.Query,
    ...resolvers.Query,
  }

  store.graphql.resolvers.Mutation = {
    ...store.graphql.resolvers.Mutation,
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
  const relationalFields = store.database.relationships
    .filter((c) => c.currentModule === module.name)
    .filter((relationship) => fields.includes(relationship.graphqlKey))
  return relationalFields
}

export const generateRequestedFieldsFromGraphqlInfo = (info) => {
  const keys = [
    ...store.database.relationships.map((c) => c.graphqlKey),
    ...store.graphql.graphqlKeys,
    "__typename",
    "__arguments",
  ]

  return Object.keys(info).filter((c) => !keys.includes(c))
}

export const generateRowFieldNameForModuleName = (moduleName) => {
  return snackCase(pluralize.singular(moduleName)).toLowerCase()
}
export const generateRowsFieldNameForModuleName = (moduleName) => {
  return snackCase(pluralize.plural(moduleName)).toLowerCase()
}
