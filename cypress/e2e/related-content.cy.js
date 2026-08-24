const pages = ["/news", "/sport", "/weather", "/iplayer", "/sounds"]

describe("BBC related content", () => {
  pages.forEach((path) => {
    it(`provides article links on ${path}`, () => {
      cy.visit(path)
      cy.get('main a[href], [role="main"] a[href]').should(
        "have.length.greaterThan",
        0,
      )
    })
  })
})
