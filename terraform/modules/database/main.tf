/**
 * TerraFusion Database Module
 * 
 * This module creates RDS PostgreSQL resources for the TerraFusion application
 */

# Create DB subnet group
resource "aws_db_subnet_group" "main" {
  name        = "${var.environment}-terrafusion-db-subnet-group"
  description = "Database subnet group for TerraFusion ${var.environment} environment"
  subnet_ids  = var.subnet_ids
  
  tags = {
    Name        = "${var.environment}-terrafusion-db-subnet-group"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create DB parameter group
resource "aws_db_parameter_group" "main" {
  name        = "${var.environment}-terrafusion-db-param-group"
  family      = "postgres14" # Use appropriate Postgres version family
  description = "Database parameter group for TerraFusion ${var.environment} environment"
  
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
    value = "all"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # Log statements taking more than 1 second
  }
  
  parameter {
    name  = "autovacuum"
    value = "1"
  }
  
  parameter {
    name  = "client_encoding"
    value = "utf8"
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-db-param-group"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create random password for RDS if not provided
resource "random_password" "db_password" {
  count            = var.db_password == "" ? 1 : 0
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# Get actual password to use
locals {
  db_password = var.db_password != "" ? var.db_password : random_password.db_password[0].result
}

# Create AWS Secrets Manager secret for DB credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.environment}-terrafusion-db-credentials"
  description = "Database credentials for TerraFusion ${var.environment} environment"
  kms_key_id  = var.kms_key_arn
  
  tags = {
    Name        = "${var.environment}-terrafusion-db-credentials"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create secret version with DB credentials
resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username      = var.db_username
    password      = local.db_password
    engine        = "postgres"
    host          = aws_db_instance.main.address
    port          = aws_db_instance.main.port
    dbname        = var.db_name
    connection_url = "postgresql://${var.db_username}:${local.db_password}@${aws_db_instance.main.address}:${aws_db_instance.main.port}/${var.db_name}"
  })
  
  depends_on = [aws_db_instance.main]
}

# Create DB instance
resource "aws_db_instance" "main" {
  identifier              = "${var.environment}-terrafusion-db"
  engine                  = "postgres"
  engine_version          = var.engine_version
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  max_allocated_storage   = var.db_max_storage
  storage_type            = "gp3"
  storage_encrypted       = true
  kms_key_id              = var.kms_key_arn
  db_name                 = var.db_name
  username                = var.db_username
  password                = local.db_password
  port                    = 5432
  multi_az                = var.multi_az
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = var.security_group_ids
  parameter_group_name    = aws_db_parameter_group.main.name
  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:30-sun:05:30"
  skip_final_snapshot     = var.environment != "prod"
  final_snapshot_identifier = "${var.environment}-terrafusion-db-final-snapshot"
  deletion_protection     = var.deletion_protection
  apply_immediately       = var.apply_immediately
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot   = true
  publicly_accessible     = false
  performance_insights_enabled = var.enable_performance_insights
  
  lifecycle {
    prevent_destroy = var.environment == "prod"
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-db"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create CloudWatch alarm for high CPU
resource "aws_cloudwatch_metric_alarm" "db_high_cpu" {
  alarm_name          = "${var.environment}-terrafusion-db-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This alarm monitors RDS CPU utilization"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-db-high-cpu"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create CloudWatch alarm for low storage
resource "aws_cloudwatch_metric_alarm" "db_low_storage" {
  alarm_name          = "${var.environment}-terrafusion-db-low-storage"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10240 # 10GB in MB
  alarm_description   = "This alarm monitors RDS free storage space"
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-db-low-storage"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}