/**
 * TerraFusion Production Environment Configuration
 * 
 * This configuration sets up the production environment for TerraFusion with high availability
 */

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = "TerraFusion"
      Environment = "prod"
      ManagedBy   = "Terraform"
    }
  }
}

# Setup backend for Terraform state
terraform {
  backend "s3" {
    bucket         = "terrafusion-tfstate-prod"
    key            = "terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terrafusion-tfstate-lock-prod"
  }
}

# Create ACM certificate for HTTPS
resource "aws_acm_certificate" "cert" {
  domain_name       = "terrafusion.benton-county.example.com"
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "prod-terrafusion-cert"
  }
}

# Route 53 validation records for ACM certificate
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Certificate validation
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# DNS record for the application
resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "terrafusion.benton-county.example.com"
  type    = "A"
  
  alias {
    name                   = module.compute.alb_dns_name
    zone_id                = module.compute.alb_zone_id
    evaluate_target_health = true
  }
}

# Create networking resources
module "networking" {
  source = "../../modules/networking"
  
  environment             = "prod"
  vpc_cidr                = "10.1.0.0/16"
  public_subnet_cidrs     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  private_subnet_cidrs    = ["10.1.4.0/24", "10.1.5.0/24", "10.1.6.0/24"]
  database_subnet_cidrs   = ["10.1.7.0/24", "10.1.8.0/24", "10.1.9.0/24"]
  availability_zones      = ["${var.region}a", "${var.region}b", "${var.region}c"]
  enable_nat_gateway      = true
  single_nat_gateway      = false  # High availability with multiple NAT gateways
  enable_vpn_gateway      = true
}

# Create security resources
module "security" {
  source = "../../modules/security"
  
  environment    = "prod"
  openai_api_key = var.openai_api_key
}

# Create database resources
module "database" {
  source = "../../modules/database"
  
  environment             = "prod"
  vpc_id                  = module.networking.vpc_id
  subnet_ids              = module.networking.database_subnet_ids
  security_group_ids      = [module.networking.database_security_group_id]
  kms_key_arn             = module.security.kms_key_arn
  db_instance_class       = "db.m5.large"
  db_allocated_storage    = 100
  db_max_storage          = 500
  multi_az                = true   # High availability with multi-AZ deployment
  deletion_protection     = true   # Protect against accidental deletion
  backup_retention_period = 30     # 30 days backup retention
  apply_immediately       = false  # Apply changes during maintenance window
  db_name                 = "terrafusion"
  db_username             = "tfadmin"
  db_password             = var.db_password
  enable_performance_insights = true
}

# Create compute resources
module "compute" {
  source = "../../modules/compute"
  
  environment           = "prod"
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  app_security_group_id = module.networking.app_security_group_id
  db_secret_arn         = module.database.db_secret_arn
  certificate_arn       = aws_acm_certificate_validation.cert.certificate_arn
  app_version           = var.app_version
  service_desired_count = 3  # Multiple instances for high availability
  task_cpu              = "2048"
  task_memory           = "4096"
  enable_container_insights = true
}

# Create monitoring resources
module "monitoring" {
  source = "../../modules/monitoring"
  
  environment     = "prod"
  region          = var.region
  alert_emails    = var.alert_emails
  alb_arn_suffix  = module.compute.alb_dns_name
}

# Create AWS Backup plan for RDS and EFS
resource "aws_backup_plan" "main" {
  name = "prod-terrafusion-backup-plan"
  
  rule {
    rule_name           = "daily-backup"
    target_vault_name   = aws_backup_vault.main.name
    schedule            = "cron(0 1 * * ? *)"  # Daily at 1:00 AM UTC
    start_window        = 60
    completion_window   = 120
    
    lifecycle {
      cold_storage_after = 30
      delete_after       = 365
    }
  }
  
  rule {
    rule_name           = "weekly-backup"
    target_vault_name   = aws_backup_vault.main.name
    schedule            = "cron(0 5 ? * SAT *)"  # Weekly on Saturday at 5:00 AM UTC
    start_window        = 60
    completion_window   = 180
    
    lifecycle {
      cold_storage_after = 90
      delete_after       = 730
    }
  }
  
  advanced_backup_setting {
    backup_options = {
      WindowsVSS = "enabled"
    }
    resource_type = "EC2"
  }
}

# Create AWS Backup vault
resource "aws_backup_vault" "main" {
  name        = "prod-terrafusion-backup-vault"
  kms_key_arn = module.security.kms_key_arn
}

# Create AWS Backup selection
resource "aws_backup_selection" "main" {
  name          = "prod-terrafusion-backup-selection"
  iam_role_arn  = aws_iam_role.backup_role.arn
  plan_id       = aws_backup_plan.main.id
  
  resources = [
    module.database.db_arn
  ]
}

# Create IAM role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "prod-terrafusion-backup-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })
}

# Attach AWS Backup policy to IAM role
resource "aws_iam_role_policy_attachment" "backup_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup_role.name
}

# Data sources
data "aws_route53_zone" "main" {
  name = "benton-county.example.com"
}

# Outputs
output "app_url" {
  description = "URL of the application"
  value       = "https://${aws_route53_record.app.name}"
}

output "database_endpoint" {
  description = "Endpoint of the RDS database"
  value       = module.database.db_endpoint
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = module.compute.ecr_repository_url
}