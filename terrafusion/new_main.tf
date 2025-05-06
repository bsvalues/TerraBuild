terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
    # Variables will be injected via -backend-config
  }
}

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Version     = var.app_version
    }
  }
}

# Random string for unique naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  resource_suffix = random_string.suffix.result
}

# Networking Module
module "networking" {
  source = "./modules/networking"
  
  project_name          = var.project_name
  environment           = var.environment
  vpc_cidr              = var.vpc_cidr
  vpc_name              = "${local.name_prefix}-vpc"
  enable_nat_gateway    = true
  single_nat_gateway    = var.environment != "prod"
  availability_zones    = ["${var.region}a", "${var.region}b", "${var.region}c"]
}

# Database Module
module "database" {
  source = "./modules/database"
  
  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  subnet_ids            = module.networking.private_subnet_ids
  db_name               = "${var.project_name}${var.environment}"
  db_instance_class     = var.db_instance_class
  multi_az              = var.multi_az
  backup_retention_days = var.backup_retention_period
  storage_encrypted     = true
  database_sg_name      = "${local.name_prefix}-db-sg"
}

# Deployment Module (includes Blue-Green and Canary deployments)
module "deployment" {
  source = "./modules/deployment"
  
  project_name             = var.project_name
  environment              = var.environment
  vpc_id                   = module.networking.vpc_id
  public_subnet_ids        = module.networking.public_subnet_ids
  private_subnet_ids       = module.networking.private_subnet_ids
  db_endpoint              = module.database.db_endpoint
  db_name                  = module.database.db_name
  db_username              = module.database.db_username
  db_password              = module.database.db_password
  db_security_group_id     = module.database.security_group_id
  
  # ECS/Container settings
  container_image          = "${var.ecr_repository_name}:${var.app_version}"
  min_capacity             = var.min_capacity
  max_capacity             = var.max_capacity
  
  # Load balancer settings
  health_check_path        = "/api/health"
  
  # Blue-Green deployment settings
  enable_blue_green        = var.enable_blue_green
  
  # Canary deployment settings
  enable_canary            = var.enable_canary
  canary_traffic_percentage = var.canary_traffic_percentage
  
  # Lambda paths for deployment functions
  rollback_function_path   = "./functions/dist/rollback-function.zip"
  canary_function_path     = "./functions/dist/canary-function.zip"
  
  # Monitoring settings
  log_retention_days       = var.log_retention_days
  alarm_evaluation_periods = 3
  alarm_threshold          = 90 # Percentage
}

# ECR Repository for Docker images
resource "aws_ecr_repository" "app_repository" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  lifecycle {
    prevent_destroy = true
  }
}

# Backup Module (optional, only for production and staging)
module "backup" {
  source = "./modules/backup"
  count  = var.enable_disaster_recovery ? 1 : 0
  
  project_name           = var.project_name
  environment            = var.environment
  db_instance_arn        = module.database.db_instance_arn
  backup_retention_days  = var.environment == "prod" ? 30 : 7
  backup_schedule        = var.environment == "prod" ? "cron(0 1 * * ? *)" : "cron(0 3 * * ? *)"
}

# Monitoring and Alerting
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name            = var.project_name
  environment             = var.environment
  alb_arn                 = module.deployment.alb_arn
  cluster_name            = module.deployment.ecs_cluster_name
  db_instance_id          = module.database.db_instance_id
  enable_detailed_metrics = var.environment == "prod"
  alarm_actions           = []  # Add SNS topic ARNs for alarms
}