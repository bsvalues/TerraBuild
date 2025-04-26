###########################################################
# BCBS Infrastructure as Code - Terraform Root Module
# This file integrates all modules into a complete infrastructure
###########################################################

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.33.0"
    }
  }

  backend "s3" {
    # These values will be provided during terraform init
    # bucket         = "bcbs-terraform-state"
    # key            = "state/terraform.tfstate"
    # region         = "us-west-2"
    # dynamodb_table = "bcbs-terraform-locks"
    # encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = local.common_tags
  }
}

# Common tags to be applied to all resources
locals {
  common_tags = {
    Environment = var.environment
    Project     = var.project
    ManagedBy   = "Terraform"
    Owner       = "DevOps"
  }
}

# SNS Topic for alerting
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts-${var.environment}"
  
  tags = {
    Name = "${var.project}-alerts-${var.environment}"
  }
}

# Networking module
module "networking" {
  source = "./modules/networking"

  vpc_cidr            = var.vpc_cidr
  public_subnets_cidr = var.public_subnets_cidr
  private_subnets_cidr = var.private_subnets_cidr
  availability_zones   = var.availability_zones
  environment          = var.environment
  project              = var.project
  common_tags          = local.common_tags
}

# Security Group for the Application
resource "aws_security_group" "app_sg" {
  name        = "${var.project}-app-sg-${var.environment}"
  description = "Security group for application servers"
  vpc_id      = module.networking.vpc_id

  # Allow HTTP from ALB
  ingress {
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project}-app-sg-${var.environment}"
  }
}

# Security Group for the ALB
resource "aws_security_group" "alb_sg" {
  name        = "${var.project}-alb-sg-${var.environment}"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.networking.vpc_id

  # Allow HTTP from anywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS from anywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow test port from anywhere
  ingress {
    from_port   = 8443
    to_port     = 8443
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
    Name = "${var.project}-alb-sg-${var.environment}"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = module.networking.public_subnet_ids

  enable_deletion_protection = var.environment == "prod" ? true : false

  tags = {
    Name = "${var.project}-alb-${var.environment}"
  }
}

# HTTP to HTTPS redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name = "${var.project}-http-listener-${var.environment}"
  }
}

# Database module
module "database" {
  source = "./modules/database"

  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  app_security_group_id = aws_security_group.app_sg.id
  environment           = var.environment
  project               = var.project
  common_tags           = local.common_tags
  
  # Database parameters
  db_name                 = var.db_name
  db_username             = var.db_username
  db_password             = var.db_password
  db_allocated_storage    = var.db_allocated_storage
  db_storage_type         = var.db_storage_type
  db_engine_version       = var.db_engine_version
  db_instance_class       = var.db_instance_class
  db_backup_retention_period = var.db_backup_retention_period
  db_backup_window        = var.db_backup_window
  db_maintenance_window   = var.db_maintenance_window
  
  # Redis parameters
  redis_node_type         = var.redis_node_type
  redis_engine_version    = var.redis_engine_version
  redis_snapshot_window   = var.redis_snapshot_window
  redis_maintenance_window = var.redis_maintenance_window
  
  # Alerting
  sns_topic_arn           = aws_sns_topic.alerts.arn
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project}-cluster-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project}-cluster-${var.environment}"
  }
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_execution_role" {
  name = "${var.project}-ecs-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  ]

  tags = {
    Name = "${var.project}-ecs-execution-role-${var.environment}"
  }
}

# IAM Role for ECS Task
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project}-ecs-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  inline_policy {
    name = "bcbs-app-permissions"

    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Effect = "Allow"
          Action = [
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ]
          Resource = "*"
        }
      ]
    })
  }

  tags = {
    Name = "${var.project}-ecs-task-role-${var.environment}"
  }
}

# CloudWatch Log Group for ECS
resource "aws_cloudwatch_log_group" "ecs_logs" {
  name              = "/ecs/${var.project}-${var.environment}"
  retention_in_days = var.environment == "prod" ? 30 : 14

  tags = {
    Name = "${var.project}-logs-${var.environment}"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = "${var.project}-task-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.app_cpu
  memory                   = var.app_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "${var.project}-container"
      image     = "${var.ecr_repository_url}:${var.image_tag}"
      essential = true
      
      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${var.db_username}:${var.db_password}@${module.database.db_endpoint}/${var.db_name}"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${module.database.redis_endpoint}:${module.database.redis_port}"
        },
        {
          name  = "DEPLOYMENT_ID"
          value = var.deployment_id
        },
        {
          name  = "DEPLOYMENT_COLOR"
          value = var.active_environment
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_logs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = var.active_environment
        }
      }
    }
  ])

  tags = {
    Name  = "${var.project}-task-${var.environment}"
    Color = var.active_environment
  }
}

# Route 53 record for the application
resource "aws_route53_record" "app" {
  count   = var.hosted_zone_id != "" ? 1 : 0
  
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Deployment module - handles Blue-Green and Canary deployments
module "deployment" {
  source = "./modules/deployment"

  vpc_id              = module.networking.vpc_id
  private_subnet_ids  = module.networking.private_subnet_ids
  app_security_group_id = aws_security_group.app_sg.id
  environment         = var.environment
  project             = var.project
  common_tags         = local.common_tags
  
  # Deployment parameters
  active_environment  = var.active_environment
  task_definition_arn = aws_ecs_task_definition.app.arn
  ecs_cluster_id      = aws_ecs_cluster.main.id
  ecs_cluster_name    = aws_ecs_cluster.main.name
  container_port      = var.container_port
  alb_arn             = aws_lb.main.arn
  alb_arn_suffix      = aws_lb.main.arn_suffix
  certificate_arn     = var.certificate_arn
  app_count           = var.app_count
  health_check_path   = var.health_check_path
  sns_topic_arn       = aws_sns_topic.alerts.arn
  
  # Lambda packages
  rollback_lambda_zip = var.rollback_lambda_zip
  canary_lambda_zip   = var.canary_lambda_zip
}

# CloudWatch Dashboard for overall application monitoring
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "HTTP 5XX Errors"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.main.arn_suffix]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "Request Count"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${var.project}-db-${var.environment}"]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "RDS CPU Utilization"
          period  = 300
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", module.deployment.blue_service_name, "ClusterName", aws_ecs_cluster.main.name],
            ["AWS/ECS", "CPUUtilization", "ServiceName", module.deployment.green_service_name, "ClusterName", aws_ecs_cluster.main.name]
          ]
          view    = "timeSeries"
          stacked = false
          title   = "ECS CPU Utilization"
          period  = 300
        }
      }
    ]
  })

  tags = {
    Name = "${var.project}-dashboard-${var.environment}"
  }
}