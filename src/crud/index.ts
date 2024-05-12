import get from "lodash.get"
import { wLogWithDateWithInfo } from "../utils/log"
import { convertGraphqlRequestedFieldsIntoInclude } from "../database/eagerLoadingGraphqlQuery"
import {
  generateRequestedFieldsFromGraphqlInfo,
  convertWordIntoSingular,
  convertWordIntoPlural,
} from "../modules/modulesHelpers"
import convertFiltersIntoSequelizeObject from "../utils/convertFiltersIntoSequelizeObject"
import graphqlFields from "graphql-fields"
import { paginate } from "./paginate"
import omit from "lodash.omit"
import { voidFunction } from "../utils/voidFunction"

export default function (table, schemaInformation, store) {
  let rowsFieldName = convertWordIntoPlural(table.name)
  let singleRowFieldName = convertWordIntoSingular(table.name)

  return {
    graphql: {
      generateQueriesCrudSchema() {
        return `
        type ${table.name}List {
            rows: [${table.name}]
            pagination: Pagination
            paginationProperties: PaginationProperties @deprecated(reason: "Use pagination instead")
        }
        type ${table.name}_bulk_mutation_response {
            returning: [${table.name}]
            affectedRows: Int
        }
        type Count${table.name} {
            count: Int
        }

        extend type Query {
            ${singleRowFieldName}(where: ${singleRowFieldName}_filter_input): ${table.name}
            ${rowsFieldName}(pagination: PaginationInput, where: ${singleRowFieldName}_filter_input, order: ${convertWordIntoSingular(table.name)}_order_input): ${table.name}List
            count${table.name}(where: ${singleRowFieldName}_filter_input):  Int
        }`
      },
      generateMutationsCrudSchema() {
        return `
            extend type Mutation {
              update_${rowsFieldName}(input: update_${table.name}_input,where: ${singleRowFieldName}_filter_input!): ${table.name}_bulk_mutation_response
              insert_${rowsFieldName}(input: [insert_${rowsFieldName}_input]): ${table.name}_bulk_mutation_response
              delete_${rowsFieldName}(where: ${singleRowFieldName}_filter_input!): SuccessResponse
              insert_or_update_${rowsFieldName}(id: Int, input: insert_${rowsFieldName}_input): ${table.name}List
            }
          `
      },
      generateCrudResolvers() {
        return {
          Mutation: {
            [`insert_or_update_${rowsFieldName}`]: get(
              table,
              "graphql.mutations.InsertOrUpdate",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  table,
                  "events.beforeInsertOrUpdate",
                  voidFunction
                )(_, args, context, info)
                args = argsFromEvent ? argsFromEvent : args
                const id = args.id
                let ___find: any
                if (id) {
                  ___find = await schemaInformation.tableInstance.findOne({
                    where: {
                      id: id,
                    },
                  })

                  if (!___find) {
                    throw new Error(`${table.name} Not found`)
                  }

                  await schemaInformation.tableInstance.update(args.input, {
                    where: { id: id },
                  })

                  return await schemaInformation.tableInstance.findOne({
                    where: { id: id },
                  })
                } else {
                  return await schemaInformation.tableInstance.create(
                    args.input
                  )
                }
              }
            ),
            [`update_${rowsFieldName}`]: get(
              table,
              "graphql.mutations.update",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  table,
                  "events.beforeUpdate",
                  voidFunction
                )(_, args, context, info)
                args = argsFromEvent ? argsFromEvent : args
                const where = await convertFiltersIntoSequelizeObject(
                  args.where
                )
                const response = await schemaInformation.tableInstance.update(
                  args.input,
                  {
                    where: where,
                  }
                )
                const all = await schemaInformation.tableInstance.findAll({
                  where: where,
                })
                return {
                  returning: all,
                  affectedRows: response[0],
                }
              }
            ),
            [`delete_${rowsFieldName}`]: get(
              table,
              "graphql.mutations.delete",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  table,
                  "events.beforeDelete",
                  voidFunction
                )(_, args, context, info)
                args = argsFromEvent ? argsFromEvent : args
                const where = await convertFiltersIntoSequelizeObject(
                  args.where
                )
                await schemaInformation.tableInstance.destroy({
                  where: where,
                })
                return { message: `${table.name} Deleted` }
              }
            ),
            [`insert_${rowsFieldName}`]: get(
              table,
              "graphql.mutations.create",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  table,
                  "events.beforeCreate",
                  voidFunction
                )(_, args, context, info)
                args = argsFromEvent ? argsFromEvent : args
                const response = []
                for (const input of args.input) {
                  response.push(
                    await schemaInformation.tableInstance.create(input)
                  )
                }
                return {
                  returning: response,
                  affectedRows: response.length,
                }
              }
            ),
          },
          Query: {
            [singleRowFieldName]: get(
              table,
              "graphql.queries.view",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Query]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  table,
                  "events.beforeView",
                  voidFunction
                )(_, args, context, info)
                const keys = [
                  ...store.database.relationships.map((c) => c.graphqlKey),
                  ...store.graphql.graphqlKeys,
                ]

                args = argsFromEvent ? argsFromEvent : args
                const where = await convertFiltersIntoSequelizeObject(
                  args.where
                )

                const convertFieldsIntoInclude =
                  convertGraphqlRequestedFieldsIntoInclude(
                    graphqlFields(info, {}, { processArguments: true }),
                    args,
                    table.name
                  )

                const find = await schemaInformation.tableInstance.findOne({
                  where: omit(where, keys),
                  attributes: generateRequestedFieldsFromGraphqlInfo(
                    schemaInformation.tableInstance.tableName,
                    graphqlFields(info)
                  ),
                  include: convertFieldsIntoInclude.include,
                  order: convertFieldsIntoInclude.order,
                })

                return find
              }
            ),
            [rowsFieldName]: get(
              table,
              "graphql.queries.list",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Query]",
                  `${rowsFieldName} - args ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  table,
                  "events.beforeList",
                  voidFunction
                )(_, args, context, info)
                args = argsFromEvent ? argsFromEvent : args

                const convertFieldsIntoInclude =
                  convertGraphqlRequestedFieldsIntoInclude(
                    graphqlFields(info, {}, { processArguments: true }),
                    args,
                    table.name
                  )

                return await paginate(
                  args,
                  schemaInformation.tableInstance,
                  convertFieldsIntoInclude.include,
                  {
                    attributes: generateRequestedFieldsFromGraphqlInfo(
                      schemaInformation.tableInstance.tableName,
                      graphqlFields(info).rows
                    ),
                  },
                  convertFieldsIntoInclude.order
                )
              }
            ),
            [`count${table.name}`]: get(
              table,
              "graphql.queries.count",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Query]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  table,
                  "events.beforeCount",
                  voidFunction
                )(_, args, context, info)
                args = argsFromEvent ? argsFromEvent : args
                const where = await convertFiltersIntoSequelizeObject(
                  args.where
                )
                const keys = [
                  ...store.database.relationships.map((c) => c.graphqlKey),
                  ...store.graphql.graphqlKeys,
                ]
                const count = await schemaInformation.tableInstance.count({
                  where: omit(where, keys),
                })
                return count
              }
            ),
          },
        }
      },
    },
  }
}
