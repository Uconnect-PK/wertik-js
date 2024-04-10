import store from "../store"
import convertFiltersIntoSequelizeObject from "../utils/convertFiltersIntoSequelizeObject"
import omit from "lodash.omit"
import isPlainObject from "lodash.isplainobject"

export const paginate = async (
  arg,
  tableInstance,
  includes: any[] = [],
  queryOptions: { [key: string]: any } = {},
  order = []
) => {
  const { page = 1, limit = 100 } = arg.pagination ?? {}
  const offset = limit * (page - 1)
  const keys = [
    ...store.database.relationships.map((c) => c.graphqlKey),
    ...store.graphql.graphqlKeys,
  ]
  let where = omit(convertFiltersIntoSequelizeObject(arg.where), keys)

  const { count, rows } = await tableInstance.findAndCountAll({
    where,
    offset,
    limit,
    order,
    include: includes,
    ...queryOptions,
  })

  const totalPages = Math.ceil(count / limit)
  const pagination = {
    total: count,
    nextPage: page + 1,
    page,
    previousPage: page === 1 ? 1 : page - 1,
    pages: totalPages,
    hasMore: page < totalPages,
    limit,
  }
  return {
    rows: rows,
    paginationProperties: pagination,
    pagination,
  }
}
