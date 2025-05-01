/**
 * TerraFusion Development Environment Configuration
 * 
 * This configuration sets up the development environment for TerraFusion
 */

provider "aws" {
  region = var.region
  
  default_tags {
    tags = {
      Project     = "TerraFusion"
      Environment = "dev"
      ManagedBy   = "Terraform"
    }
  }
}

# Setup backend for Terraform state
terraform {
  backend "s3" {
    bucket  = "terrafusion-tfstate-dev"
    key     = "terraform.tfstate"
    region  = "us-west-2"
    encrypt = true
  }
}

# Create ACM certificate for HTTPS
resource "aws_acm_certificate" "cert" {
  domain_name       = "dev.terrafusion.benton-county.example.com"
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "dev-terrafusion-cert"
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
  name    = "dev.terrafusion.benton-county.example.com"
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
  
  environment             = "dev"
  vpc_cidr                = "10.0.0.0/16"
  public_subnet_cidrs     = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs    = ["10.0.3.0/24", "10.0.4.0/24"]
  database_subnet_cidrs   = ["10.0.5.0/24", "10.0.6.0/24"]
  availability_zones      = ["${var.region}a", "${var.region}b"]
}

# Create security resources
module "security" {
  source = "../../modules/security"
  
  environment      = "dev"
  openai_api_key   = var.openai_api_key
}

# Create database resources
module "database" {
  source = "../../modules/database"
  
  environment           = "dev"
  vpc_id                = module.networking.vpc_id
  subnet_ids            = module.networking.database_subnet_ids
  security_group_ids    = [module.networking.database_security_group_id]
  kms_key_arn           = module.security.kms_key_arn
  db_instance_class     = "db.t3.medium"
  db_allocated_storage  = 20
  db_max_storage        = 50
  multi_az              = false  # No multi-AZ for dev environment
  deletion_protection   = false  # Allow deletion in dev environment
  db_name               = "terrafusion"
  db_username           = "tfadmin"
  db_password           = var.db_password
}

# Create compute resources
module "compute" {
  source = "../../modules/compute"
  
  environment           = "dev"
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  app_security_group_id = module.networking.app_security_group_id
  db_secret_arn         = module.database.db_secret_arn
  certificate_arn       = aws_acm_certificate_validation.cert.certificate_arn
  app_version           = var.app_version
  service_desired_count = 1  # Only 1 instance for dev
  task_cpu              = "512"
  task_memory           = "1024"
}

# Create monitoring resources
module "monitoring" {
  source = "../../modules/monitoring"
  
  environment     = "dev"
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