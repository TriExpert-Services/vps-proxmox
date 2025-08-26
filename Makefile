# CloudVPS Pro Docker Makefile

# Default environment
ENV ?= production

# Docker compose files
COMPOSE_FILE = docker-compose.yml
COMPOSE_FILE_DEV = docker-compose.dev.yml

.PHONY: help build up down logs clean dev prod backup restore test

help: ## Show this help message
	@echo "CloudVPS Pro - Docker Commands"
	@echo "==============================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$\' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo "Building Docker images..."
	docker-compose -f $(COMPOSE_FILE) build --no-cache

build-dev: ## Build Docker images for development
	@echo "Building development Docker images..."
	docker-compose -f $(COMPOSE_FILE_DEV) build --no-cache

up: ## Start services in production mode
	@echo "Starting CloudVPS Pro in production mode..."
	docker-compose -f $(COMPOSE_FILE) up -d

up-dev: ## Start services in development mode
	@echo "Starting CloudVPS Pro in development mode..."
	docker-compose -f $(COMPOSE_FILE_DEV) up -d

down: ## Stop and remove containers
	@echo "Stopping CloudVPS Pro..."
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(COMPOSE_FILE_DEV) down

restart: down up ## Restart all services

logs: ## Show logs from all services
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-app: ## Show logs from app service only
	docker-compose -f $(COMPOSE_FILE) logs -f app

logs-db: ## Show logs from database service only
	docker-compose -f $(COMPOSE_FILE) logs -f postgres

status: ## Show status of all services
	docker-compose -f $(COMPOSE_FILE) ps

shell: ## Access app container shell
	docker-compose -f $(COMPOSE_FILE) exec app sh

shell-db: ## Access database container shell
	docker-compose -f $(COMPOSE_FILE) exec postgres psql -U cloudvps -d cloudvps

backup: ## Create database backup
	@echo "Creating database backup..."
	docker-compose -f $(COMPOSE_FILE) exec postgres pg_dump -U cloudvps cloudvps | gzip > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql.gz
	@echo "Backup created in backups/ directory"

restore: ## Restore database from backup (use BACKUP_FILE=filename)
	@if [ -z "$(BACKUP_FILE)" ]; then echo "Please specify BACKUP_FILE=filename"; exit 1; fi
	@echo "Restoring database from $(BACKUP_FILE)..."
	gunzip -c $(BACKUP_FILE) | docker-compose -f $(COMPOSE_FILE) exec -T postgres psql -U cloudvps -d cloudvps

clean: ## Clean up Docker images and volumes
	@echo "Cleaning up Docker resources..."
	docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	docker system prune -f

clean-all: ## Clean up everything including volumes
	@echo "Warning: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f $(COMPOSE_FILE) down -v --rmi all --remove-orphans; \
		docker system prune -af --volumes; \
	fi

test: ## Run tests in Docker
	docker-compose -f $(COMPOSE_FILE_DEV) run --rm app npm test

install: ## Install and setup the application
	@echo "Setting up CloudVPS Pro..."
	@if [ ! -f .env ]; then cp .env.docker .env; echo "Created .env file - please edit it with your configuration"; fi
	make build
	make up
	@echo "Setup complete! Access the application at http://localhost"

dev: ## Start development environment
	@echo "Starting development environment..."
	@if [ ! -f .env ]; then cp .env.docker .env; fi
	make build-dev
	make up-dev
	@echo "Development server started at http://localhost:8080"

prod: ## Start production environment
	@echo "Starting production environment..."
	@if [ ! -f .env ]; then echo "Please create .env file from .env.docker template"; exit 1; fi
	make build
	make up
	@echo "Production server started at http://localhost"

migrate: ## Run database migrations
	docker-compose -f $(COMPOSE_FILE) exec app npm run db:migrate

seed: ## Seed database with initial data
	docker-compose -f $(COMPOSE_FILE) exec app npm run db:seed

update: ## Update application (pull, build, restart)
	@echo "Updating CloudVPS Pro..."
	git pull origin main
	make build
	make restart
	@echo "Update completed!"

ssl: ## Generate SSL certificates (requires certbot)
	@echo "Generating SSL certificates..."
	@read -p "Enter your domain name: \" domain; \
	sudo certbot certonly --standalone -d $$domain; \
	sudo cp /etc/letsencrypt/live/$$domain/fullchain.pem docker/nginx/ssl/; \
	sudo cp /etc/letsencrypt/live/$$domain/privkey.pem docker/nginx/ssl/; \
	sudo chown $(shell id -u):$(shell id -g) docker/nginx/ssl/*

monitoring: ## Show resource usage
	@echo "CloudVPS Pro Resource Usage:"
	@echo "============================"
	docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

health: ## Check health of all services
	@echo "Health Check Results:"
	@echo "===================="
	@docker-compose -f $(COMPOSE_FILE) ps --format "table {{.Service}}\t{{.State}}\t{{.Status}}"