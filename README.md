# BBC Cypress Tests

Automated Cypress and Lighthouse checks for public BBC pages at [bbc.co.uk](https://www.bbc.co.uk/).

## Pages covered

- Homepage: `/`
- News: `/news`
- Sport: `/sport`
- Weather: `/weather`
- iPlayer: `/iplayer`
- Sounds: `/sounds`

## Setup

```sh
npm ci
```

## Run tests

```sh
npm run cy:run
```

Open Cypress interactively:

```sh
npm run cy:open
```

The default base URL is `https://www.bbc.co.uk`, configured in `cypress.config.js`. Override it only when testing a compatible environment:

```sh
CYPRESS_baseUrl=https://www.bbc.co.uk npm run cy:run
```

## Lighthouse

```sh
npm run lighthouse
```

Lighthouse URLs are defined in `lighthouserc.json`; reports are written to `lighthouse/reports`.

## Test artifacts

- JUnit reports: `cypress/artifacts/junit/`
- Screenshots: `cypress/artifacts/screenshots/`
- Videos: `cypress/artifacts/videos/`
- Visual snapshot diffs: `cypress/artifacts/snapshots-diff/`

See [TESTING.md](TESTING.md) for coverage details, responsive testing, and visual-baseline guidance.
