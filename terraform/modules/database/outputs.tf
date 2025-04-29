output "database_endpoint" {
  description = "The connection endpoint for the PostgreSQL database"
  value       = aws_db_instance.postgres.endpoint
}

output "database_name" {
  description = "The name of the PostgreSQL database"
  value       = aws_db_instance.postgres.db_name
}

output "database_username" {
  description = "The username for the PostgreSQL database"
  value       = aws_db_instance.postgres.username
}

output "database_port" {
  description = "The port for the PostgreSQL database"
  value       = 5432
}

output "database_security_group_id" {
  description = "The ID of the security group for the PostgreSQL database"
  value       = aws_security_group.database.id
}