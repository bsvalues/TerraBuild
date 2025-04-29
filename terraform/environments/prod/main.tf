terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "terrabuild-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-west-2"
    dynamodb_table = "terrabuild-terraform-locks-prod"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "terrabuild_infrastructure" {
  source = "../../"
  
  environment        = "prod"
  vpc_cidr           = var.vpc_cidr
  public_subnets     = var.public_subnets
  private_subnets    = var.private_subnets
  db_instance_class  = "db.t3.medium"
  db_name            = "terrabuild_prod"
  db_username        = var.db_username
  db_password        = var.db_password
  db_allocated_storage = 50
}