import get from "lodash.get"
import { databaseDefaultOptions } from "../utils/defaultOptions"
import { RelationParams, WithModuleProps } from "../types/modules"
import {
  getInsertSchema,
  getUpdateSchema,
  generateEnumTypeForGraphql,
  generateGenerateGraphQLCrud,
  convertWordIntoPlural,
  convertWordIntoSingular,
  getOrderSchema,
} from "./modulesHelpers"
import { getMysqlTableInfo } from "../database/mysql/getTableInfo"
import { Store, WertikApp, WertikConfiguration } from "./../types/index"
import { ModelStatic, Model, ModelAttributes } from "sequelize/types"
import {
  wLogWithError,
  wLogWithInfo,
  wLogWithSuccess,
  wLogWithWarn,
} from "../utils/log"
import camelize from "../utils/camelize"
import has from "lodash.has"

/**
 * Wertik js module
 * @param props see interface UseModuleProps
 */
export const withModule = (moduleProps: WithModuleProps) => {
  return async ({
    store,
    configuration,
    app,
  }: {
    store: Store
    configuration: WertikConfiguration
    app: WertikApp
  }) => {
    store.modules.push(moduleProps)
    let currentModuleRelationships = []
    let tableInstance: ModelStatic<Model<any, any>>
    let graphqlSchema = [`type ${moduleProps.name}Module {`]
    let listSchema = ""
    let filterSchema = [
      `input ${convertWordIntoSingular(
        moduleProps.name
      )}_filter_input {`,
    ]
    let orderSchema = ""

    const useDatabase = get(moduleProps, "useDatabase", false)

    const { table, database, name } = moduleProps
    if (useDatabase && (!table || !database)) {
      throw new Error(
        `${name} is using database please pass database and/or table name`
      )
    }

    const extendSchema = (string: string) => {
      store.graphql.typeDefs = store.graphql.typeDefs.concat(`
        ${string}
      `)
    }

    const addQuery = ({ query, resolver, name }) => {
      store.graphql.typeDefs = store.graphql.typeDefs.concat(`
        extend type Query {
          ${query}
        }
      `)
      store.graphql.resolvers.Query[name] = resolver
    }

    const addMutation = ({ query, resolver, name }) => {
      store.graphql.typeDefs = store.graphql.typeDefs.concat(`
        extend type Mutation {
          ${query}
        }
      `)
      store.graphql.resolvers.Mutation[name] = resolver
    }

    const getExpress = (fn = (express) => {}) => {
      setTimeout(() => {
        fn(app.express)
      }, 2500)
    }

    const hasOne = (params: RelationParams) => {
      graphqlSchema.push(`${params.graphqlKey}: ${params.module}Module`)
      let relationshipInfo = {
        currentModule: moduleProps.name,
        currentModuleDatabase: moduleProps.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: "hasOne",
      }
      store.database.relationships.push(relationshipInfo)
      currentModuleRelationships.push(relationshipInfo)
      store.graphql.graphqlKeys.push(camelize(params.module))
      filterSchema.push(
        `${camelize(params.graphqlKey)}: ${convertWordIntoSingular(
          params.module
        )}_filter_input`
      )
    }
    const belongsTo = (params: RelationParams) => {
      graphqlSchema.push(`${params.graphqlKey}: ${params.module}Module`)
      let relationshipInfo = {
        currentModule: moduleProps.name,
        currentModuleDatabase: moduleProps.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: "belongsTo",
      }
      store.database.relationships.push(relationshipInfo)
      currentModuleRelationships.push(relationshipInfo)
      store.graphql.graphqlKeys.push(camelize(params.module))
      filterSchema.push(
        `${camelize(params.graphqlKey)}: ${convertWordIntoSingular(
          params.module
        )}_filter_input`
      )
    }
    const belongsToMany = (params: RelationParams) => {
      let field_name = convertWordIntoSingular(params.module)
      graphqlSchema.push(
        `${params.graphqlKey}(offset: Int, limit: Int, where: ${field_name}_filter_input, order: ${field_name}_order_input): [${params.module}Module]`
      )
      let relationshipInfo = {
        currentModule: moduleProps.name,
        currentModuleDatabase: moduleProps.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: "belongsToMany",
      }
      store.database.relationships.push(relationshipInfo)
      currentModuleRelationships.push(relationshipInfo)
      store.graphql.graphqlKeys.push(camelize(params.module))
      filterSchema.push(
        `${camelize(params.graphqlKey)}: ${convertWordIntoSingular(
          params.module
        )}_filter_input`
      )
    }
    const hasMany = (params: RelationParams) => {
      let field_name = convertWordIntoSingular(params.module)
      graphqlSchema.push(
        `${params.graphqlKey}(offset: Int, limit: Int, where: ${field_name}_filter_input, order: ${field_name}_order_input): [${params.module}Module]`
      )
      let relationshipInfo = {
        currentModule: moduleProps.name,
        currentModuleDatabase: moduleProps.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: "hasMany",
      }
      currentModuleRelationships.push(relationshipInfo)
      store.database.relationships.push(relationshipInfo)
      store.graphql.graphqlKeys.push(camelize(params.module))
      filterSchema.push(
        `${camelize(params.graphqlKey)}: ${convertWordIntoSingular(
          params.module
        )}_filter_input`
      )
    }
    get(moduleProps, "on", () => {})({
      addQuery,
      addMutation,
      getExpress,
      hasOne,
      belongsTo,
      belongsToMany,
      hasMany,
      extendSchema,
    })

    let insertSchema = []
    let updateSchema = []

    if (useDatabase) {
      if (!has(app.database, moduleProps.database)) {
        wLogWithError(
          `Unknown database: ${moduleProps.database}`,
          `Unknown database mentioned in module ${moduleProps.name}`
        )
        process.exit()
      }

      const connection = app.database[moduleProps.database]
      // info
      const tableInfo = await getMysqlTableInfo(
        moduleProps.table,
        connection.instance
      )

      let fields: ModelAttributes<Model<any, any>, any> = {}

      tableInfo.columns.forEach((column) => {
        if (column.columnName === "id") return
        fields[column.columnName] = {
          type: column.databaseType,
          allowNull: column.isNull,
          defaultValue: column.default,
          primaryKey: column.isPrimary,
          values: column.isEnum ? column.enumValues : null,
        }
      })

      tableInstance = connection.instance.define(
        moduleProps.table,
        {
          ...fields,
          ...get(moduleProps, "extendFields", {}),
        },
        {
          ...get(moduleProps, "tableOptions", {}),
          ...databaseDefaultOptions.sql.defaultTableOptions,
        }
      )

      if (moduleProps?.graphql?.schema) {
        graphqlSchema = moduleProps.graphql.schema.replace("}", "").split("\n")
      } else {
        tableInfo.columns.forEach((columnInfo) => {
          if (columnInfo.isEnum) {
            store.graphql.typeDefs = store.graphql.typeDefs.concat(
              generateEnumTypeForGraphql(columnInfo)
            )
          }
          graphqlSchema.push(
            `${columnInfo.columnName}: ${columnInfo.graphqlType}`
          )
        })
      }

      updateSchema = getUpdateSchema(moduleProps, tableInfo)

      insertSchema = getInsertSchema(moduleProps, tableInfo)

      orderSchema = getOrderSchema(moduleProps, tableInfo)

      tableInfo.columns.forEach((column) => {
        let filter_input =
          column.databaseType.toLowerCase() === "enum"
            ? `${column.columnName}: ${column.graphqlType}`
            : `${
                column.columnName
              }: ${column.graphqlType.toLowerCase()}_filter_input`

        filterSchema.push(filter_input)
      })

      listSchema = `
        query List${moduleProps.name} {
          rows: [${moduleProps.name}]
          paginationProperties: PaginationProperties
          filters: ${moduleProps.name}Filters
        }
      `

      graphqlSchema.push("}")
      filterSchema.push("}")
    }

    const schemaInformation = {
      moduleName: moduleProps.name,
      tableInstance: tableInstance,
      schema: graphqlSchema.join(`\n`),
      props: moduleProps,
      inputSchema: {
        insert: insertSchema || "",
        update: updateSchema || "",
        list: listSchema,
        filters: filterSchema.join("\n"),
        order_schema: orderSchema || "",
      },
    }

    if (useDatabase) {
      generateGenerateGraphQLCrud(moduleProps, schemaInformation, store)
      app.models[moduleProps.name] = tableInstance
    }

    wLogWithInfo(`[Wertik-Module]`, `Initialized module "${moduleProps.name}"`)

    return schemaInformation
  }
}

export function validateModules(wertikApp: WertikApp) {
  wLogWithInfo("Validating:", "Modules")
  Object.keys(wertikApp.modules).forEach((name) => {
    let module = wertikApp.modules[name]
    if (name !== module.props.name) {
      wLogWithError(
        "[MODULE NAME CONFLICT]",
        "Please use same name for both key and module name"
      )
      process.exit()
    }
  })
}
