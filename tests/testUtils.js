exports.database = {
  name: process.env.TEST_DATABASE_NAME,
  host: process.env.TEST_DATABASE_HOST,
  password: process.env.TEST_DATABASE_PASSWORD,
  port: +process.env.TEST_DATABASE_PORT,
  username: process.env.TEST_DATABASE_USERNAME,
  tables: [
    {
      name: process.env.TEST_DATABASE_TABLE_PRODUCT,
      relationships: {
        belongsTo: {
          user: {
            as: "user",
            foreignKey: "user_id",
            targetKey: "id",
          },
        },
      },
    },
    {
      name: process.env.TEST_DATABASE_TABLE_USER,
      relationships: {
        hasMany: {
          product: {
            as: "products",
            foreignKey: "user_id",
            sourceKey: "id",
          },
        },
      },
    },
  ],
}
