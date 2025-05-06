output "db_endpoint" {
  description = "The connection endpoint for the PostgreSQL database"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "The name of the PostgreSQL database"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "The master username for the PostgreSQL database"
  value       = aws_db_instance.main.username
}

output "redis_endpoint" {
  description = "The connection endpoint for the Redis instance"
  value       = aws_elasticache_cluster.main.cache_nodes.0.address
}

output "redis_port" {
  description = "The port for the Redis instance"
  value       = aws_elasticache_cluster.main.port
}

output "rds_security_group_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "The ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "rds_kms_key_arn" {
  description = "The ARN of the KMS key used for RDS encryption"
  value       = aws_kms_key.rds.arn
}