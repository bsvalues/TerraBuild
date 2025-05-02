# TerraFusion DevOps Kit - Master Makefile
# This Makefile provides a unified interface for DevOps operations

# -- Global Variables --
REPO_NAME ?= ghcr.io/benton-county/terrafusion
IMAGE_TAG ?= latest
ENVIRONMENT ?= dev

# Colors for better output
YELLOW := \033[1;33m
GREEN := \033[1;32m
RED := \033[1;31m
RESET := \033[0m

# -- Help Target --
.PHONY: help
help:
	@echo "${YELLOW}TerraFusion DevOps Commands${RESET}"
	@echo ""
	@echo "${GREEN}Infrastructure Commands:${RESET}"
	@echo "  make init              - Initialize Terraform"
	@echo "  make plan              - Plan Terraform changes"
	@echo "  make apply             - Apply Terraform changes"
	@echo "  make destroy           - Destroy Terraform resources"
	@echo ""
	@echo "${GREEN}Container Commands:${RESET}"
	@echo "  make build-backend     - Build backend container"
	@echo "  make build-frontend    - Build frontend container"
	@echo "  make build-agents      - Build all agent containers"
	@echo "  make push-backend      - Push backend container"
	@echo "  make push-frontend     - Push frontend container"
	@echo "  make push-agents       - Push all agent containers"
	@echo "  make build-all         - Build all containers"
	@echo "  make push-all          - Push all containers"
	@echo ""
	@echo "${GREEN}Kubernetes Commands:${RESET}"
	@echo "  make deploy-backend    - Deploy backend to Kubernetes"
	@echo "  make deploy-frontend   - Deploy frontend to Kubernetes"
	@echo "  make deploy-agents     - Deploy agents to Kubernetes"
	@echo "  make deploy-all        - Deploy all components to Kubernetes"
	@echo "  make k8s-status        - Show Kubernetes resource status"
	@echo ""
	@echo "${GREEN}Database Commands:${RESET}"
	@echo "  make db-migrate        - Run database migrations"
	@echo "  make db-backup         - Backup database"
	@echo "  make db-restore        - Restore database from backup"
	@echo ""
	@echo "${GREEN}Operations Commands:${RESET}"
	@echo "  make rotate-secrets    - Rotate platform secrets"
	@echo "  make update-agents     - Update specific agents"
	@echo "  make retrain-agents    - Retrain agent models"
	@echo "  make start-monitoring  - Start local monitoring stack"
	@echo ""
	@echo "${GREEN}Environment Variables:${RESET}"
	@echo "  ENVIRONMENT           - Target environment (dev, staging, prod) [default: dev]"
	@echo "  REPO_NAME             - Container repository name"
	@echo "  IMAGE_TAG             - Container image tag [default: latest]"
	@echo ""

# -- Terraform Targets --
.PHONY: init plan apply destroy
init:
	@echo "${GREEN}Initializing Terraform...${RESET}"
	cd terraform && terraform init -backend-config=environments/$(ENVIRONMENT).tfbackend

plan:
	@echo "${GREEN}Planning Terraform changes...${RESET}"
	cd terraform && terraform plan -var-file=environments/$(ENVIRONMENT).tfvars -out=tfplan

apply:
	@echo "${GREEN}Applying Terraform changes...${RESET}"
	cd terraform && terraform apply tfplan

destroy:
	@echo "${RED}CAUTION: Destroying Terraform resources...${RESET}"
	@read -p "Are you sure you want to destroy all resources in $(ENVIRONMENT)? [y/N] " confirm && \
		[ $$confirm = "y" ] || (echo "${GREEN}Destruction aborted.${RESET}" && exit 1)
	cd terraform && terraform destroy -var-file=environments/$(ENVIRONMENT).tfvars

# -- Container Build Targets --
.PHONY: build-backend build-frontend build-agents build-all push-backend push-frontend push-agents push-all
build-backend:
	@echo "${GREEN}Building backend container...${RESET}"
	docker build -f docker/backend.Dockerfile -t $(REPO_NAME)-backend:$(IMAGE_TAG) .

build-frontend:
	@echo "${GREEN}Building frontend container...${RESET}"
	docker build -f docker/frontend.Dockerfile -t $(REPO_NAME)-frontend:$(IMAGE_TAG) .

build-agents:
	@echo "${GREEN}Building agent containers...${RESET}"
	docker build -f docker/agent-base.Dockerfile -t $(REPO_NAME)-agent-base:$(IMAGE_TAG) .
	docker build -f docker/agents/factor-tuner.Dockerfile -t $(REPO_NAME)-factor-tuner:$(IMAGE_TAG) .
	docker build -f docker/agents/benchmark-guard.Dockerfile -t $(REPO_NAME)-benchmark-guard:$(IMAGE_TAG) .
	docker build -f docker/agents/curve-trainer.Dockerfile -t $(REPO_NAME)-curve-trainer:$(IMAGE_TAG) .
	docker build -f docker/agents/scenario-agent.Dockerfile -t $(REPO_NAME)-scenario-agent:$(IMAGE_TAG) .
	docker build -f docker/agents/boe-arguer.Dockerfile -t $(REPO_NAME)-boe-arguer:$(IMAGE_TAG) .

build-all: build-backend build-frontend build-agents
	@echo "${GREEN}All containers built successfully${RESET}"

push-backend:
	@echo "${GREEN}Pushing backend container...${RESET}"
	docker push $(REPO_NAME)-backend:$(IMAGE_TAG)

push-frontend:
	@echo "${GREEN}Pushing frontend container...${RESET}"
	docker push $(REPO_NAME)-frontend:$(IMAGE_TAG)

push-agents:
	@echo "${GREEN}Pushing agent containers...${RESET}"
	docker push $(REPO_NAME)-agent-base:$(IMAGE_TAG)
	docker push $(REPO_NAME)-factor-tuner:$(IMAGE_TAG)
	docker push $(REPO_NAME)-benchmark-guard:$(IMAGE_TAG)
	docker push $(REPO_NAME)-curve-trainer:$(IMAGE_TAG)
	docker push $(REPO_NAME)-scenario-agent:$(IMAGE_TAG)
	docker push $(REPO_NAME)-boe-arguer:$(IMAGE_TAG)

push-all: push-backend push-frontend push-agents
	@echo "${GREEN}All containers pushed successfully${RESET}"

# -- Kubernetes Deployment Targets --
.PHONY: deploy-backend deploy-frontend deploy-agents deploy-all k8s-status
deploy-backend:
	@echo "${GREEN}Deploying backend to Kubernetes...${RESET}"
	scripts/deploy-all.sh -e $(ENVIRONMENT) -c backend -y

deploy-frontend:
	@echo "${GREEN}Deploying frontend to Kubernetes...${RESET}"
	scripts/deploy-all.sh -e $(ENVIRONMENT) -c frontend -y

deploy-agents:
	@echo "${GREEN}Deploying agents to Kubernetes...${RESET}"
	scripts/deploy-all.sh -e $(ENVIRONMENT) -c agents -y

deploy-all:
	@echo "${GREEN}Deploying all components to Kubernetes...${RESET}"
	scripts/deploy-all.sh -e $(ENVIRONMENT) -y

k8s-status:
	@echo "${GREEN}Kubernetes status:${RESET}"
	kubectl config use-context terrafusion-$(ENVIRONMENT)
	kubectl get pods -A | grep terrafusion
	kubectl get svc -A | grep terrafusion

# -- Database Targets --
.PHONY: db-migrate db-backup db-restore
db-migrate:
	@echo "${GREEN}Running database migrations...${RESET}"
	npm run db:push

db-backup:
	@echo "${GREEN}Backing up database...${RESET}"
	scripts/db-backup.sh -e $(ENVIRONMENT)

db-restore:
	@echo "${GREEN}Restoring database from backup...${RESET}"
	@read -p "Enter backup file path: " backup_file && \
		scripts/db-restore.sh -e $(ENVIRONMENT) -f $$backup_file

# -- Operations Targets --
.PHONY: rotate-secrets update-agents retrain-agents start-monitoring
rotate-secrets:
	@echo "${GREEN}Rotating secrets...${RESET}"
	scripts/rotate-secrets.sh -e $(ENVIRONMENT)

update-agents:
	@echo "${GREEN}Updating specific agents...${RESET}"
	@read -p "Enter agent names (comma-separated, or 'all'): " agents && \
		scripts/update-agents.sh -e $(ENVIRONMENT) -a $$agents

retrain-agents:
	@echo "${GREEN}Retraining agent models...${RESET}"
	@read -p "Enter agent names (comma-separated, or 'all'): " agents && \
		scripts/update-agents.sh -e $(ENVIRONMENT) -a $$agents -t

start-monitoring:
	@echo "${GREEN}Starting local monitoring stack...${RESET}"
	cd monitoring && docker-compose up -d