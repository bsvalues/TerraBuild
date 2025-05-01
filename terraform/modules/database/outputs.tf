output "db_instance_id" {
  description = "ID of the RDS instance"
  value       = aws_db_instance.postgres.id
}

output "db_instance_address" {
  description = "Address of the RDS instance"
  value       = aws_db_instance.postgres.address
}

output "db_instance_endpoint" {
  description = "Endpoint of the RDS instance"
  value       = aws_db_instance.postgres.endpoint
}

output "db_instance_port" {
  description = "Port of the RDS instance"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Name of the database"
  value       = aws_db_instance.postgres.db_name
}

output "db_secret_arn" {
  description = "ARN of the secret containing database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "connection_url" {
  description = "PostgreSQL connection URL"
  value       = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
  sensitive   = true
}