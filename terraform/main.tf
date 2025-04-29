terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    # These values will be provided during initialization
    # bucket         = "terrabuild-terraform-state"
    # key            = "terraform.tfstate"
    # region         = "us-west-2"
    # dynamodb_table = "terrabuild-terraform-locks"
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source = "./modules/network"
  
  environment     = var.environment
  vpc_cidr        = var.vpc_cidr
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "database" {
  source = "./modules/database"
  
  environment         = var.environment
  vpc_id              = module.network.vpc_id
  private_subnet_ids  = module.network.private_subnet_ids
  db_instance_class   = var.db_instance_class
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = var.db_password
  db_allocated_storage = var.db_allocated_storage
}