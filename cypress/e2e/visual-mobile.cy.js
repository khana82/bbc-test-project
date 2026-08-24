const pages = ["/", "/news", "/sport", "/weather", "/iplayer", "/sounds"]

const snapshotNameFor = (path) =>
  `bbc-${path.replace(/^\//, "") || "home"}-mobile`

describe("BBC mobile visuals", () => {
  beforeEach(() => cy.viewport(390, 844))

  pages.forEach((path) => {
    it(`renders ${path} on mobile`, () => {
      cy.visit(path)
      if (Cypress.browser.name === "chrome") {
        cy.waitForFonts()
        cy.matchImageSnapshot(snapshotNameFor(path))
      }
    })
  })
})
