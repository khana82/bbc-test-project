const topLevelServices = [
  { name: "News", path: "/news" },
  { name: "Sport", path: "/sport" },
  { name: "Weather", path: "/weather" },
  { name: "iPlayer", path: "/iplayer" },
  { name: "Sounds", path: "/sounds" },
]

const pathnameFor = (href) => new URL(href, Cypress.config("baseUrl")).pathname

describe("BBC homepage", () => {
  beforeEach(() => cy.visit("/"))

  it("renders BBC branding, navigation, and page content", () => {
    cy.get("body").should("be.visible").and("not.be.empty")
    cy.get("a").filter("[href]").should("have.length.greaterThan", 0)
    cy.contains("a", /BBC/i).first().should("be.visible")
  })

  topLevelServices.forEach(({ name, path }) => {
    it(`links to BBC ${name}`, () => {
      cy.contains("a", new RegExp(`^${name}$`, "i"))
        .first()
        .should("have.attr", "href")
        .then((href) => {
          expect(pathnameFor(href)).to.match(new RegExp(`^${path}(?:/|$)`))
        })
    })
  })

  it("matches the desktop visual baseline", () => {
    if (Cypress.browser.name === "chrome") {
      cy.waitForFonts()
      cy.matchImageSnapshot("bbc-home-desktop")
    }
  })
})
