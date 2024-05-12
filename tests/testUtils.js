exports.database = {
  name: process.env.TEST_DATABASE_NAME,
  host: process.env.TEST_DATABASE_HOST,
  password: process.env.TEST_DATABASE_PASSWORD,
  port: process.env.TEST_DATABASE_PORT,
  username: process.env.TEST_DATABASE_USERNAME,
}

exports.Product = {
  name: "Product",
  useDatabase: true,
  database: "default",
  table: process.env.TEST_DATABASE_TABLE_PRODUCT,
  on: function ({ belongsTo }) {
    belongsTo({
      database: "ecommerce",
      graphqlKey: "user",
      module: "User",
      options: {
        as: "user",
        foreignKey: "user_id",
        targetKey: "id",
      },
    })
  },
}

exports.User = {
  name: "User",
  useDatabase: true,
  database: "default",
  table: process.env.TEST_DATABASE_TABLE_USER,
  on: function ({ hasMany }) {
    hasMany({
      database: "ecommerce",
      graphqlKey: "products",
      module: "Product",
      options: {
        as: "products",
        foreignKey: "user_id",
        sourceKey: "id",
      },
    })
  },
}
