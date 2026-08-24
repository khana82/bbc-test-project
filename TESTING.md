# BBC Cypress E2E + Visual Regression

This project uses Cypress to test the public BBC website at `https://www.bbc.co.uk`. The configured base URL is used for all relative paths in the E2E suite.

## Coverage

The suites cover the BBC homepage and these service pages:

- `/news`
- `/sport`
- `/weather`
- `/iplayer`
- `/sounds`

Coverage includes navigation, page loading, HTTP status, metadata, accessibility smoke checks, responsive layouts, related links, cookies, and visual regression.

## Run Cypress

Install dependencies, then run the suite:

```sh
npm ci
npm run cy:run
```

Open the Cypress application with:

```sh
npm run cy:open
```

`cypress.config.js` defaults to `https://www.bbc.co.uk`. To test a different compatible environment, override it explicitly:

```sh
CYPRESS_baseUrl=https://www.bbc.co.uk npm run cy:run
```

## Visual regression baselines

Baseline images live in `cypress/snapshots`. Update them only when an intentional BBC page change is being accepted:

```sh
CYPRESS_updateSnapshots=true npm run cy:run
```

BBC pages can change frequently. Review visual diffs carefully before committing any new baseline images.

## Artifacts

- JUnit reports: `cypress/artifacts/junit/`
- Screenshots: `cypress/artifacts/screenshots/`
- Videos: `cypress/artifacts/videos/`
- Snapshot diffs: `cypress/artifacts/snapshots-diff/`

## Responsive coverage

`cypress/e2e/viewports.cy.js` checks desktop (1366×768), tablet (820×1180), and mobile (390×844) viewports for the BBC homepage and service pages. Each check verifies that the page has no horizontal overflow.

## Lighthouse CI

Run Lighthouse with:

```sh
make lighthouse
```

The BBC URLs are configured in `lighthouserc.json`. Reports are written to `lighthouse/reports`.

## When to update tests

- Add a BBC route to the shared page lists when adding coverage for it.
- Update navigation assertions when the BBC global navigation changes.
- Refresh visual snapshots only after reviewing intentional changes.
- Keep selectors and expectations resilient to editorial content changes.
