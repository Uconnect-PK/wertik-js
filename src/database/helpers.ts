import { MysqlColumnInfoDescribeTable } from "src/types/database"
import { capitalizeFirstLetter } from "../utils/capitalizeFirstLetter"
import {
  numberTypes,
  dateTypes,
  stringTypes,
  enumTypes,
  jsonTypes,
} from "./mysql/getTableInfo"
import { WertikApp } from "src/types"
import get from "lodash.get"

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



export const applyRelationshipsFromStoreToDatabase = async (
  app: WertikApp
) => {
  Object.keys(app.database).forEach(dbName => {
    let db = app.database[dbName]
    console.log(db.credentials)
  });
}
