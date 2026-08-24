const paths = ["/", "/news", "/sport", "/weather", "/iplayer", "/sounds"]

describe("BBC HTTP status checks", () => {
  paths.forEach((path) => {
    it(`returns 200 for ${path}`, () => {
      cy.request(path).its("status").should("eq", 200)
    })
  })
})
