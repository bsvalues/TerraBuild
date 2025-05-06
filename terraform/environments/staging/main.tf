/**
 * TerraFusion Staging Environment Configuration
 * 
 * This configuration sets up the staging environment for TerraFusion
 * It mirrors production but with smaller resources
 */

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = "TerraFusion"
      Environment = "staging"
      ManagedBy   = "Terraform"
    }
  }
}

# Setup backend for Terraform state
terraform {
  backend "s3" {
    bucket         = "terrafusion-tfstate-staging"
    key            = "terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    dynamodb_table = "terrafusion-tfstate-lock-staging"
  }
}

# Create ACM certificate for HTTPS
resource "aws_acm_certificate" "cert" {
  domain_name       = "staging.terrafusion.benton-county.example.com"
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "staging-terrafusion-cert"
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
  name    = "staging.terrafusion.benton-county.example.com"
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
  
  environment             = "staging"
  vpc_cidr                = "10.2.0.0/16"
  public_subnet_cidrs     = ["10.2.1.0/24", "10.2.2.0/24"]
  private_subnet_cidrs    = ["10.2.3.0/24", "10.2.4.0/24"]
  database_subnet_cidrs   = ["10.2.5.0/24", "10.2.6.0/24"]
  availability_zones      = ["${var.region}a", "${var.region}b"]
  enable_nat_gateway      = true
  single_nat_gateway      = true  # Cost saving with a single NAT gateway
}

# Create security resources
module "security" {
  source = "../../modules/security"
  
  environment    = "staging"
  openai_api_key = var.openai_api_key
}

# Create database resources
module "database" {
  source = "../../modules/database"
  
  environment             = "staging"
  vpc_id                  = module.networking.vpc_id
  subnet_ids              = module.networking.database_subnet_ids
  security_group_ids      = [module.networking.database_security_group_id]
  kms_key_arn             = module.security.kms_key_arn
  db_instance_class       = "db.t3.large"
  db_allocated_storage    = 50
  db_max_storage          = 200
  multi_az                = true   # Multi-AZ for staging to mirror production
  deletion_protection     = true
  backup_retention_period = 7      # 7 days backup retention
  db_name                 = "terrafusion"
  db_username             = "tfadmin"
  db_password             = var.db_password
  enable_performance_insights = true
}

# Create compute resources
module "compute" {
  source = "../../modules/compute"
  
  environment           = "staging"
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  app_security_group_id = module.networking.app_security_group_id
  db_secret_arn         = module.database.db_secret_arn
  certificate_arn       = aws_acm_certificate_validation.cert.certificate_arn
  app_version           = var.app_version
  service_desired_count = 2  # 2 instances for staging
  task_cpu              = "1024"
  task_memory           = "2048"
}

# Create monitoring resources
module "monitoring" {
  source = "../../modules/monitoring"
  
  environment     = "staging"
  region          = var.region
  alert_emails    = var.alert_emails
  alb_arn_suffix  = module.compute.alb_dns_name
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