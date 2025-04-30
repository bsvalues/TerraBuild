output "web_acl_id" {
  description = "ID of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.id
}

output "web_acl_arn" {
  description = "ARN of the WAF Web ACL"
  value       = aws_wafv2_web_acl.main.arn
}

output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "guardduty_detector_id" {
  description = "ID of the GuardDuty detector"
  value       = var.enable_guardduty ? aws_guardduty_detector.main[0].id : null
}

output "shield_protection_id" {
  description = "ID of the Shield protection"
  value       = var.enable_shield_advanced ? aws_shield_protection.alb[0].id : null
}

output "waf_metrics" {
  description = "List of WAF CloudWatch metric names"
  value = [
    "${var.app_name}-${var.environment}-web-acl",
    "${var.app_name}-${var.environment}-AWSManagedRulesCommonRuleSet",
    "${var.app_name}-${var.environment}-AWSManagedRulesSQLiRuleSet",
    "${var.app_name}-${var.environment}-RateLimitRule"
  ]
}