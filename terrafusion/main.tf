terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.33.0"
    }
  }

  backend "s3" {
    # These values would be provided during terraform init
    # bucket = "bcbs-terraform-state"
    # key    = "state/terraform.tfstate"
    # region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC for the application
resource "aws_vpc" "bcbs_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project}-vpc-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Public subnets
resource "aws_subnet" "public" {
  count             = length(var.public_subnets_cidr)
  vpc_id            = aws_vpc.bcbs_vpc.id
  cidr_block        = element(var.public_subnets_cidr, count.index)
  availability_zone = element(var.availability_zones, count.index)

  tags = {
    Name        = "${var.project}-public-subnet-${count.index + 1}-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Private subnets
resource "aws_subnet" "private" {
  count             = length(var.private_subnets_cidr)
  vpc_id            = aws_vpc.bcbs_vpc.id
  cidr_block        = element(var.private_subnets_cidr, count.index)
  availability_zone = element(var.availability_zones, count.index)

  tags = {
    Name        = "${var.project}-private-subnet-${count.index + 1}-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# RDS PostgreSQL Database
resource "aws_db_instance" "bcbs_db" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  db_name              = var.db_name
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name = aws_db_subnet_group.bcbs_db_subnet.name

  tags = {
    Name        = "${var.project}-db-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "bcbs_db_subnet" {
  name       = "${var.project}-db-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project}-db-subnet-group-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "bcbs_redis" {
  cluster_id           = "${var.project}-redis-${var.environment}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.0"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.bcbs_redis_subnet.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  tags = {
    Name        = "${var.project}-redis-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Redis Subnet Group
resource "aws_elasticache_subnet_group" "bcbs_redis_subnet" {
  name       = "${var.project}-redis-subnet-group-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "${var.project}-redis-subnet-group-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Security Groups
resource "aws_security_group" "app_sg" {
  name        = "${var.project}-app-sg-${var.environment}"
  description = "Security group for app servers"
  vpc_id      = aws_vpc.bcbs_vpc.id

  # Allow HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-app-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_security_group" "rds_sg" {
  name        = "${var.project}-rds-sg-${var.environment}"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.bcbs_vpc.id

  # Allow PostgreSQL from app security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-rds-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

resource "aws_security_group" "redis_sg" {
  name        = "${var.project}-redis-sg-${var.environment}"
  description = "Security group for Redis"
  vpc_id      = aws_vpc.bcbs_vpc.id

  # Allow Redis from app security group
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project}-redis-sg-${var.environment}"
    Environment = var.environment
    Project     = var.project
  }
}

# Output important information
output "vpc_id" {
  value = aws_vpc.bcbs_vpc.id
}

output "db_endpoint" {
  value = aws_db_instance.bcbs_db.endpoint
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.bcbs_redis.cache_nodes.0.address
}

output "public_subnets" {
  value = aws_subnet.public[*].id
}

output "private_subnets" {
  value = aws_subnet.private[*].id
}