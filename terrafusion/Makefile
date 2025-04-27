# BCBS Infrastructure as Code Makefile

# Default environment
ENV ?= dev

# Default action
ACTION ?= plan

# Default version tag
VERSION ?= latest

# Lambda function directories
FUNCTIONS_DIR = functions
LAMBDA_DIST_DIR = $(FUNCTIONS_DIR)/dist

# Reusable command for running Terraform operations
TF_CMD = ./terraform-setup.sh $(ENV) $(ACTION) $(VERSION)

.PHONY: help init plan apply destroy fmt validate lint clean build-lambdas all

# Default target
help:
	@echo "BCBS Infrastructure as Code (IaC) - Make Targets"
	@echo "----------------------------------------------"
	@echo "Usage: make [target] [ENV=environment] [ACTION=action] [VERSION=version]"
	@echo ""
	@echo "Available targets:"
	@echo "  help          - Show this help message"
	@echo "  init          - Initialize Terraform for specified environment"
	@echo "  plan          - Plan Terraform changes for specified environment"
	@echo "  apply         - Apply Terraform changes for specified environment"
	@echo "  destroy       - Destroy infrastructure for specified environment"
	@echo "  fmt           - Format Terraform code"
	@echo "  validate      - Validate Terraform code"
	@echo "  lint          - Run linting on Terraform code"
	@echo "  clean         - Clean temporary files"
	@echo "  build-lambdas - Build Lambda function packages"
	@echo "  all           - Run fmt, validate, lint, build-lambdas, and plan"
	@echo ""
	@echo "Environment options: dev (default), staging, prod"
	@echo "Action options: plan (default), apply, destroy"
	@echo "Version: any valid version tag (default: latest)"
	@echo ""
	@echo "Examples:"
	@echo "  make plan ENV=dev"
	@echo "  make apply ENV=staging VERSION=v1.0.0"
	@echo "  make destroy ENV=dev"

# Initialize Terraform for a specific environment
init:
	@echo "Initializing Terraform for $(ENV) environment..."
	cp new_main.tf main.tf
	cp new_variables.tf variables.tf
	cp new_outputs.tf outputs.tf
	terraform init -backend-config=environments/$(ENV)/backend.tfvars
	terraform workspace select $(ENV) || terraform workspace new $(ENV)

# Plan Terraform changes
plan: 
	@echo "Planning Terraform changes for $(ENV) environment..."
	$(TF_CMD)

# Apply Terraform changes
apply:
	@echo "Applying Terraform changes to $(ENV) environment..."
	$(eval ACTION := apply)
	$(TF_CMD)

# Destroy infrastructure
destroy:
	@echo "WARNING: This will destroy all infrastructure in the $(ENV) environment!"
	@echo "Are you sure? Type 'yes' to confirm:"
	@read -p "" CONFIRM && [ $$CONFIRM = "yes" ] || (echo "Destroy cancelled"; exit 1)
	$(eval ACTION := destroy)
	$(TF_CMD)

# Format Terraform code
fmt:
	@echo "Formatting Terraform code..."
	terraform fmt -recursive

# Validate Terraform code
validate:
	@echo "Validating Terraform code..."
	terraform validate

# Run TFLint
lint:
	@echo "Linting Terraform code..."
	tflint --recursive

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	rm -f main.tf variables.tf outputs.tf
	rm -f *.tfplan
	rm -f terraform.*.tfstate
	rm -f terraform.*.log

# Build Lambda function packages
build-lambdas:
	@echo "Building Lambda function packages..."
	cd $(FUNCTIONS_DIR) && npm install && npm run build
	mkdir -p $(LAMBDA_DIST_DIR)
	@echo "Lambda packages built in $(LAMBDA_DIST_DIR)"

# Run all relevant checks and build steps
all: fmt validate lint build-lambdas
	@echo "Running plan after validation..."
	$(TF_CMD)