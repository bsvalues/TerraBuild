/**
 * # TerraBuild Production Environment
 *
 * This Terraform configuration deploys the production environment for TerraBuild.
 */

terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
    bucket         = "terrabuild-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terrabuild-terraform-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "TerraBuild"
      Environment = "production"
      ManagedBy   = "Terraform"
    }
  }
}

# Network Module
module "network" {
  source = "../../modules/network"
  
  app_name        = "terrabuild"
  environment     = "prod"
  vpc_cidr        = var.vpc_cidr
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

# Database Module
module "database" {
  source = "../../modules/database"
  
  app_name     = "terrabuild"
  environment  = "prod"
  db_username  = var.db_username
  db_password  = var.db_password
  vpc_id       = module.network.vpc_id
  subnet_ids   = module.network.private_subnet_ids
  instance_class = "db.t3.medium"  # Production-sized instance
  allocated_storage = 50
  multi_az     = true  # Enable high availability
  backup_retention_period = 7  # Keep backups for 7 days
}

# ECS Module
module "ecs" {
  source = "../../modules/ecs"
  
  app_name    = "terrabuild"
  environment = "prod"
  vpc_id      = module.network.vpc_id
  subnet_ids  = module.network.private_subnet_ids
  public_subnet_ids = module.network.public_subnet_ids
  
  # Production sized container settings
  container_memory = 2048
  container_cpu    = 1024
  desired_count    = 2  # Two containers for high availability
  max_capacity     = 5  # Allow scaling up to 5 containers
  min_capacity     = 2  # Always keep at least 2 containers running
  
  # Database connection
  db_host      = module.database.db_host
  db_port      = module.database.db_port
  db_name      = module.database.db_name
  db_username  = var.db_username
  db_password  = var.db_password
  
  # Domain configuration
  domain_name  = var.domain_name
}

# Security Module
module "security" {
  source = "../../modules/security"
  
  app_name     = "terrabuild"
  environment  = "prod"
  aws_region   = var.aws_region
  alb_arn      = module.ecs.alb_arn
  
  # Enable advanced security features in production
  enable_shield_advanced = true
  enable_security_hub   = true
  enable_guardduty      = true
  
  # Security notifications
  security_alert_emails = [
    "security@terrabuild.bentoncounty.com",
    "admin@terrabuild.bentoncounty.com"
  ]
  
  # Geo-restrictions if needed
  # blocked_countries = ["RU", "KP"]
}

# Monitoring Module
module "monitoring" {
  source = "../../modules/monitoring"
  
  app_name              = "terrabuild"
  environment           = "prod"
  aws_region            = var.aws_region
  ecs_cluster_name      = module.ecs.cluster_name
  ecs_service_name      = module.ecs.service_name
  db_instance_identifier = module.database.db_identifier
  load_balancer_name    = module.ecs.alb_name
  
  # Alert email addresses for production
  alert_email_addresses = [
    "ops-team@terrabuild.bentoncounty.com",
    "admin@terrabuild.bentoncounty.com"
  ]
}