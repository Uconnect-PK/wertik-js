import replaceFilterOperators from "./replaceFilterOperators"

const convertFiltersIntoSequelizeObject = (filters) => {
  return filters ? replaceFilterOperators(filters) : {}
}

export default (filters) => convertFiltersIntoSequelizeObject(filters)
