import { iObject } from "."
import { ModelStatic, Model } from "sequelize/types"

export interface AddQueryProps {
  /**
   * Schema for this query, for example: getUsers: [Users]
   */
  query: string
  /**
   * Resolver method for this query.
   */
  resolver: Function
  /**
   * Add a name to your query for example: getUsers
   */
  name: string
}
export interface AddMutationProps {
  /**
   * Schema for this query, for example: deleteUsers: Boolean
   */
  query: string
  /**
   * Resolver method for this mutation.
   */
  resolver: Function
  /**
   * Add a name to your mutation for example: deleteUsers
   */
  name: string
}
export type GetExpressProps = Function
export interface RelationParams {
  module: string
  graphqlKey: string
  database: string
  options?: {
    [key: string]: string | number | null
  }
}

export interface WithModuleProps {
  /**
   * Your module name.
   */
  name: string
  /**
   * If your module requires a database connection, you will need to provide a database and table using the 'useDatabase' property. This property should be set to the name of the database and table that your module will use to perform its operations.
   */
  useDatabase: boolean
  /**
   * Database table name.
   */
  table?: string
  /**
   * Database name.
   */
  database?: string

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
    mutations?: {
      /**
       * Overrides default behavior of updating a record from the database table.
       */
      update?: Function
      /**
       * Overrides default behavior of deleting a record from the database table.
       */
      delete?: Function
      /**
       * Overrides default behavior of create a record from the database table.
       */
      insert?: Function
      /**
       * Overrides default behavior of creating or updating a record from the database table.
       */
      insertOrUpdate?: Function
    }
  }
  /**
   * on method helps you add functionality to your module, Like adding relationships, queries, mutations, adding schema.
   */
  on?: (obj: {
    /**
     * This Method allows you adding graphql query to your module.
     */
    addQuery: (props: AddQueryProps) => {} | void
    /**
     * This Method allows you adding graphql mutation to your module.
     */
    addMutation: (props: AddMutationProps) => {} | void
    /**
     * This method gives you access to express app instance.
     */
    getExpress: (express: any) => void
    /**
     * This method adds a one-to-one relationship to a module.
     */
    hasOne: (props: RelationParams) => {} | void
    /**
     * This method adds belongs to relationship to a module.
     */
    belongsTo: (props: RelationParams) => {} | void
    /**
     * This method adds one to many relationship to a module.
     */
    belongsToMany: (props: RelationParams) => {} | void
    /**
     * This method adds belongs to many relationship to a module.
     */
    hasMany: (props: RelationParams) => {} | void
    /**
     * This method adds has many relationship to a module.
     */
    extendSchema: (props: string) => {} | void
  }) => void
  /**
   * Graphql events when a CRUD operation happens.
   */
  events?: {
    /**
     * This events runs before beforeView query.
     */
    beforeView?: Function
    /**
     * This events runs before beforeCount query.
     */
    beforeCount?: Function
    /**
     * This events runs before beforeList query.
     */
    beforeList?: Function
    /**
     * This events runs before beforeCreate mutation.
     */
    beforeInsert?: Function
    /**
     * This events runs before beforeDelete mutation.
     */
    beforeDelete?: Function
    /**
     * This events runs before beforeUpdate mutation.
     */
    beforeUpdate?: Function
    /**
     * This events runs before beforeInsertOrUpdate mutation.
     */
    beforeInsertOrUpdate?: Function
  }
}

export interface WertikModule {
  tableInstance: ModelStatic<Model<any, any>>
  schema: string
  inputSchema: {
    insert: string | any[]
    update: string | any[]
    list: string
    filters: string
  },
  props: WithModuleProps
}
