import { iObject } from "."

export interface WithMysqlDatabaseProps {
  /**
   * Database name
   */
  name: string
  /**
   * Database user name
   */
  username: string
  /**
   * Database user password
   */
  password: string
  /**
   * Database host
   */
  host: string
  /**
   * Database port
   */
  port: number
  /**
   * Sequelize Database options.
   */
  options?: iObject
}

export interface TableInfo {
  name: string
  columns: {
    columnName: string
    type: string
    isNull: boolean
    key: string
    default: string | number
    extra: any
    graphqlType: string
    graphqlInsertInputType: string
    graphqlUpdateInputType: string
    enumValues: string[] | null
    isEnum: boolean
    isPrimary: boolean
    databaseType: string
    isDateColumn: boolean
  }[]
  originalDescribeColumns: MysqlColumnInfoDescribeTable[]
}

export interface MysqlColumnInfoDescribeTable {
  Field: string
  Type: string
  Null: string
  Key: string
  Default: null
  Extra: string
}
