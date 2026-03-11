SHELL := /bin/bash

.PHONY: up down logs backend_frontend backend_migrate backend_test frontend_test

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

backend_frontend:
	docker compose up --build backend frontend

backend_migrate:
	docker compose run --rm backend mix ecto.create ecto.migrate

backend_test:
	docker compose run --rm backend mix test

frontend_test:
	docker compose run --rm frontend npm test
