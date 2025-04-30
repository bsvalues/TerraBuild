/**
 * # TerraBuild Security Module
 *
 * This module sets up security infrastructure including Web Application Firewall (WAF),
 * security headers, and network protection mechanisms.
 */

# AWS WAF Web ACL
resource "aws_wafv2_web_acl" "main" {
  name        = "${var.app_name}-${var.environment}-web-acl"
  description = "Web ACL for ${var.app_name} application in ${var.environment} environment"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  # AWS Managed Rules - Core rule set
  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 0

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-${var.environment}-AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules - SQL Injection
  rule {
    name     = "AWS-AWSManagedRulesSQLiRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-${var.environment}-AWSManagedRulesSQLiRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 2

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
      metric_name                = "${var.app_name}-${var.environment}-RateLimitRule"
      sampled_requests_enabled   = true
    }
  }

  # Geo-restriction rule (if needed)
  dynamic "rule" {
    for_each = length(var.blocked_countries) > 0 ? [1] : []
    content {
      name     = "GeoRestrictionRule"
      priority = 3

      action {
        block {}
      }

      statement {
        geo_match_statement {
          country_codes = var.blocked_countries
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.app_name}-${var.environment}-GeoRestrictionRule"
        sampled_requests_enabled   = true
      }
    }
  }

  # Block specific IP addresses (if provided)
  dynamic "rule" {
    for_each = length(var.blocked_ip_addresses) > 0 ? [1] : []
    content {
      name     = "BlockedIPsRule"
      priority = 4

      action {
        block {}
      }

      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.blocked_ips[0].arn
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.app_name}-${var.environment}-BlockedIPsRule"
        sampled_requests_enabled   = true
      }
    }
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-web-acl"
    Environment = var.environment
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.app_name}-${var.environment}-web-acl"
    sampled_requests_enabled   = true
  }
}

# IP Set for blocked IP addresses
resource "aws_wafv2_ip_set" "blocked_ips" {
  count = length(var.blocked_ip_addresses) > 0 ? 1 : 0

  name               = "${var.app_name}-${var.environment}-blocked-ips"
  description        = "IP set for blocked IP addresses"
  scope              = "REGIONAL"
  ip_address_version = "IPV4"
  addresses          = var.blocked_ip_addresses

  tags = {
    Name        = "${var.app_name}-${var.environment}-blocked-ips"
    Environment = var.environment
  }
}

# WAF Web ACL Association with ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = var.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# AWS Shield Advanced protection (if enabled)
resource "aws_shield_protection" "alb" {
  count        = var.enable_shield_advanced ? 1 : 0
  name         = "${var.app_name}-${var.environment}-alb-protection"
  resource_arn = var.alb_arn
}

# AWS Security Hub (if enabled)
resource "aws_securityhub_account" "main" {
  count = var.enable_security_hub ? 1 : 0
}

# Security Hub Standards
resource "aws_securityhub_standards_subscription" "aws_best_practices" {
  count         = var.enable_security_hub ? 1 : 0
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/aws-foundational-security-best-practices/v/1.0.0"
}

# GuardDuty (if enabled)
resource "aws_guardduty_detector" "main" {
  count    = var.enable_guardduty ? 1 : 0
  enable   = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
}

# SNS Topic for security notifications
resource "aws_sns_topic" "security_alerts" {
  name = "${var.app_name}-${var.environment}-security-alerts"
}

# SNS Topic Subscriptions
resource "aws_sns_topic_subscription" "security_alerts_email" {
  count     = length(var.security_alert_emails)
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_alert_emails[count.index]
}

# Create EventBridge rules for security alerts
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  count       = var.enable_guardduty ? 1 : 0
  name        = "${var.app_name}-${var.environment}-guardduty-findings"
  description = "Capture GuardDuty findings"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
  })
}

resource "aws_cloudwatch_event_target" "guardduty_findings_to_sns" {
  count     = var.enable_guardduty ? 1 : 0
  rule      = aws_cloudwatch_event_rule.guardduty_findings[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# Allow EventBridge to publish to SNS
resource "aws_sns_topic_policy" "security_alerts" {
  arn    = aws_sns_topic.security_alerts.arn
  policy = data.aws_iam_policy_document.security_alerts_topic_policy.json
}

data "aws_iam_policy_document" "security_alerts_topic_policy" {
  statement {
    sid    = "AllowEventBridgePublishing"
    effect = "Allow"
    
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
    
    actions   = ["sns:Publish"]
    resources = [aws_sns_topic.security_alerts.arn]
  }
}