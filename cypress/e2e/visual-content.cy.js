const pages = ["/", "/news", "/sport", "/weather", "/iplayer", "/sounds"]

const snapshotNameFor = (path) =>
  `bbc-${path.replace(/^\//, "") || "home"}-desktop`

describe("BBC desktop visuals", () => {
  pages.forEach((path) => {
    it(`renders ${path}`, () => {
      cy.visit(path)
      if (Cypress.browser.name === "chrome") {
        cy.waitForFonts()
        cy.matchImageSnapshot(snapshotNameFor(path))
      }
    })
  })
})
