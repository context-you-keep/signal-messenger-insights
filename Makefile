.PHONY: help build run dev stop clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build the Docker image
	docker compose build

run: ## Run the application in production mode
	docker compose up

start: run ## Alias for run

dev: ## Run in development mode (frontend + backend separately)
	@echo "Starting backend..."
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	@echo "Starting frontend..."
	cd frontend && pnpm dev

stop: ## Stop running containers
	docker compose down

clean: ## Clean up containers, images, and build artifacts
	docker compose down -v
	docker rmi signal-archive-viewer_signal-archive-viewer || true
	rm -rf backend/__pycache__ backend/**/__pycache__
	rm -rf frontend/dist frontend/node_modules

test-backend: ## Run backend tests
	cd backend && pytest

test-frontend: ## Run frontend tests
	cd frontend && pnpm test

lint: ## Run linters
	cd backend && ruff check . && black --check .
	cd frontend && pnpm lint

format: ## Format code
	cd backend && black .
	cd frontend && pnpm format

install-backend: ## Install backend dependencies
	cd backend && pip install -e ".[dev]"

install-frontend: ## Install frontend dependencies
	cd frontend && pnpm install

install: install-backend install-frontend ## Install all dependencies
