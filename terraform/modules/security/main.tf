/**
 * TerraFusion Security Module
 * 
 * This module provides security-related resources like KMS keys and WAF configurations
 */

# Create KMS key for encryption
resource "aws_kms_key" "main" {
  description             = "KMS key for TerraFusion ${var.environment} environment"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow RDS Service"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow ECS Service"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
      }
    ]
  })
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create alias for the KMS key
resource "aws_kms_alias" "main" {
  name          = "alias/${var.environment}-terrafusion-key"
  target_key_id = aws_kms_key.main.key_id
}

# Create AWS WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.environment}-terrafusion-waf"
  description = "WAF for TerraFusion ${var.environment} environment"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # SQL Injection Protection
  rule {
    name     = "SQLiRule"
    priority = 1
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRule"
      sampled_requests_enabled   = true
    }
  }
  
  # Core Rule Set
  rule {
    name     = "CoreRuleSet"
    priority = 2
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
        
        excluded_rule {
          name = "SizeRestrictions_BODY"
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CoreRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  # Rate Limiting
  rule {
    name     = "RateLimitRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 3000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  # IP Reputation List
  rule {
    name     = "BadIPsRule"
    priority = 4
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BadIPsRule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.environment}-terrafusion-waf"
    sampled_requests_enabled   = true
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create AWS Secrets Manager secret for application secrets
resource "aws_secretsmanager_secret" "app_secrets" {
  name        = "${var.environment}-terrafusion-app-secrets"
  description = "Application secrets for TerraFusion ${var.environment} environment"
  kms_key_id  = aws_kms_key.main.arn
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  secret_string = jsonencode({
    OPENAI_API_KEY           = var.openai_api_key
    # Add other secrets as needed
  })
}

# Data sources
data "aws_caller_identity" "current" {}