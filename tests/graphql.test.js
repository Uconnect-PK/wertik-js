require("dotenv").config()

const {
  default: wertik,
  withModule,
  withMysqlDatabase,
  withApolloGraphql,
} = require("../lib/index")

const { database, Product, User } = require("./testUtils")

if (database.name) {
  describe("Expect withMysqlDatabase, withModule and withApolloGraphql, and expect module graphql operations work", () => {
    let app
    test("Expect test database to connect and does not causes error", async () => {
      await expect(
        (app = wertik({
          database: {
            default: withMysqlDatabase(database),
          },
          modules: {
            Product: withModule(Product),
            User: withModule(User),
          },
          graphql: withApolloGraphql(),
        }).then((wertikApp) => {
          app = wertikApp
        }))
      ).resolves.not.toThrowError()
    })

    let testItem = null

    test("Expect graphql to insert data", async () => {
      // describe create works
      testItem = await app.graphql.executeOperation({
        query: `
          mutation {
          insert_products(input: {
            sizes: lg
            user_id: 1
            title: "My first product"
            category_id: 1
          }) {
            returning {
              id
              user_id
              sizes
            }
          }
        }
        `,
      })
      expect(testItem.data.insert_products.returning[0].id).toBeGreaterThan(0)
      expect(testItem.data.insert_products.returning[0].sizes).toBe("lg")
    })
    // update
    test(`Expect graphql to update data`, async () => {
      let updatedItem = await app.graphql.executeOperation({
        query: `
            mutation {
              update_products(input: { sizes: xxxl, title: "My product title" }, where: { id: { _eq: ${testItem.data.insert_products.returning[0].id} } }) {
                returning {
                  id
                  sizes
                }
              }
            }        
        `,
      })
      expect(updatedItem.data.update_products.returning[0].id).toBeGreaterThan(
        0
      )
      expect(updatedItem.data.update_products.returning[0].sizes).toBe("xxxl")
    })
    // view
    test("Expect graphql to view data", async () => {
      let viewItem = await app.graphql.executeOperation({
        query: `
            query {
              product(where: { sizes: xxxl }) {
                id
                sizes
              }
            }
            
        `,
      })
      expect(viewItem.data.product.sizes).toBe("xxxl")
    })
    // deleted
    test("Expect graphql to delete data", async () => {
      let deletedItem = await app.graphql.executeOperation({
        query: `
              mutation {
                  delete_products(where: { id: { _eq: ${testItem.data.insert_products.returning[0].id} } }) {
                    message
                  }
                }              
          `,
      })
      expect(deletedItem.data.delete_products.message.length).toBeGreaterThan(0)
    })

    test("Expect a one to one relationship to work", async () => {
      let viewItem = await app.graphql.executeOperation({
        query: `
            query {
              product(where: { sizes: xxxl }) {
                id
                sizes
                user {
                  id
                  name
                }
              }
            }
            
        `,
      })
      expect(viewItem.data.product.sizes).toBe("xxxl")
      expect(viewItem.data.product.user.id).toBeGreaterThan(0)
    })
    test("Expect a one to many relationship to work", async () => {
      let viewItem = await app.graphql.executeOperation({
        query: `
            query {
              user(where: { id: { _eq: 1 } }) {
                id
                name
                products {
                  id
                  sizes
                }
              }
            }
            
        `,
      })
      expect(viewItem.data.user.id).toBeGreaterThan(0)
      expect(viewItem.data.user.products.length).toBeGreaterThan(0)
      expect(viewItem.data.user.products[0].id).toBeGreaterThan(0)
    })
  })
}
