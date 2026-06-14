COMPOSE = docker compose

.PHONY: up down logs shell-be shell-db migrate seed \
        test-be test-fe lint format clean rebuild

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

shell-be:
	$(COMPOSE) exec backend python manage.py shell

shell-db:
	$(COMPOSE) exec postgres psql -U ptrack

migrate:
	$(COMPOSE) exec backend python manage.py migrate

seed:
	$(COMPOSE) exec backend python manage.py seed_demo

test-be:
	$(COMPOSE) exec backend pytest

test-fe:
	$(COMPOSE) exec frontend npm test

lint:
	$(COMPOSE) exec backend ruff check .
	$(COMPOSE) exec backend black --check .
	$(COMPOSE) exec frontend npm run lint

format:
	$(COMPOSE) exec backend ruff check --fix .
	$(COMPOSE) exec backend black .
	$(COMPOSE) exec frontend npm run format

clean:
	$(COMPOSE) down -v
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name venv -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

rebuild:
	$(COMPOSE) build --no-cache