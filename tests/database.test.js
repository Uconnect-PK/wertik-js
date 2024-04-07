require("dotenv").config()

const {
  default: wertik,
  withMysqlDatabase,
} = require("../lib/index")

const { database } = require("./testUtils")

if (database.name) {
  test("Expect test database to connect and does not causes error", async () => {
    await expect(
      wertik({
        database: {
          default: withMysqlDatabase(database),
        },
      })
    ).resolves.not.toThrowError()
  })
}
