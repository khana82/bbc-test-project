const viewports = [
  { name: "desktop", width: 1366, height: 768 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]

const pages = ["/", "/news", "/sport", "/weather", "/iplayer", "/sounds"]

describe("BBC responsive layouts", () => {
  viewports.forEach(({ name, width, height }) => {
    context(`@${name}`, () => {
      beforeEach(() => cy.viewport(width, height))

      pages.forEach((path) => {
        it(`renders ${path} without horizontal overflow`, () => {
          cy.visit(path)
          cy.get("body").should("be.visible")
          cy.window().then((win) => {
            const rootWidth = win.document.documentElement.scrollWidth
            expect(rootWidth).to.be.at.most(win.innerWidth + 2)
          })
        })
      })
    })
  })
})
