const { addMatchImageSnapshotCommand } = require('cypress-image-snapshot/command')
require('cypress-axe')

addMatchImageSnapshotCommand({
  failureThreshold: 0.01,
  failureThresholdType: 'percent',
  customSnapshotsDir: 'cypress/snapshots',
  customDiffDir: 'cypress/artifacts/snapshots-diff',
})

Cypress.Commands.add('waitForFonts', () => {
  cy.document().then((doc) => {
    if (doc.fonts && doc.fonts.ready) {
      return doc.fonts.ready
    }
    return null
  })
})
