describe("BBC cookie behaviour", () => {
  it("uses secure cookies on the BBC homepage", () => {
    cy.visit("/")
    cy.getCookies().then((cookies) => {
      cookies.forEach((cookie) => {
        expect(cookie.domain).to.include("bbc.co.uk")
        expect(cookie.secure).to.eq(true)
      })
    })
  })

  it("retains its public page when revisited", () => {
    cy.visit("/news")
    cy.location("pathname").should("match", /^\/news\/?$/)
    cy.reload()
    cy.location("pathname").should("match", /^\/news\/?$/)
  })
})
