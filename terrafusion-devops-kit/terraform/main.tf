/**
 * TerraFusion Infrastructure as Code
 * Main Terraform Configuration
 */

terraform {
  required_version = ">= 1.0.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
    vault = {
      source  = "hashicorp/vault"
      version = "~> 3.0"
    }
  }
  
  backend "s3" {
    # Variables are initialized from *.tfbackend config files
    # Example: terraform init -backend-config=environments/dev.tfbackend
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "TerraFusion"
      ManagedBy   = "Terraform"
    }
  }
}

# Configure Kubernetes provider with EKS cluster details
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

# Configure Helm provider with Kubernetes credentials
provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# Configure Vault provider
provider "vault" {
  address = var.vault_address
  # Authentication handled via AWS IAM
  auth_login {
    path = "auth/aws/login"
    parameters = {
      role = "terrafusion-${var.environment}"
    }
  }
}

# Import common modules
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 3.0"
  
  name = "terrafusion-${var.environment}-vpc"
  cidr = var.vpc_cidr
  
  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs
  
  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "prod"
  enable_dns_hostnames = true
  
  # Tag subnets for Kubernetes
  private_subnet_tags = {
    "kubernetes.io/cluster/terrafusion-${var.environment}" = "shared"
    "kubernetes.io/role/internal-elb"                      = 1
  }
  
  public_subnet_tags = {
    "kubernetes.io/cluster/terrafusion-${var.environment}" = "shared"
    "kubernetes.io/role/elb"                               = 1
  }
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 18.0"
  
  cluster_name    = "terrafusion-${var.environment}"
  cluster_version = var.kubernetes_version
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  # EKS Managed Node Group(s)
  eks_managed_node_groups = {
    # System node group for core services
    system = {
      instance_types       = ["m5.large"]
      min_size             = 2
      max_size             = 4
      desired_size         = 2
      
      labels = {
        role = "system"
      }
    }
    
    # Application node group for TerraFusion services
    app = {
      instance_types       = ["m5.xlarge"]
      min_size             = var.min_app_nodes
      max_size             = var.max_app_nodes
      desired_size         = var.desired_app_nodes
      
      labels = {
        role = "application"
      }
    }
    
    # AI node group for ML workloads and agent processing
    ai = {
      instance_types       = ["g4dn.xlarge"]  # GPU instances for AI workloads
      min_size             = var.min_ai_nodes
      max_size             = var.max_ai_nodes
      desired_size         = var.desired_ai_nodes
      
      labels = {
        role = "ai"
      }
      
      taints = [{
        key    = "workload"
        value  = "ai"
        effect = "NO_SCHEDULE"
      }]
    }
  }
  
  # OIDC provider for service accounts
  enable_irsa = true
}

# RDS PostgreSQL instance for application data
module "postgres" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 5.0"
  
  identifier = "terrafusion-${var.environment}"
  
  engine                = "postgres"
  engine_version        = "15.3"
  family                = "postgres15"
  major_engine_version  = "15"
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  
  db_name               = "terrafusion"
  username              = "tfadmin"
  port                  = 5432
  
  # Use KMS for password management
  manage_master_user_password = true
  
  multi_az               = var.environment == "prod"
  subnet_ids             = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.postgres.id]
  
  maintenance_window              = "Mon:00:00-Mon:03:00"
  backup_window                   = "03:00-06:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  create_cloudwatch_log_group     = true
  
  backup_retention_period = var.db_backup_retention_period
  skip_final_snapshot     = var.environment != "prod"
  deletion_protection     = var.environment == "prod"
  
  performance_insights_enabled          = true
  performance_insights_retention_period = 7
  create_monitoring_role                = true
  monitoring_interval                   = 60
  
  parameters = [
    {
      name  = "autovacuum"
      value = 1
    },
    {
      name  = "client_encoding"
      value = "utf8"
    }
  ]
}

# Security group for PostgreSQL
resource "aws_security_group" "postgres" {
  name        = "terrafusion-${var.environment}-postgres-sg"
  description = "Allow PostgreSQL traffic from EKS"
  vpc_id      = module.vpc.vpc_id
  
  ingress {
    description = "PostgreSQL from EKS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = module.vpc.private_subnets_cidr_blocks
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECR Repositories for Docker images
module "ecr" {
  source = "terraform-aws-modules/ecr/aws"
  version = "~> 1.4"
  
  for_each = toset([
    "terrafusion-backend",
    "terrafusion-frontend",
    "terrafusion-agent-base",
    "terrafusion-factor-tuner",
    "terrafusion-benchmark-guard",
    "terrafusion-curve-trainer",
    "terrafusion-scenario-agent",
    "terrafusion-boe-arguer"
  ])
  
  repository_name = each.key
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last 30 images",
        selection = {
          tagStatus     = "tagged",
          tagPrefixList = ["v"],
          countType     = "imageCountMoreThan",
          countNumber   = 30
        },
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Install core infrastructure using Helm
resource "helm_release" "metrics_server" {
  name       = "metrics-server"
  repository = "https://kubernetes-sigs.github.io/metrics-server/"
  chart      = "metrics-server"
  namespace  = "kube-system"
  
  set {
    name  = "apiService.create"
    value = "true"
  }
}

resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  
  set {
    name  = "clusterName"
    value = module.eks.cluster_name
  }
  
  set {
    name  = "serviceAccount.create"
    value = "true"
  }
  
  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.load_balancer_controller_irsa_role.iam_role_arn
  }
}

module "load_balancer_controller_irsa_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  
  role_name                              = "terrafusion-${var.environment}-lb-controller"
  attach_load_balancer_controller_policy = true
  
  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }
}

resource "helm_release" "cert_manager" {
  name       = "cert-manager"
  repository = "https://charts.jetstack.io"
  chart      = "cert-manager"
  namespace  = "cert-manager"
  create_namespace = true
  
  set {
    name  = "installCRDs"
    value = "true"
  }
  
  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.cert_manager_irsa_role.iam_role_arn
  }
}

module "cert_manager_irsa_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  
  role_name                     = "terrafusion-${var.environment}-cert-manager"
  attach_cert_manager_policy    = true
  cert_manager_hosted_zone_arns = var.route53_zone_arns
  
  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["cert-manager:cert-manager"]
    }
  }
}

# External DNS for Route53 integration
resource "helm_release" "external_dns" {
  name       = "external-dns"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "external-dns"
  namespace  = "kube-system"
  
  set {
    name  = "provider"
    value = "aws"
  }
  
  set {
    name  = "aws.region"
    value = var.aws_region
  }
  
  set {
    name  = "aws.zoneType"
    value = "public"
  }
  
  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.external_dns_irsa_role.iam_role_arn
  }
  
  set {
    name  = "policy"
    value = "sync"
  }
}

module "external_dns_irsa_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  
  role_name                     = "terrafusion-${var.environment}-external-dns"
  attach_external_dns_policy    = true
  external_dns_hosted_zone_arns = var.route53_zone_arns
  
  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:external-dns"]
    }
  }
}

# Monitoring stack
resource "kubernetes_namespace" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

resource "helm_release" "prometheus_stack" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  
  values = [
    file("${path.module}/values/prometheus-values.yaml")
  ]
  
  set {
    name  = "prometheus.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.prometheus_irsa_role.iam_role_arn
  }
}

module "prometheus_irsa_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  
  role_name             = "terrafusion-${var.environment}-prometheus"
  attach_cloudwatch_policy = true
  
  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["monitoring:prometheus-kube-prometheus-prometheus"]
    }
  }
}

# Loki for logging
resource "helm_release" "loki_stack" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki-stack"
  namespace  = kubernetes_namespace.monitoring.metadata[0].name
  
  set {
    name  = "grafana.enabled"
    value = "false"  # Using the grafana instance from prometheus stack
  }
  
  set {
    name  = "prometheus.enabled"
    value = "false"  # Using prometheus from prometheus stack
  }
  
  set {
    name  = "loki.persistence.enabled"
    value = "true"
  }
  
  set {
    name  = "loki.persistence.size"
    value = "50Gi"
  }
  
  set {
    name  = "loki.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.loki_irsa_role.iam_role_arn
  }
}

module "loki_irsa_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  
  role_name                  = "terrafusion-${var.environment}-loki"
  attach_cloudwatch_policy   = true
  
  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["monitoring:loki"]
    }
  }
}

# HashiCorp Vault for secrets management
resource "kubernetes_namespace" "vault" {
  metadata {
    name = "vault"
  }
}

resource "helm_release" "vault" {
  name       = "vault"
  repository = "https://helm.releases.hashicorp.com"
  chart      = "vault"
  namespace  = kubernetes_namespace.vault.metadata[0].name
  
  values = [
    file("${path.module}/values/vault-values.yaml")
  ]
}

# API Gateway using Kong
resource "kubernetes_namespace" "api_gateway" {
  metadata {
    name = "api-gateway"
  }
}

resource "helm_release" "kong" {
  name       = "kong"
  repository = "https://charts.konghq.com"
  chart      = "kong"
  namespace  = kubernetes_namespace.api_gateway.metadata[0].name
  
  values = [
    file("${path.module}/values/kong-values.yaml")
  ]
  
  set {
    name  = "ingressController.installCRDs"
    value = "false"  # Already installed via cert-manager
  }
}

# Additional outputs and resources can be added as needed