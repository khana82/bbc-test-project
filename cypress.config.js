const { defineConfig } = require("cypress");
const { addMatchImageSnapshotPlugin } = require("cypress-image-snapshot/plugin");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://www.bbc.co.uk",
    specPattern: "cypress/e2e/**/*.cy.js",
    supportFile: "cypress/support/e2e.js",
    setupNodeEvents(on, config) {
      addMatchImageSnapshotPlugin(on, config);
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
      });
      return config;
    },
  },
  screenshotsFolder: "cypress/artifacts/screenshots",
  videosFolder: "cypress/artifacts/videos",
  reporter: "cypress-multi-reporters",
  reporterOptions: {
    reporterEnabled: "mocha-junit-reporter",
    mochaJunitReporterReporterOptions: {
      mochaFile: "cypress/artifacts/junit/junit-[hash].xml",
      toConsole: false,
    },
  },
  video: true,
  screenshotOnRunFailure: true,
  viewportWidth: 1366,
  viewportHeight: 768,
});
