import isPlainObject from "lodash.isplainobject"
import sequelize from "sequelize"
const Op = sequelize.Op

const wrap = (operator: string) => {
  return Op[operator.replace("_", "")]
}

const replaceFilterOperators = (obj) => {
  if (isPlainObject(obj)) {
    Object.keys(obj).forEach((element) => {
      const value = obj[element]
      if (element.startsWith("_")) {
        const newElement = wrap(element)
        obj[newElement] = obj[element]
        delete obj[element]
      }
      if (isPlainObject(value) || Array.isArray(value)) {
        replaceFilterOperators(value)
      }
    })
    return obj
  } else if (Array.isArray(obj)) {
    obj.forEach((element) => replaceFilterOperators(element))
  }
}

export default replaceFilterOperators
