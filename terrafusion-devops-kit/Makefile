# ____________________  ___________________     ______ _    _______  _____       _   _   
#|_   _|  ___| ___ \  |  _  \ ___ \  _  \    |  _  \ |  | ___ \ \/ / _ \     | \ | |  
#  | | | |__ | |_/ /  | | | | |_/ / | | |    | | | | |  | |_/ />  < (_) |    |  \| |  
#  | | |  __||    /   | | | |    /| | | |    | | | | |  |    //>  <\__, |    | . ` |  
#  | | | |___| |\ \   | |/ /| |\ \\ \_/ /    | |/ /| |__| |\ \ |\ \ / / |    | |\  |  
#  \_/ \____/\_| \_|  |___/ \_| \_|\___/     |___/ \____\_| \_\\_\_//_/\_|    \_| \_/  
#                                                                                    
# Makefile for TerraFusion DevOps Kit

# Colors
COLOR_RESET = \033[0m
COLOR_BLUE = \033[0;34m
COLOR_GREEN = \033[0;32m
COLOR_YELLOW = \033[0;33m
COLOR_RED = \033[0;31m
COLOR_CYAN = \033[0;36m
COLOR_MAGENTA = \033[0;35m

# Display ASCII art logo
define LOGO
$(COLOR_CYAN)
___________________________________________________________
|                                                         |
|  ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   |
|  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   |
|     ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   |
|     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   |
|     ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ██║   |
|     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝   |
|                                                         |
|            DevOps Kit - $(shell date +"%Y")                       |
|_________________________________________________________|
$(COLOR_RESET)
endef
export LOGO

# Default environment
ENV ?= dev

# Directories
TERRAFORM_DIR = terraform
K8S_DIR = k8s-manifests
DOCKER_DIR = docker
MONITORING_DIR = monitoring
SCRIPTS_DIR = scripts
TOOLS_DIR = tools
SWARM_DIR = swarm

# Default namespace for Kubernetes
NAMESPACE ?= terrafusion

# Docker registry and repository
DOCKER_REGISTRY ?= terrafusion.registry.io
DOCKER_REPO ?= terrafusion

# Docker compose files
DOCKER_COMPOSE_FILE = docker-compose.yml
DOCKER_COMPOSE_MONITORING_FILE = docker-compose.monitoring.yml

# GitHub Actions workflow directory
GITHUB_ACTIONS_DIR = github-actions

# Monitoring stack settings
GRAFANA_PORT ?= 3000
PROMETHEUS_PORT ?= 9090
LOKI_PORT ?= 3100

# Default number of agents to deploy
AGENT_REPLICAS ?= 1

# Makefile settings
.PHONY: help bootstrap init terraform docker k8s monitoring swarm-up swarm-down dashboard logs validate status deploy execute train info clean console version agent agent-list agent-status agent-logs agent-deploy agent-execute agent-train agent-benchmark agent-validate

.DEFAULT_GOAL := help

# Show help
help:
	@echo "$$LOGO"
	@echo "$(COLOR_CYAN)TerraFusion DevOps Kit$(COLOR_RESET)"
	@echo "$(COLOR_CYAN)======================$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_CYAN)INFRASTRUCTURE COMMANDS:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)make bootstrap$(COLOR_RESET)              Bootstrap the entire environment"
	@echo "  $(COLOR_GREEN)make init$(COLOR_RESET)                   Initialize the infrastructure"
	@echo "  $(COLOR_GREEN)make terraform$(COLOR_RESET)              Apply Terraform configuration"
	@echo "  $(COLOR_GREEN)make pipeline$(COLOR_RESET)               Set up CI/CD pipeline"
	@echo ""
	@echo "$(COLOR_CYAN)CONTAINER COMMANDS:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)make docker$(COLOR_RESET)                 Build and push Docker images"
	@echo "  $(COLOR_GREEN)make docker-build$(COLOR_RESET)           Build Docker images"
	@echo "  $(COLOR_GREEN)make docker-push$(COLOR_RESET)            Push Docker images"
	@echo ""
	@echo "$(COLOR_CYAN)KUBERNETES COMMANDS:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)make k8s$(COLOR_RESET)                    Apply Kubernetes manifests"
	@echo "  $(COLOR_GREEN)make k8s-clean$(COLOR_RESET)              Remove Kubernetes resources"
	@echo ""
	@echo "$(COLOR_CYAN)MONITORING COMMANDS:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)make monitoring$(COLOR_RESET)             Deploy monitoring stack"
	@echo "  $(COLOR_GREEN)make monitoring-down$(COLOR_RESET)        Stop monitoring stack"
	@echo "  $(COLOR_GREEN)make dashboard$(COLOR_RESET)              Open Grafana dashboard"
	@echo "  $(COLOR_GREEN)make logs$(COLOR_RESET)                   View logs with Loki"
	@echo ""
	@echo "$(COLOR_CYAN)AGENT COMMANDS:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)make swarm-up$(COLOR_RESET)               Deploy agent swarm"
	@echo "  $(COLOR_GREEN)make swarm-down$(COLOR_RESET)             Stop agent swarm"
	@echo "  $(COLOR_GREEN)make validate$(COLOR_RESET)               Validate agent manifests"
	@echo "  $(COLOR_GREEN)make status$(COLOR_RESET)                 Check agent status"
	@echo "  $(COLOR_GREEN)make deploy$(COLOR_RESET)                 Deploy agents"
	@echo "  $(COLOR_GREEN)make execute$(COLOR_RESET)                Execute agent action"
	@echo "  $(COLOR_GREEN)make train$(COLOR_RESET)                  Train agent models"
	@echo ""
	@echo "$(COLOR_CYAN)AGENTCTL COMMANDS:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)make agent$(COLOR_RESET)                  Install and use agentctl CLI"
	@echo "  $(COLOR_GREEN)make agent-list$(COLOR_RESET)             List all agents"
	@echo "  $(COLOR_GREEN)make agent-status$(COLOR_RESET)           Check agent status"
	@echo "  $(COLOR_GREEN)make agent-logs$(COLOR_RESET)             View agent logs"
	@echo "  $(COLOR_GREEN)make agent-deploy$(COLOR_RESET)           Deploy an agent"
	@echo "  $(COLOR_GREEN)make agent-execute$(COLOR_RESET)          Execute an agent action"
	@echo "  $(COLOR_GREEN)make agent-train$(COLOR_RESET)            Train agent models"
	@echo "  $(COLOR_GREEN)make agent-benchmark$(COLOR_RESET)        Run agent benchmarks"
	@echo "  $(COLOR_GREEN)make agent-validate$(COLOR_RESET)         Validate agent manifest"
	@echo ""
	@echo "$(COLOR_CYAN)UTILITY COMMANDS:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)make info$(COLOR_RESET)                   Show environment information"
	@echo "  $(COLOR_GREEN)make clean$(COLOR_RESET)                  Clean up resources"
	@echo "  $(COLOR_GREEN)make console$(COLOR_RESET)                Open interactive console"
	@echo "  $(COLOR_GREEN)make version$(COLOR_RESET)                Show version information"
	@echo ""
	@echo "$(COLOR_CYAN)USAGE EXAMPLES:$(COLOR_RESET)"
	@echo "  $(COLOR_YELLOW)make bootstrap$(COLOR_RESET)             # Bootstrap the entire environment"
	@echo "  $(COLOR_YELLOW)make swarm-up$(COLOR_RESET)              # Deploy the agent swarm"
	@echo "  $(COLOR_YELLOW)make agent-status$(COLOR_RESET)          # Check agent status using agentctl"
	@echo "  $(COLOR_YELLOW)make ENV=prod terraform$(COLOR_RESET)    # Apply Terraform for production"
	@echo ""

# Bootstrap the entire environment
bootstrap:
	@echo "$(COLOR_CYAN)Bootstrapping TerraFusion environment...$(COLOR_RESET)"
	@$(MAKE) init
	@$(MAKE) terraform
	@$(MAKE) docker
	@$(MAKE) k8s
	@$(MAKE) monitoring
	@$(MAKE) swarm-up
	@echo "$(COLOR_GREEN)Environment bootstrap complete!$(COLOR_RESET)"

# Initialize the infrastructure
init:
	@echo "$(COLOR_CYAN)Initializing infrastructure...$(COLOR_RESET)"
	@cd $(TERRAFORM_DIR) && terraform init -reconfigure
	@echo "$(COLOR_GREEN)Infrastructure initialization complete!$(COLOR_RESET)"

# Apply Terraform configuration
terraform:
	@echo "$(COLOR_CYAN)Applying Terraform configuration for environment: $(ENV)...$(COLOR_RESET)"
	@cd $(TERRAFORM_DIR) && terraform workspace select $(ENV) || terraform workspace new $(ENV)
	@cd $(TERRAFORM_DIR) && terraform apply -var-file="$(ENV).tfvars" -auto-approve
	@echo "$(COLOR_GREEN)Terraform apply complete!$(COLOR_RESET)"

# Set up CI/CD pipeline
pipeline:
	@echo "$(COLOR_CYAN)Setting up CI/CD pipeline...$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Configuring GitHub Actions workflows...$(COLOR_RESET)"
	@mkdir -p $(GITHUB_ACTIONS_DIR)
	@cp -r $(GITHUB_ACTIONS_DIR)/* $(GITHUB_ACTIONS_DIR)/
	@echo "$(COLOR_GREEN)CI/CD pipeline setup complete!$(COLOR_RESET)"

# Build and push Docker images
docker: docker-build docker-push

# Build Docker images
docker-build:
	@echo "$(COLOR_CYAN)Building Docker images...$(COLOR_RESET)"
	@cd $(DOCKER_DIR) && docker build -t $(DOCKER_REGISTRY)/$(DOCKER_REPO)/agent-base:latest -f agent-base.Dockerfile .
	@echo "$(COLOR_GREEN)Docker build complete!$(COLOR_RESET)"

# Push Docker images
docker-push:
	@echo "$(COLOR_CYAN)Pushing Docker images...$(COLOR_RESET)"
	@docker push $(DOCKER_REGISTRY)/$(DOCKER_REPO)/agent-base:latest
	@echo "$(COLOR_GREEN)Docker push complete!$(COLOR_RESET)"

# Apply Kubernetes manifests
k8s:
	@echo "$(COLOR_CYAN)Applying Kubernetes manifests...$(COLOR_RESET)"
	@kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@kubectl apply -f $(K8S_DIR)/ -n $(NAMESPACE)
	@echo "$(COLOR_GREEN)Kubernetes manifests applied!$(COLOR_RESET)"

# Remove Kubernetes resources
k8s-clean:
	@echo "$(COLOR_CYAN)Removing Kubernetes resources...$(COLOR_RESET)"
	@kubectl delete -f $(K8S_DIR)/ -n $(NAMESPACE) --ignore-not-found
	@echo "$(COLOR_GREEN)Kubernetes resources removed!$(COLOR_RESET)"

# Deploy monitoring stack
monitoring:
	@echo "$(COLOR_CYAN)Deploying monitoring stack...$(COLOR_RESET)"
	@cd $(MONITORING_DIR) && docker-compose -f $(DOCKER_COMPOSE_MONITORING_FILE) up -d
	@echo "$(COLOR_GREEN)Monitoring stack deployed!$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Grafana:    http://localhost:$(GRAFANA_PORT)$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Prometheus: http://localhost:$(PROMETHEUS_PORT)$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Loki:       http://localhost:$(LOKI_PORT)$(COLOR_RESET)"

# Stop monitoring stack
monitoring-down:
	@echo "$(COLOR_CYAN)Stopping monitoring stack...$(COLOR_RESET)"
	@cd $(MONITORING_DIR) && docker-compose -f $(DOCKER_COMPOSE_MONITORING_FILE) down
	@echo "$(COLOR_GREEN)Monitoring stack stopped!$(COLOR_RESET)"

# Open Grafana dashboard
dashboard:
	@echo "$(COLOR_CYAN)Opening Grafana dashboard...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/open-dashboard.sh $(GRAFANA_PORT)

# View logs with Loki
logs:
	@echo "$(COLOR_CYAN)Viewing logs with Loki...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/view-logs.sh

# Deploy agent swarm
swarm-up:
	@echo "$(COLOR_CYAN)Deploying agent swarm...$(COLOR_RESET)"
	@cd $(SWARM_DIR) && docker-compose -f $(DOCKER_COMPOSE_FILE) up -d
	@echo "$(COLOR_GREEN)Agent swarm deployed!$(COLOR_RESET)"

# Stop agent swarm
swarm-down:
	@echo "$(COLOR_CYAN)Stopping agent swarm...$(COLOR_RESET)"
	@cd $(SWARM_DIR) && docker-compose -f $(DOCKER_COMPOSE_FILE) down
	@echo "$(COLOR_GREEN)Agent swarm stopped!$(COLOR_RESET)"

# Validate agent manifests
validate:
	@echo "$(COLOR_CYAN)Validating agent manifests...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/validate-agents.sh
	@echo "$(COLOR_GREEN)Agent manifests validated!$(COLOR_RESET)"

# Check agent status
status:
	@echo "$(COLOR_CYAN)Checking agent status...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/agent-status.sh
	@echo "$(COLOR_GREEN)Agent status check complete!$(COLOR_RESET)"

# Deploy agents
deploy:
	@echo "$(COLOR_CYAN)Deploying agents...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/deploy-agents.sh $(AGENT_REPLICAS)
	@echo "$(COLOR_GREEN)Agents deployed!$(COLOR_RESET)"

# Execute agent action
execute:
	@echo "$(COLOR_CYAN)Executing agent action...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/execute-agent-action.sh
	@echo "$(COLOR_GREEN)Agent action executed!$(COLOR_RESET)"

# Train agent models
train:
	@echo "$(COLOR_CYAN)Training agent models...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/train-agents.sh
	@echo "$(COLOR_GREEN)Agent models trained!$(COLOR_RESET)"

# Install and use agentctl CLI
agent:
	@echo "$(COLOR_CYAN)Installing agentctl CLI...$(COLOR_RESET)"
	@cd $(TOOLS_DIR)/agent-wizard && npm install && npm run build && npm link
	@echo "$(COLOR_GREEN)agentctl CLI installed!$(COLOR_RESET)"
	@echo "$(COLOR_YELLOW)Usage: agentctl [command]$(COLOR_RESET)"
	@agentctl --help

# List all agents using agentctl
agent-list:
	@echo "$(COLOR_CYAN)Listing all agents...$(COLOR_RESET)"
	@agentctl status

# Check agent status using agentctl
agent-status:
	@echo "$(COLOR_CYAN)Checking agent status...$(COLOR_RESET)"
	@agentctl status $(AGENT)

# View agent logs using agentctl
agent-logs:
	@echo "$(COLOR_CYAN)Viewing agent logs...$(COLOR_RESET)"
	@agentctl logs $(AGENT) $(FOLLOW)

# Deploy an agent using agentctl
agent-deploy:
	@echo "$(COLOR_CYAN)Deploying agent...$(COLOR_RESET)"
	@agentctl deploy $(AGENT)

# Execute an agent action using agentctl
agent-execute:
	@echo "$(COLOR_CYAN)Executing agent action...$(COLOR_RESET)"
	@agentctl execute $(AGENT) $(ACTION) $(DATA)

# Train agent models using agentctl
agent-train:
	@echo "$(COLOR_CYAN)Training agent models...$(COLOR_RESET)"
	@agentctl train $(AGENT)

# Run agent benchmarks using agentctl
agent-benchmark:
	@echo "$(COLOR_CYAN)Running agent benchmarks...$(COLOR_RESET)"
	@agentctl benchmark $(AGENT)

# Validate agent manifest using agentctl
agent-validate:
	@echo "$(COLOR_CYAN)Validating agent manifest...$(COLOR_RESET)"
	@agentctl validate $(PATH)

# Show environment information
info:
	@echo "$$LOGO"
	@echo "$(COLOR_CYAN)TerraFusion DevOps Kit Information$(COLOR_RESET)"
	@echo "$(COLOR_CYAN)=================================$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_YELLOW)Environment:$(COLOR_RESET) $(ENV)"
	@echo "$(COLOR_YELLOW)Kubernetes Namespace:$(COLOR_RESET) $(NAMESPACE)"
	@echo "$(COLOR_YELLOW)Docker Registry:$(COLOR_RESET) $(DOCKER_REGISTRY)"
	@echo "$(COLOR_YELLOW)Docker Repository:$(COLOR_RESET) $(DOCKER_REPO)"
	@echo "$(COLOR_YELLOW)Grafana Port:$(COLOR_RESET) $(GRAFANA_PORT)"
	@echo "$(COLOR_YELLOW)Prometheus Port:$(COLOR_RESET) $(PROMETHEUS_PORT)"
	@echo "$(COLOR_YELLOW)Loki Port:$(COLOR_RESET) $(LOKI_PORT)"
	@echo ""
	@echo "$(COLOR_YELLOW)Agent Directory:$(COLOR_RESET) $(SWARM_DIR)"
	@echo "$(COLOR_YELLOW)Default Agent Replicas:$(COLOR_RESET) $(AGENT_REPLICAS)"
	@echo ""
	@echo "$(COLOR_YELLOW)Terraform Directory:$(COLOR_RESET) $(TERRAFORM_DIR)"
	@echo "$(COLOR_YELLOW)Kubernetes Manifests Directory:$(COLOR_RESET) $(K8S_DIR)"
	@echo "$(COLOR_YELLOW)Docker Directory:$(COLOR_RESET) $(DOCKER_DIR)"
	@echo "$(COLOR_YELLOW)Monitoring Directory:$(COLOR_RESET) $(MONITORING_DIR)"
	@echo "$(COLOR_YELLOW)Scripts Directory:$(COLOR_RESET) $(SCRIPTS_DIR)"
	@echo "$(COLOR_YELLOW)Tools Directory:$(COLOR_RESET) $(TOOLS_DIR)"
	@echo ""

# Clean up resources
clean:
	@echo "$(COLOR_CYAN)Cleaning up resources...$(COLOR_RESET)"
	@$(MAKE) swarm-down
	@$(MAKE) monitoring-down
	@$(MAKE) k8s-clean
	@echo "$(COLOR_GREEN)Resources cleaned up!$(COLOR_RESET)"

# Open interactive console
console:
	@echo "$(COLOR_CYAN)Opening interactive console...$(COLOR_RESET)"
	@$(SCRIPTS_DIR)/interactive-console.sh

# Show version information
version:
	@echo "$(COLOR_CYAN)TerraFusion DevOps Kit Version Information$(COLOR_RESET)"
	@echo "$(COLOR_CYAN)=======================================$(COLOR_RESET)"
	@echo ""
	@echo "$(COLOR_YELLOW)DevOps Kit Version:$(COLOR_RESET) 1.0.0"
	@echo "$(COLOR_YELLOW)Agent Manifest Version:$(COLOR_RESET) $(shell grep "version:" $(SWARM_DIR)/agent-manifest.yaml | head -1 | awk '{print $$2}' | tr -d "'")"
	@echo "$(COLOR_YELLOW)agentctl Version:$(COLOR_RESET) $(shell cd $(TOOLS_DIR)/agent-wizard && node -e "console.log(require('./package.json').version)")"
	@echo ""