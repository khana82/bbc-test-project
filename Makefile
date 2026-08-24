.PHONY: e2e-chrome e2e-firefox e2e-edge e2e-all lighthouse

e2e-chrome:
	docker compose --profile test run --rm cypress-chrome

e2e-firefox:
	docker compose --profile test run --rm cypress-firefox

e2e-edge:
	docker compose --profile test run --rm cypress-edge

e2e-all: e2e-chrome e2e-firefox e2e-edge

lighthouse:
	docker compose --profile test run --rm lighthouse
