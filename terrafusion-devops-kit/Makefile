# TerraFusion DevOps Kit - Master Makefile
# This Makefile provides a unified interface for DevOps operations across the TerraFusion platform

# -- Global Variables --
REPO_NAME ?= ghcr.io/benton-county/terrafusion
IMAGE_TAG ?= latest
ENVIRONMENT ?= dev
VAULT_ADDR ?= https://vault.terrafusion.io
GRAFANA_URL ?= http://grafana.terrafusion.io

# Define deployment profiles
ifeq ($(ENVIRONMENT), prod)
  K8S_NAMESPACE = terrafusion-prod
  REPLICAS = 3
  RESOURCE_TIER = high
  PROMETHEUS_RETENTION = 30d
else ifeq ($(ENVIRONMENT), staging)
  K8S_NAMESPACE = terrafusion-staging
  REPLICAS = 2
  RESOURCE_TIER = medium
  PROMETHEUS_RETENTION = 15d
else
  K8S_NAMESPACE = terrafusion-dev
  REPLICAS = 1
  RESOURCE_TIER = low
  PROMETHEUS_RETENTION = 7d
endif

# Colors for better output
YELLOW := \033[1;33m
GREEN := \033[1;32m
RED := \033[1;31m
BLUE := \033[1;34m
CYAN := \033[1;36m
RESET := \033[0m

# -- Help Target --
.PHONY: help
help:
        @echo "${YELLOW}TerraFusion DevOps Commands${RESET}"
        @echo ""
        @echo "${CYAN}One-Command Operations:${RESET}"
        @echo "  make bootstrap         - Initialize complete environment from scratch"
        @echo "  make pipeline          - Run full CI/CD pipeline (build, test, deploy)"
        @echo "  make swarm-up          - Start the complete AI agent swarm"
        @echo "  make swarm-down        - Stop the AI agent swarm"
        @echo "  make dashboard         - Open monitoring dashboards in browser"
        @echo "  make demo              - Run end-to-end demonstration"
        @echo ""
        @echo "${GREEN}Infrastructure Commands:${RESET}"
        @echo "  make init              - Initialize Terraform"
        @echo "  make plan              - Plan Terraform changes"
        @echo "  make apply             - Apply Terraform changes"
        @echo "  make destroy           - Destroy Terraform resources"
        @echo "  make vault-init        - Initialize HashiCorp Vault"
        @echo "  make vault-unseal      - Unseal Vault instance"
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
        @echo "  make scale-agents      - Scale agent deployments"
        @echo "  make rollback          - Rollback to previous deployment"
        @echo ""
        @echo "${GREEN}Database Commands:${RESET}"
        @echo "  make db-migrate        - Run database migrations"
        @echo "  make db-backup         - Backup database"
        @echo "  make db-restore        - Restore database from backup"
        @echo "  make db-status         - Show database status"
        @echo ""
        @echo "${GREEN}Agent Management:${RESET}"
        @echo "  make agent-wizard      - Launch the Agent Configuration Wizard"
        @echo "  make agent-status      - Check status of all agents"
        @echo "  make update-agents     - Update specific agents"
        @echo "  make retrain-agents    - Retrain agent models"
        @echo "  make agent-logs        - View agent logs"
        @echo ""
        @echo "${GREEN}Monitoring:${RESET}"
        @echo "  make start-monitoring  - Start local monitoring stack"
        @echo "  make stop-monitoring   - Stop local monitoring stack"
        @echo "  make grafana-import    - Import Grafana dashboards"
        @echo "  make prometheus-rules  - Update Prometheus alert rules"
        @echo "  make check-health      - Run system health check"
        @echo ""
        @echo "${GREEN}Security:${RESET}"
        @echo "  make rotate-secrets    - Rotate platform secrets"
        @echo "  make security-scan     - Run security scanner"
        @echo "  make vulnerability-check - Check for vulnerabilities"
        @echo "  make audit-logs        - View security audit logs"
        @echo ""
        @echo "${BLUE}Environment Variables:${RESET}"
        @echo "  ENVIRONMENT           - Target environment (dev, staging, prod) [default: dev]"
        @echo "  REPO_NAME             - Container repository name"
        @echo "  IMAGE_TAG             - Container image tag [default: latest]"
        @echo "  VAULT_ADDR            - Vault server address [default: https://vault.terrafusion.io]"
        @echo "  GRAFANA_URL           - Grafana dashboard URL [default: http://grafana.terrafusion.io]"
        @echo ""
        @echo "Current configuration: ${YELLOW}$(ENVIRONMENT)${RESET} environment with ${YELLOW}$(REPLICAS)${RESET} replicas ($(RESOURCE_TIER) resources)"
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

# -- One-Command Operations --
.PHONY: bootstrap pipeline swarm-up swarm-down dashboard demo
bootstrap:
        @echo "${CYAN}🚀 Bootstrapping complete TerraFusion environment for $(ENVIRONMENT)...${RESET}"
        @echo "${YELLOW}Step 1/6: Initializing infrastructure...${RESET}"
        @$(MAKE) init
        @$(MAKE) plan
        @$(MAKE) apply
        @echo "${YELLOW}Step 2/6: Setting up Vault secrets...${RESET}"
        @$(MAKE) vault-init
        @$(MAKE) rotate-secrets
        @echo "${YELLOW}Step 3/6: Building containers...${RESET}"
        @$(MAKE) build-all
        @$(MAKE) push-all
        @echo "${YELLOW}Step 4/6: Deploying to Kubernetes...${RESET}"
        @$(MAKE) deploy-all
        @echo "${YELLOW}Step 5/6: Setting up monitoring...${RESET}"
        @$(MAKE) start-monitoring
        @$(MAKE) grafana-import
        @echo "${YELLOW}Step 6/6: Configuring agents...${RESET}"
        @scripts/install-agent-wizard.sh
        @echo "${GREEN}✅ TerraFusion environment successfully bootstrapped for $(ENVIRONMENT)!${RESET}"
        @echo "${BLUE}You can now access:${RESET}"
        @echo "  • Frontend: https://$(ENVIRONMENT).terrafusion.io"
        @echo "  • Monitoring: https://grafana.$(ENVIRONMENT).terrafusion.io"
        @echo "  • API: https://api.$(ENVIRONMENT).terrafusion.io"
        @echo ""
        @echo "${YELLOW}Run 'make swarm-up' to start the AI agent swarm${RESET}"

pipeline:
        @echo "${CYAN}🔄 Running full CI/CD pipeline...${RESET}"
        @echo "${YELLOW}Step 1/5: Running tests...${RESET}"
        npm test
        @echo "${YELLOW}Step 2/5: Building containers...${RESET}"
        @$(MAKE) build-all
        @echo "${YELLOW}Step 3/5: Running security scan...${RESET}"
        @$(MAKE) security-scan
        @echo "${YELLOW}Step 4/5: Pushing containers...${RESET}"
        @$(MAKE) push-all
        @echo "${YELLOW}Step 5/5: Deploying to $(ENVIRONMENT)...${RESET}"
        @$(MAKE) deploy-all
        @echo "${GREEN}✅ CI/CD pipeline completed successfully!${RESET}"
        @echo "${YELLOW}Verify the deployment with 'make k8s-status'${RESET}"

swarm-up:
        @echo "${CYAN}🤖 Starting AI agent swarm...${RESET}"
        @echo "${YELLOW}Setting up agent swarm for $(ENVIRONMENT) environment${RESET}"
        @echo "This will launch $(REPLICAS) replicas of each agent"
        @read -p "Continue? (y/n) " confirm && [ $$confirm = "y" ] || (echo "${RED}Aborted${RESET}" && exit 1)
        @echo "${YELLOW}Validating agent manifest...${RESET}"
        @if command -v agentctl > /dev/null; then \
                agentctl validate; \
        else \
                scripts/install-agent-wizard.sh; \
                agentctl validate; \
        fi
        @echo "${YELLOW}Deploying agents to Kubernetes...${RESET}"
        @$(MAKE) deploy-agents
        @echo "${YELLOW}Starting monitoring...${RESET}"
        @$(MAKE) start-monitoring
        @echo "${GREEN}✅ AI agent swarm is now running!${RESET}"
        @echo "${YELLOW}Check agent status with 'make agent-status'${RESET}"

swarm-down:
        @echo "${CYAN}🛑 Stopping AI agent swarm...${RESET}"
        @read -p "Are you sure you want to stop all agents? (y/n) " confirm && [ $$confirm = "y" ] || (echo "${RED}Aborted${RESET}" && exit 1)
        @echo "${YELLOW}Scaling agent deployments to 0...${RESET}"
        kubectl scale deployment --replicas=0 -l app.kubernetes.io/component=agent -n $(K8S_NAMESPACE)
        @echo "${GREEN}✅ AI agent swarm stopped successfully${RESET}"

dashboard:
        @echo "${CYAN}📊 Opening monitoring dashboards...${RESET}"
        @echo "${YELLOW}Ensuring monitoring stack is running...${RESET}"
        @$(MAKE) start-monitoring
        @echo "${YELLOW}Opening Grafana dashboard in browser...${RESET}"
        @if command -v xdg-open > /dev/null; then \
                xdg-open $(GRAFANA_URL); \
        elif command -v open > /dev/null; then \
                open $(GRAFANA_URL); \
        else \
                echo "${YELLOW}Could not automatically open browser. Please visit:${RESET}"; \
                echo "$(GRAFANA_URL)"; \
        fi
        @echo "${GREEN}✅ Monitoring dashboard should now be open in your browser${RESET}"

demo:
        @echo "${CYAN}🎬 Running TerraFusion demonstration...${RESET}"
        @echo "${YELLOW}Preparing demonstration environment...${RESET}"
        @$(MAKE) build-all
        @$(MAKE) start-monitoring
        @echo "${YELLOW}Starting AI agent swarm...${RESET}"
        @$(MAKE) swarm-up
        @echo "${YELLOW}Running agent demonstration...${RESET}"
        @scripts/test-agent-wizard.sh
        @echo "${GREEN}✅ Demonstration completed successfully!${RESET}"

# -- Vault Operations --
.PHONY: vault-init vault-unseal
vault-init:
        @echo "${GREEN}Initializing HashiCorp Vault...${RESET}"
        @if command -v vault > /dev/null; then \
                VAULT_ADDR=$(VAULT_ADDR) vault operator init; \
        else \
                echo "${RED}Error: vault CLI not found${RESET}"; \
                echo "Please install HashiCorp Vault CLI:"; \
                echo "  https://developer.hashicorp.com/vault/tutorials/getting-started/getting-started-install"; \
                exit 1; \
        fi

vault-unseal:
        @echo "${GREEN}Unsealing Vault...${RESET}"
        @if command -v vault > /dev/null; then \
                VAULT_ADDR=$(VAULT_ADDR) vault operator unseal; \
        else \
                echo "${RED}Error: vault CLI not found${RESET}"; \
                echo "Please install HashiCorp Vault CLI"; \
                exit 1; \
        fi

# -- Kubernetes Scale and Rollback --
.PHONY: scale-agents rollback
scale-agents:
        @echo "${GREEN}Scaling agent deployments...${RESET}"
        @read -p "Enter number of replicas: " replicas && \
                kubectl scale deployment --replicas=$$replicas -l app.kubernetes.io/component=agent -n $(K8S_NAMESPACE)

rollback:
        @echo "${GREEN}Rolling back to previous deployment...${RESET}"
        @read -p "Enter deployment name to rollback: " deployment && \
                kubectl rollout undo deployment/$$deployment -n $(K8S_NAMESPACE)

# -- Security Operations --
.PHONY: security-scan vulnerability-check audit-logs
security-scan:
        @echo "${GREEN}Running security scanner...${RESET}"
        @echo "Scanning Docker images..."
        @if command -v trivy > /dev/null; then \
                trivy image $(REPO_NAME)-backend:$(IMAGE_TAG); \
                trivy image $(REPO_NAME)-agent-base:$(IMAGE_TAG); \
        else \
                echo "${YELLOW}Trivy not found. Using Docker Scout...${RESET}"; \
                docker scout cves $(REPO_NAME)-backend:$(IMAGE_TAG); \
        fi

vulnerability-check:
        @echo "${GREEN}Checking for vulnerabilities...${RESET}"
        @npm audit
        @echo "Checking Kubernetes manifests..."
        @if command -v kubesec > /dev/null; then \
                find k8s-manifests -name "*.yaml" -exec kubesec scan {} \;; \
        else \
                echo "${YELLOW}kubesec not found. Skipping Kubernetes manifest scanning.${RESET}"; \
        fi

audit-logs:
        @echo "${GREEN}Viewing security audit logs...${RESET}"
        @kubectl logs -l app.kubernetes.io/component=audit -n $(K8S_NAMESPACE)

# -- Database Operations --
.PHONY: db-status db-migrate db-backup db-restore
db-status:
        @echo "${GREEN}Database status:${RESET}"
        @npm run db:status

db-migrate:
        @echo "${GREEN}Running database migrations...${RESET}"
        @npm run db:push

db-backup:
        @echo "${GREEN}Backing up database...${RESET}"
        @scripts/db-backup.sh -e $(ENVIRONMENT)

db-restore:
        @echo "${GREEN}Restoring database from backup...${RESET}"
        @read -p "Enter backup file path: " backup_file && \
                scripts/db-restore.sh -e $(ENVIRONMENT) -f $$backup_file

# -- Agent Management --
.PHONY: agent-status agent-logs update-agents retrain-agents agent-wizard
agent-status:
        @echo "${GREEN}Checking agent status...${RESET}"
        @if command -v agentctl > /dev/null; then \
                agentctl --environment $(ENVIRONMENT) status; \
        else \
                scripts/agent-status.sh -e $(ENVIRONMENT); \
        fi

agent-logs:
        @echo "${GREEN}Viewing agent logs...${RESET}"
        @read -p "Enter agent name (leave empty for all): " agent && \
                if [ -z "$$agent" ]; then \
                        kubectl logs -l app.kubernetes.io/component=agent -n $(K8S_NAMESPACE) --tail=100; \
                else \
                        kubectl logs -l app.kubernetes.io/name=$$agent -n $(K8S_NAMESPACE) --tail=100; \
                fi

update-agents:
        @echo "${GREEN}Updating specific agents...${RESET}"
        @read -p "Enter agent names (comma-separated, or 'all'): " agents && \
                scripts/update-agents.sh -e $(ENVIRONMENT) -a $$agents

retrain-agents:
        @echo "${GREEN}Retraining agent models...${RESET}"
        @read -p "Enter agent names (comma-separated, or 'all'): " agents && \
                scripts/update-agents.sh -e $(ENVIRONMENT) -a $$agents -t

agent-wizard:
        @echo "${GREEN}Starting Agent Configuration Wizard...${RESET}"
        @if command -v agentctl > /dev/null; then \
                agentctl --environment $(ENVIRONMENT) wizard; \
        else \
                echo "${YELLOW}Agent Configuration Wizard not installed.${RESET}"; \
                echo "Would you like to install it now? (y/n)"; \
                read -r INSTALL_WIZARD; \
                if [ "$$INSTALL_WIZARD" = "y" ]; then \
                        scripts/install-agent-wizard.sh; \
                        agentctl --environment $(ENVIRONMENT) wizard; \
                else \
                        echo "Installation cancelled."; \
                fi \
        fi

# -- Monitoring Operations --
.PHONY: start-monitoring stop-monitoring grafana-import prometheus-rules check-health
start-monitoring:
        @echo "${GREEN}Starting local monitoring stack...${RESET}"
        @cd monitoring && docker-compose up -d
        @echo "${YELLOW}Monitoring stack is available at:${RESET}"
        @echo "  • Grafana: http://localhost:3000"
        @echo "  • Prometheus: http://localhost:9090"

stop-monitoring:
        @echo "${GREEN}Stopping local monitoring stack...${RESET}"
        @cd monitoring && docker-compose down

grafana-import:
        @echo "${GREEN}Importing Grafana dashboards...${RESET}"
        @cd monitoring/grafana && ./import-dashboards.sh

prometheus-rules:
        @echo "${GREEN}Updating Prometheus alert rules...${RESET}"
        @cd monitoring/prometheus && ./update-rules.sh

check-health:
        @echo "${GREEN}Running system health check...${RESET}"
        @scripts/health-check.sh -e $(ENVIRONMENT)