const pages = [
  { path: "/", label: "BBC" },
  { path: "/news", label: "News" },
  { path: "/sport", label: "Sport" },
  { path: "/weather", label: "Weather" },
  { path: "/iplayer", label: "iPlayer" },
  { path: "/sounds", label: "Sounds" },
]

describe("BBC pages", () => {
  pages.forEach(({ path, label }) => {
    it(`loads ${label}`, () => {
      cy.visit(path)
      cy.get("body").should("be.visible").and("not.be.empty")
      cy.title().should("not.be.empty")
      cy.contains("body", new RegExp(label, "i")).should("exist")
    })
  })
})
