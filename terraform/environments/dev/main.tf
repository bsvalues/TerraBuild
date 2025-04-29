terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "terrabuild-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terrabuild-terraform-locks-dev"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "terrabuild_infrastructure" {
  source = "../../"
  
  environment        = "dev"
  vpc_cidr           = var.vpc_cidr
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
  db_instance_class  = "db.t3.small"
  db_name            = "terrabuild_dev"
  db_username        = var.db_username
  db_password        = var.db_password
  db_allocated_storage = 20
  
  domain_name        = var.domain_name
  app_cpu            = 1024
  app_memory         = 2048
  app_desired_count  = 1
}