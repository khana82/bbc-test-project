const links = [
  { name: "News", path: "/news" },
  { name: "Sport", path: "/sport" },
  { name: "Weather", path: "/weather" },
  { name: "iPlayer", path: "/iplayer" },
  { name: "Sounds", path: "/sounds" },
]

describe("BBC navigation", () => {
  links.forEach(({ name, path }) => {
    it(`navigates to ${name}`, () => {
      cy.visit("/")
      cy.contains("a", new RegExp(`^${name}$`, "i"))
        .first()
        .click()
      cy.location("pathname").should("match", new RegExp(`^${path}(?:/|$)`))
    })
  })
})
