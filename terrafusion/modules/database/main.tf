###########################################################
# BCBS Database Module
# This module creates the RDS PostgreSQL and ElastiCache Redis resources
###########################################################

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-db-subnet-group-${var.environment}"
    }
  )
}

# Security Group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.project}-rds-sg-${var.environment}"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = var.vpc_id

  # Allow PostgreSQL from app security group
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-rds-sg-${var.environment}"
    }
  )
}

# KMS Key for database encryption
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-rds-kms-key-${var.environment}"
    }
  )
}

# RDS PostgreSQL Database
resource "aws_db_instance" "main" {
  identifier             = "${var.project}-db-${var.environment}"
  allocated_storage      = var.db_allocated_storage
  storage_type           = var.db_storage_type
  engine                 = "postgres"
  engine_version         = var.db_engine_version
  instance_class         = var.db_instance_class
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  parameter_group_name   = aws_db_parameter_group.main.name
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn
  
  # Backup and maintenance
  backup_retention_period  = var.db_backup_retention_period
  backup_window            = var.db_backup_window
  maintenance_window       = var.db_maintenance_window
  multi_az                 = var.environment == "prod" ? true : false
  skip_final_snapshot      = var.environment == "prod" ? false : true
  final_snapshot_identifier = var.environment == "prod" ? "${var.project}-db-final-snapshot-${var.environment}" : null
  deletion_protection      = var.environment == "prod" ? true : false
  
  # Performance Insights
  performance_insights_enabled          = var.environment == "prod" ? true : false
  performance_insights_retention_period = var.environment == "prod" ? 7 : 0
  performance_insights_kms_key_id       = var.environment == "prod" ? aws_kms_key.rds.arn : null
  
  # Enhanced monitoring
  monitoring_interval = var.environment == "prod" ? 60 : 0
  monitoring_role_arn = var.environment == "prod" ? aws_iam_role.rds_monitoring[0].arn : null
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-db-${var.environment}"
    }
  )
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  name   = "${var.project}-db-pg-${var.environment}"
  family = "postgres15"

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

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-db-pg-${var.environment}"
    }
  )
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_monitoring" {
  count = var.environment == "prod" ? 1 : 0
  
  name = "${var.project}-rds-monitoring-role-${var.environment}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"]
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-rds-monitoring-role-${var.environment}"
    }
  )
}

# ElastiCache Redis subnet group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-redis-subnet-group-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-redis-subnet-group-${var.environment}"
    }
  )
}

# Security Group for Redis
resource "aws_security_group" "redis" {
  name        = "${var.project}-redis-sg-${var.environment}"
  description = "Security group for Redis"
  vpc_id      = var.vpc_id

  # Allow Redis from app security group
  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }

  # Allow all outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-redis-sg-${var.environment}"
    }
  )
}

# Redis Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project}-redis-params-${var.environment}"
  family = "redis7"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-redis-params-${var.environment}"
    }
  )
}

# ElastiCache Redis Cluster
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${var.project}-redis-${var.environment}"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = aws_elasticache_parameter_group.main.name
  engine_version       = var.redis_engine_version
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  
  # Auto backup
  snapshot_retention_limit = var.environment == "prod" ? 7 : 1
  snapshot_window          = var.redis_snapshot_window
  maintenance_window       = var.redis_maintenance_window
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-redis-${var.environment}"
    }
  )
}

# CloudWatch alarms for database monitoring
resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${var.project}-db-high-cpu-${var.environment}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = var.environment == "prod" ? [var.sns_topic_arn] : []
  ok_actions          = var.environment == "prod" ? [var.sns_topic_arn] : []
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-db-high-cpu-${var.environment}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "db_memory" {
  alarm_name          = "${var.project}-db-low-memory-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeableMemory"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "200000000" # 200MB
  alarm_description   = "This metric monitors RDS freeable memory"
  alarm_actions       = var.environment == "prod" ? [var.sns_topic_arn] : []
  ok_actions          = var.environment == "prod" ? [var.sns_topic_arn] : []
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-db-low-memory-${var.environment}"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "db_storage" {
  alarm_name          = "${var.project}-db-low-storage-${var.environment}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "10737418240" # 10GB
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = var.environment == "prod" ? [var.sns_topic_arn] : []
  ok_actions          = var.environment == "prod" ? [var.sns_topic_arn] : []
  
  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
  
  tags = merge(
    var.common_tags,
    {
      Name = "${var.project}-db-low-storage-${var.environment}"
    }
  )
}