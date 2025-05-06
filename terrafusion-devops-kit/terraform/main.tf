# TerraFusion Infrastructure as Code
# This is the main Terraform configuration for the TerraFusion platform

terraform {
  required_version = "~> 1.4"

  backend "s3" {
    # These values are set via backend-config at initialization
    # Example: terraform init -backend-config=environments/dev.tfbackend
    # 
    # bucket         = "terrafusion-tfstate-dev"
    # key            = "terraform.tfstate"
    # region         = "us-west-2"
    # dynamodb_table = "terrafusion-tfstate-lock-dev"
    # encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "TerraFusion"
      ManagedBy   = "Terraform"
      Owner       = "DevOps"
    }
  }
}

# Retrieve existing AWS account information
data "aws_caller_identity" "current" {}
data "aws_availability_zones" "available" {}

locals {
  cluster_name    = "terrafusion-${var.environment}"
  vpc_name        = "terrafusion-vpc-${var.environment}"
  account_id      = data.aws_caller_identity.current.account_id
  azs             = slice(data.aws_availability_zones.available.names, 0, 3)
  agents          = ["factor-tuner", "benchmark-guard", "curve-trainer", "scenario-agent", "boe-arguer"]
  
  # Common tags
  common_tags = {
    Project     = "TerraFusion"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Owner       = "DevOps"
  }
}

# Create KMS key for EKS encryption
resource "aws_kms_key" "eks" {
  description             = "EKS Encryption Key for ${local.cluster_name}"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  tags                    = local.common_tags
}

# Create a random string for database password
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# VPC for EKS and other resources
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = local.vpc_name
  cidr = var.vpc_cidr

  azs             = local.azs
  private_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 4, i)]
  public_subnets  = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + 48)]
  
  # Database subnets
  database_subnets = [for i, az in local.azs : cidrsubnet(var.vpc_cidr, 8, i + 16)]
  
  # Enable DNS hostnames and support for NAT Gateway
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "prod" # Use single NAT except in prod
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # EKS-specific tags for subnets
  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }
  
  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }
  
  # Add common tags
  tags = local.common_tags
}

# RDS PostgreSQL for TerraFusion data
module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "6.1.0"

  identifier = "terrafusion-${var.environment}"
  
  # Database settings
  engine               = "postgres"
  engine_version       = "15"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = var.db_instance_type
  allocated_storage    = var.db_allocated_storage
  
  # Credentials
  db_name  = "terrafusion"
  username = "terrafusion_admin"
  port     = 5432
  password = random_password.db_password.result
  
  # Subnet group and security group
  subnet_ids             = module.vpc.database_subnets
  vpc_security_group_ids = [aws_security_group.db.id]
  
  # Maintenance and backup settings
  maintenance_window       = "Mon:00:00-Mon:03:00"
  backup_window            = "03:00-06:00"
  backup_retention_period  = 7
  
  # Security settings
  storage_encrypted   = true
  multi_az            = var.environment == "prod"
  skip_final_snapshot = var.environment != "prod"
  
  # Performance insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  
  # Deletion protection
  deletion_protection = var.environment == "prod"
  
  # Parameters
  parameters = [
    {
      name  = "log_connections"
      value = "1"
    },
    {
      name  = "log_min_duration_statement"
      value = "1000"
    }
  ]
  
  tags = local.common_tags
}

# Security group for database
resource "aws_security_group" "db" {
  name        = "terrafusion-db-${var.environment}"
  description = "Security group for TerraFusion database"
  vpc_id      = module.vpc.vpc_id
  
  # Ingress rules - allow only from EKS cluster nodes and bastion
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
    description     = "Allow PostgreSQL access from EKS nodes"
  }
  
  # Egress rules - allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(
    local.common_tags,
    {
      Name = "terrafusion-db-${var.environment}"
    }
  )
}

# EKS cluster for TerraFusion
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.15.1"

  cluster_name    = local.cluster_name
  cluster_version = var.kubernetes_version

  # VPC configuration
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  # Cluster encryption
  cluster_encryption_config = [{
    provider_key_arn = aws_kms_key.eks.arn
    resources        = ["secrets"]
  }]
  
  # Control plane logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  # Managed node groups
  eks_managed_node_groups = {
    # System node group for core services
    system = {
      name            = "system"
      instance_types  = ["t3.medium"]
      min_size        = 2
      max_size        = 4
      desired_size    = 2
      capacity_type   = "ON_DEMAND"
      disk_size       = 50
      
      # System label and taint
      labels = {
        role = "system"
      }
      
      taints = {
        dedicated = {
          key    = "dedicated"
          value  = "system"
          effect = "NO_SCHEDULE"
        }
      }
    }
    
    # Application node group for backend and frontend
    application = {
      name            = "application"
      instance_types  = ["t3.large"]
      min_size        = 2
      max_size        = 6
      desired_size    = 2
      capacity_type   = "ON_DEMAND"
      disk_size       = 50
      
      # Application label
      labels = {
        role = "application"
      }
    }
    
    # AI Agents node group for agent workloads
    agents = {
      name            = "agents"
      instance_types  = ["c5.xlarge"]
      min_size        = 1
      max_size        = 5
      desired_size    = 2
      capacity_type   = var.environment == "prod" ? "ON_DEMAND" : "SPOT"
      disk_size       = 100
      
      # Agent label
      labels = {
        role = "agent"
      }
    }
  }
  
  # Node IAM role additional policies
  node_security_group_additional_rules = {
    ingress_self_all = {
      description = "Node to node all ports/protocols"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
    egress_all = {
      description      = "Node all egress"
      protocol         = "-1"
      from_port        = 0
      to_port          = 0
      type             = "egress"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = ["::/0"]
    }
  }
  
  # AWS auth configuration 
  manage_aws_auth_configmap = true
  aws_auth_roles = [
    {
      rolearn  = "arn:aws:iam::${local.account_id}:role/TerraFusionDevOpsRole"
      username = "terraform"
      groups   = ["system:masters"]
    }
  ]
  
  tags = local.common_tags
}

# ECR repositories for TerraFusion container images
resource "aws_ecr_repository" "backend" {
  name                 = "terrafusion-backend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = local.common_tags
}

resource "aws_ecr_repository" "frontend" {
  name                 = "terrafusion-frontend"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = local.common_tags
}

resource "aws_ecr_repository" "agent_base" {
  name                 = "terrafusion-agent-base"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = local.common_tags
}

# Create ECR repositories for each agent
resource "aws_ecr_repository" "agents" {
  for_each = toset(local.agents)

  name                 = "terrafusion-${each.key}"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = merge(
    local.common_tags,
    {
      AgentType = each.key
    }
  )
}

# IAM roles for EKS service accounts
module "backend_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-account-eks"
  version = "5.30.0"
  
  role_name = "terrafusion-backend-${var.environment}"
  
  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:terrafusion-backend"]
    }
  }
  
  role_policy_arns = {
    AmazonS3ReadOnlyAccess      = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
    AmazonSESFullAccess         = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
    CloudWatchAgentServerPolicy = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  }
  
  tags = local.common_tags
}

module "agents_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-account-eks"
  version = "5.30.0"
  
  role_name = "terrafusion-agents-${var.environment}"
  
  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["terrafusion-agents:terrafusion-agent"]
    }
  }
  
  role_policy_arns = {
    AmazonS3ReadOnlyAccess      = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
    CloudWatchAgentServerPolicy = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  }
  
  tags = local.common_tags
}

# S3 bucket for logs and data
resource "aws_s3_bucket" "logs" {
  bucket = "terrafusion-${var.environment}-logs"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_lifecycle_configuration" "logs_lifecycle" {
  bucket = aws_s3_bucket.logs.id
  
  rule {
    id     = "log-expiration"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket" "data" {
  bucket = "terrafusion-${var.environment}-data"
  
  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "data_versioning" {
  bucket = aws_s3_bucket.data.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "eks_cluster" {
  name              = "/aws/eks/${local.cluster_name}/cluster"
  retention_in_days = 90
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "application" {
  name              = "/terrafusion/${var.environment}/application"
  retention_in_days = 90
  
  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "agents" {
  for_each = toset(local.agents)
  
  name              = "/terrafusion/${var.environment}/agents/${each.key}"
  retention_in_days = 90
  
  tags = merge(
    local.common_tags,
    {
      AgentType = each.key
    }
  )
}