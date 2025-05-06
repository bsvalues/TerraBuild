# TerraFusion Database Module
# This module creates the PostgreSQL RDS instance and related resources

# Random password for DB if not provided
resource "random_password" "db_password" {
  count   = var.db_password == "" ? 1 : 0
  length  = 16
  special = false
}

locals {
  db_password = var.db_password == "" ? random_password.db_password[0].result : var.db_password
}

# Create DB subnet group
resource "aws_db_subnet_group" "main" {
  name       = "terrafusion-${var.environment}"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "TerraFusion DB Subnet Group - ${var.environment}"
    Environment = var.environment
  }
}

# Create DB parameter group
resource "aws_db_parameter_group" "main" {
  name   = "terrafusion-postgres-${var.environment}"
  family = "postgres14"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  tags = {
    Name        = "TerraFusion DB Parameter Group - ${var.environment}"
    Environment = var.environment
  }
}

# Store DB credentials in AWS Secrets Manager
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "terrafusion/db-credentials-${var.environment}"
  description = "TerraFusion database credentials for ${var.environment} environment"
  kms_key_id  = var.kms_key_arn

  tags = {
    Name        = "TerraFusion DB Credentials - ${var.environment}"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username             = var.db_username
    password             = local.db_password
    engine               = "postgres"
    host                 = aws_db_instance.main.address
    port                 = aws_db_instance.main.port
    dbname               = var.db_name
    dbInstanceIdentifier = aws_db_instance.main.id
  })
}

# Create DB instance
resource "aws_db_instance" "main" {
  identifier           = "terrafusion-${var.environment}"
  engine               = "postgres"
  engine_version       = var.engine_version
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  max_allocated_storage = var.db_max_storage
  storage_type         = "gp3"
  storage_encrypted    = true
  kms_key_id           = var.kms_key_arn
  username             = var.db_username
  password             = local.db_password
  db_name              = var.db_name
  parameter_group_name = aws_db_parameter_group.main.name
  db_subnet_group_name = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids
  multi_az             = var.multi_az
  publicly_accessible  = false
  skip_final_snapshot  = var.environment != "prod"
  deletion_protection  = var.deletion_protection
  apply_immediately    = var.apply_immediately
  backup_retention_period = var.backup_retention_period
  backup_window        = "03:00-06:00"
  maintenance_window   = "sun:06:00-sun:09:00"
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled = var.enable_performance_insights
  
  tags = {
    Name        = "TerraFusion Database - ${var.environment}"
    Environment = var.environment
  }

  lifecycle {
    prevent_destroy = var.environment == "prod"
  }
}

# Create CloudWatch alarms for the database
resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "terrafusion-db-cpu-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = []  # Add SNS topic ARN as needed
  ok_actions          = []  # Add SNS topic ARN as needed
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "TerraFusion DB CPU Alarm - ${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "db_memory" {
  alarm_name          = "terrafusion-db-memory-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "100000000"  # 100MB in bytes
  alarm_description   = "This metric monitors RDS freeable memory"
  alarm_actions       = []  # Add SNS topic ARN as needed
  ok_actions          = []  # Add SNS topic ARN as needed
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "TerraFusion DB Memory Alarm - ${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_metric_alarm" "db_storage" {
  alarm_name          = "terrafusion-db-storage-high-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "5000000000"  # 5GB in bytes
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = []  # Add SNS topic ARN as needed
  ok_actions          = []  # Add SNS topic ARN as needed
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }

  tags = {
    Name        = "TerraFusion DB Storage Alarm - ${var.environment}"
    Environment = var.environment
  }
}

# Create an event subscription for DB instance events
resource "aws_db_event_subscription" "main" {
  name      = "terrafusion-db-events-${var.environment}"
  sns_topic_arn = ""  # Add SNS topic ARN as needed
  source_type = "db-instance"
  source_ids  = [aws_db_instance.main.id]
  
  event_categories = [
    "availability",
    "backup",
    "configuration change",
    "deletion",
    "failover",
    "failure",
    "maintenance",
    "notification",
    "recovery",
    "restoration"
  ]

  enabled = false  # Set to true when SNS topic is provided
  
  tags = {
    Name        = "TerraFusion DB Event Subscription - ${var.environment}"
    Environment = var.environment
  }
}