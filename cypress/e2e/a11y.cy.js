const pages = ["/", "/news", "/sport", "/weather", "/iplayer", "/sounds"]

describe("BBC accessibility", () => {
  pages.forEach((path) => {
    it(`checks WCAG 2.2 AA on ${path}`, () => {
      cy.visit(path)
      cy.injectAxe()
      cy.checkA11y(null, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      })
    })
  })
})
