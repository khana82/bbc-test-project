const pages = ["/", "/news", "/sport", "/weather", "/iplayer", "/sounds"]

const snapshotNameFor = (path) =>
  `bbc-${path.replace(/^\//, "") || "home"}-tablet`

describe("BBC tablet visuals", () => {
  beforeEach(() => cy.viewport(820, 1180))

  pages.forEach((path) => {
    it(`renders ${path} on tablet`, () => {
      cy.visit(path)
      if (Cypress.browser.name === "chrome") {
        cy.waitForFonts()
        cy.matchImageSnapshot(snapshotNameFor(path))
      }
    })
  })
})
