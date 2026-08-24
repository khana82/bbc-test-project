const pages = ["/", "/news", "/sport", "/weather", "/iplayer", "/sounds"]

describe("BBC SEO and metadata", () => {
  pages.forEach((path) => {
    it(`has title and viewport metadata on ${path}`, () => {
      cy.visit(path)
      cy.title().should("include", "BBC")
      cy.get("meta[name='viewport']")
        .should("have.attr", "content")
        .and("not.be.empty")
    })
  })
})
