import wertik, { withModule } from "./index"

export default {
  User: withModule({
    name: "User",
    useDatabase: true,
    database: "default",
    table: "users",
    on: function ({ hasOne, hasMany, belongsTo, getExpress }) {
      hasMany({
        database: "default",
        module: "Post",
        graphqlKey: "posts",
        options: {
          as: "posts",
          foreignKey: "created_by",
          sourceKey: "id",
        },
      })
    },
  }),
  Comment: withModule({
    name: "Comment",
    useDatabase: true,
    database: "default",
    table: "comments",
    on: function ({ hasOne }) {
      hasOne({
        module: "Post",
        graphqlKey: "post",
        database: "default",
        options: {
          sourceKey: "post_id",
          foreignKey: "id",
          as: "post",
        },
      })
      hasOne({
        module: "User",
        graphqlKey: "created_by",
        database: "default",
        options: {
          sourceKey: "created_by_id",
          foreignKey: "id",
          as: "created_by",
        },
      })
    },
  }),
  Post: withModule({
    name: "Post",
    useDatabase: true,
    database: "default",
    table: "post",
    on: function ({ hasOne, hasMany, belongsTo, getExpress }) {
      hasOne({
        module: "User",
        graphqlKey: "author",
        database: "default",
        options: {
          as: "author",
          sourceKey: "created_by",
          foreignKey: "id",
        },
      })
      hasOne({
        module: "User",
        graphqlKey: "last_updated_by",
        database: "default",
        options: {
          as: "last_updated_by",
          sourceKey: "last_updated_by_id",
          foreignKey: "id",
        },
      })
    },
  }),
}
