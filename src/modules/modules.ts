import get from 'lodash.get'
import crud from '../crud'
import { databaseDefaultOptions } from '../borrowed/options'
import { RelationParams, useModuleProps } from '../types/modules'
import {
  generateDataTypeFromDescribeTableColumnType,
  getCreateSchema,
  getGraphQLTypeNameFromSqlType,
  getUpdateSchema,
  generateEnumTypeForGraphql,
} from './modulesHelpers'

const generateGenerateGraphQLCrud = (props: useModuleProps, schemaInformation, store) => {
  const { graphql } = crud(props, schemaInformation, store)
  const resolvers = graphql.generateCrudResolvers()

  store.graphql.typeDefs = store.graphql.typeDefs.concat(
    `\n ${schemaInformation.schema} 
    \n ${schemaInformation.inputSchema.filters}
    \n ${schemaInformation.inputSchema.create}
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
 * Wertik js module
 * @param props see interface useModuleProps
 */
export const useModule = (module: useModuleProps) => {
  return async ({ store, configuration, app }: any) => {
    let tableInstance
    let graphqlSchema = []
    let createSchema = []
    let updateSchema = []

    const useDatabase = module.useDatabase ?? false

    const useSchema = (string: string): void => {
      store.graphql.typeDefs = store.graphql.typeDefs.concat(`
        ${string}
      `)
    }

    const useQuery = ({ query, resolver, name }): void => {
      store.graphql.typeDefs = store.graphql.typeDefs.concat(`
        extend type Query {
          ${query}
        }
      `)
      store.graphql.resolvers.Query[name] = resolver
    }

    const useMutation = ({ query, resolver, name }): void => {
      store.graphql.typeDefs = store.graphql.typeDefs.concat(`
        extend type Mutation {
          ${query}
        }
      `)
      store.graphql.resolvers.Mutation[name] = resolver
    }

    const useExpress = (fn = (express) => {}): void => {
      setTimeout(() => {
        fn(app.express)
      }, 2500)
    }

    let listSchema = ''
    let filterSchema = []
    if (useDatabase) {
      const connection = app.database[module.database]
      const describe = await connection.instance.query(
        `describe ${module.table}`
      )
      const tableInformation = describe[0]

      const fields = {}

      tableInformation.forEach((element) => {
        if (element.Field === 'id') {
          return
        }
        const { type } = generateDataTypeFromDescribeTableColumnType(
          element.Type
        )
        fields[element.Field] = {
          type: {
            type,
            null: element.Null === 'YES',
          },
        }
        tableInstance = connection.instance.define(
          module.table,
          {
            ...fields,
            ...get(module, 'extendFields', {}),
          },
          {
            ...get(module, 'tableOptions', {}),
            ...databaseDefaultOptions.sql.defaultTableOptions,
          }
        )
      })

      if (module?.graphql?.schema) {
        graphqlSchema = module.graphql.schema.replace('}', '').split('\n')
      } else {
        // graphql schema
        graphqlSchema = [`type ${module.name} {`]

        tableInformation.forEach((element) => {
          if (element.Type.includes('enum')) {
            store.graphql.typeDefs = store.graphql.typeDefs.concat(
              generateEnumTypeForGraphql(element, module)
            )
          }
          graphqlSchema.push(
            `${element.Field}: ${getGraphQLTypeNameFromSqlType(
              element,
              module
            )}`
          )
        })
      }

      updateSchema = getUpdateSchema(module, tableInformation)

      createSchema = getCreateSchema(module, tableInformation)

      filterSchema = [`input ${module.name}FilterInput {`]

      tableInformation.forEach((element) => {
        if (
          element.Type.includes('timestamp') ||
          element.Type.includes('datetime') ||
          element.Type.includes('varchar') ||
          element.Type.includes('text')
        ) {
          filterSchema.push(`${element.Field}: StringFilterInput`)
        } else if (
          element.Type.includes('int') ||
          element.Type.includes('number')
        ) {
          filterSchema.push(`${element.Field}: IntFilterInput`)
        }
      })

      listSchema = `
        query List${module.name} {
          list: [${module.name}]
          paginationProperties: PaginationProperties
          filters: ${module.name}Filters
        }
      `
    }

    const hasOne = (params: RelationParams): void => {
      graphqlSchema.push(`${params.graphqlKey}: ${params.module}`)
      store.database.relationships.push({
        currentModule: module.name,
        currentModuleDatabase: module.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: 'hasOne',
      })
    }
    const belongsTo = (params: RelationParams): void => {
      graphqlSchema.push(`${params.graphqlKey}: ${params.module}`)
      store.database.relationships.push({
        currentModule: module.name,
        currentModuleDatabase: module.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: 'belongsTo',
      })
    }
    const belongsToMany = (params: RelationParams): void => {
      graphqlSchema.push(`${params.graphqlKey}: ${params.module}List`)
      store.database.relationships.push({
        currentModule: module.name,
        currentModuleDatabase: module.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: 'belongsToMany',
      })
    }
    const hasMany = (params: RelationParams): void => {
      graphqlSchema.push(`${params.graphqlKey}: ${params.module}List`)
      store.database.relationships.push({
        currentModule: module.name,
        currentModuleDatabase: module.database,
        graphqlKey: params.graphqlKey,
        referencedModule: params.module,
        referencedModuleDatabase: params.database,
        options: params.options,
        type: 'hasMany',
      })
    }

    get(module, 'on', () => {})({
      useQuery,
      useMutation,
      useExpress,
      hasOne,
      belongsTo,
      belongsToMany,
      hasMany,
      useSchema,
    })

    if (useDatabase) {
      graphqlSchema.push('}')
      filterSchema.push('}')
    }

    const schemaInformation = {
      tableInstance,
      schema: graphqlSchema.join('\n'),
      inputSchema: {
        create: createSchema || '',
        update: updateSchema || '',
        list: listSchema,
        filters: filterSchema.join('\n'),
      },
    }

    if (useDatabase) {
      generateGenerateGraphQLCrud(module, schemaInformation, store)
      app.models[module.name] = tableInstance
    }

    console.log('[Module]', `Initialized module "${module.name}"`)

    return schemaInformation
  }
}
