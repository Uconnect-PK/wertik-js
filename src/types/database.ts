import { iObject } from "."
import { AddMutationProps, AddQueryProps, RelationParams } from "./modules"

export interface SqlTable {
  name: string
  /**
   * Sequelize Table Options
   */
  tableOptions?: iObject
  /**
   * Provide set of fields to extend a table, mostly can be used to update createdAt and updatedAt columns.
   */
  extendFields?: iObject
  /**
   * Graphql options for this module.
   */
  graphql?: {
    /**
     * Wertik-js creates schema by default from the database table. Once you defined this Wertik-js will ignore taking schema from the database.
     */
    schema?: string
    /**
     * Wertik-js creates an update schema from the database table. Once defined, Wertik JS will ignore creating an update schema from table information.
     */
    updateSchema?: string
    /**
     * Wertik-js creates create a schema from the database table. Once defined this, Wertik JS will ignore creating create a schema from the table information.
     */
    insertSchema: string
  }
  relationships?: {
    hasOne?: {
      [tableName: string]: {
        as: string
        [key: string]: any
      }
    }
    hasMany?: {
      [tableName: string]: {
        as: string
        [key: string]: any
      }
    }
    belongsTo?: {
      [tableName: string]: {
        as: string
        [key: string]: any
      }
    }
    belongsToMany?: {
      [tableName: string]: {
        as: string
        [key: string]: any
      }
    }
  }
}
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
  /**
   * Tables
   */
  tables?: SqlTable[]
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
