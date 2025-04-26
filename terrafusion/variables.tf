variable "aws_region" {
  description = "AWS region to deploy resources"
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  default     = "dev"
}

variable "project" {
  description = "Project name"
  default     = "bcbs"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "public_subnets_cidr" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets_cidr" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b"]
}

variable "db_name" {
  description = "Name of the PostgreSQL database"
  default     = "bcbs"
}

variable "db_username" {
  description = "Username for the PostgreSQL database"
  default     = "bcbs"
}

variable "db_password" {
  description = "Password for the PostgreSQL database"
  sensitive   = true
}