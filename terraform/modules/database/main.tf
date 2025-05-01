/**
 * TerraFusion Database Module
 * 
 * This module provisions an RDS PostgreSQL database for TerraFusion
 */

# Create AWS Secrets Manager secret for database credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.environment}-terrafusion-db-credentials"
  description = "Database credentials for TerraFusion ${var.environment} environment"
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    dbname   = "terrafusion"
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
  })
}

# Create RDS Parameter Group
resource "aws_db_parameter_group" "postgres" {
  name        = "${var.environment}-terrafusion-postgres-params"
  family      = "postgres14"
  description = "Parameter group for TerraFusion ${var.environment} PostgreSQL database"
  
  parameter {
    name  = "log_statement"
    value = var.environment == "prod" ? "none" : "ddl"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = var.environment == "prod" ? "1000" : "500"
  }
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create RDS Instance
resource "aws_db_instance" "postgres" {
  identifier                  = "${var.environment}-terrafusion-db"
  engine                      = "postgres"
  engine_version              = "14.5"
  instance_class              = var.db_instance_class
  allocated_storage           = var.db_allocated_storage
  max_allocated_storage       = var.db_max_allocated_storage
  storage_type                = "gp3"
  storage_encrypted           = true
  kms_key_id                  = var.kms_key_id
  
  db_name                     = "terrafusion"
  username                    = var.db_username
  password                    = var.db_password
  port                        = 5432
  
  multi_az                    = var.multi_az
  db_subnet_group_name        = var.db_subnet_group_name
  vpc_security_group_ids      = [var.db_security_group_id]
  parameter_group_name        = aws_db_parameter_group.postgres.name
  
  backup_retention_period     = var.backup_retention_period
  backup_window               = "03:00-06:00"
  maintenance_window          = "Mon:00:00-Mon:03:00"
  
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false
  apply_immediately           = var.environment != "prod"
  skip_final_snapshot         = var.environment != "prod"
  final_snapshot_identifier   = "${var.environment}-terrafusion-final-snapshot"
  deletion_protection         = var.environment == "prod"
  
  performance_insights_enabled          = var.environment == "prod"
  performance_insights_retention_period = var.environment == "prod" ? 7 : 0
  
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring_role.arn
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
  
  lifecycle {
    prevent_destroy = var.environment == "prod"
  }
}

# Create IAM role for RDS enhanced monitoring
resource "aws_iam_role" "rds_monitoring_role" {
  name = "${var.environment}-terrafusion-rds-monitoring-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = {
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Attach policy for RDS enhanced monitoring
resource "aws_iam_role_policy_attachment" "rds_monitoring_attachment" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}