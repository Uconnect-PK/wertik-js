import get from "lodash.get"
import { wLogWithDateWithInfo } from "../utils/log"
import { convertGraphqlRequestedFieldsIntoInclude } from "../database/eagerLoadingGraphqlQuery"
import {
  generateRequestedFieldsFromGraphqlInfo,
  generateRowFieldNameForModuleName,
  generateRowsFieldNameForModuleName,
} from "../modules/modulesHelpers"
import convertFiltersIntoSequelizeObject from "../utils/convertFiltersIntoSequelizeObject"
import graphqlFields from "graphql-fields"
import { paginate } from "./paginate"
import omit from "lodash.omit"
import { voidFunction } from "../utils/voidFunction"

export default function (module, schemaInformation, store) {
  let rowsFieldName = generateRowsFieldNameForModuleName(module.name)
  let singleRowFieldName = generateRowFieldNameForModuleName(module.name)

  return {
    graphql: {
      generateQueriesCrudSchema() {
        return `
        type ${module.name}List {
            rows: [${module.name}Module]
            pagination: Pagination
            sorting: Sorting
            paginationProperties: PaginationProperties @deprecated(reason: "Use pagination instead")
        }
        type ${module.name}BulkMutationResponse {
            returning: [${module.name}Module]
            affectedRows: Int
        }
        type Count${module.name} {
            count: Int
        }

        extend type Query {
            ${singleRowFieldName}(where: ${singleRowFieldName}_filter_input): ${module.name}Module
            ${rowsFieldName}(pagination: PaginationInput, where: ${singleRowFieldName}_filter_input, sorting: [SortingInput]): ${module.name}List
            count${module.name}(where: ${singleRowFieldName}_filter_input):  Int
        }`
      },
      generateMutationsCrudSchema() {
        return `
            extend type Mutation {
              update_${rowsFieldName}(input: update${module.name}Input,where: ${singleRowFieldName}_filter_input!): ${module.name}BulkMutationResponse
              insert_${rowsFieldName}(input: [insert_${rowsFieldName}_input]): ${module.name}BulkMutationResponse
              delete_${rowsFieldName}(where: ${singleRowFieldName}_filter_input!): SuccessResponse
              insert_or_update_${rowsFieldName}(id: Int, input: insert_${rowsFieldName}_input): ${module.name}List
            }
          `
      },
      generateCrudResolvers() {
        return {
          Mutation: {
            [`insert_or_update_${rowsFieldName}`]: get(
              module,
              "graphql.mutations.InsertOrUpdate",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  module,
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
                    throw new Error(`${module.name} Not found`)
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
              module,
              "graphql.mutations.update",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  module,
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
              module,
              "graphql.mutations.delete",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  module,
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
                return { message: `${module.name} Deleted` }
              }
            ),
            [`insert_${rowsFieldName}`]: get(
              module,
              "graphql.mutations.create",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Mutation]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  module,
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
              module,
              "graphql.queries.view",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Query]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  module,
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

                const find = await schemaInformation.tableInstance.findOne({
                  where: omit(where, keys),
                  attributes: generateRequestedFieldsFromGraphqlInfo(
                    graphqlFields(info)
                  ),
                  include: convertGraphqlRequestedFieldsIntoInclude(
                    graphqlFields(info, {}, { processArguments: true }),
                    args,
                    module
                  ),
                })

                return find
              }
            ),
            [rowsFieldName]: get(
              module,
              "graphql.queries.list",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Query]",
                  `${rowsFieldName} - args ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  module,
                  "events.beforeList",
                  voidFunction
                )(_, args, context, info)
                args = argsFromEvent ? argsFromEvent : args

                return await paginate(
                  args,
                  schemaInformation.tableInstance,
                  convertGraphqlRequestedFieldsIntoInclude(
                    graphqlFields(info, {}, { processArguments: true }),
                    args,
                    module
                  ),
                  {
                    attributes: generateRequestedFieldsFromGraphqlInfo(
                      graphqlFields(info).rows
                    ),
                  }
                )
              }
            ),
            [`count${module.name}`]: get(
              module,
              "graphql.queries.count",
              async (_, args, context, info) => {
                wLogWithDateWithInfo(
                  "[Wertik-GraphQL-Query]",
                  `${info.fieldName} - ${JSON.stringify(args)}`
                )
                const argsFromEvent = await get(
                  module,
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
                  include: convertGraphqlRequestedFieldsIntoInclude(
                    graphqlFields(info, {}, { processArguments: true }),
                    args,
                    module
                  ),
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
