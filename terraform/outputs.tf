output "vpc_id" {
  description = "ID of the VPC"
  value       = module.network.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = module.network.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = module.network.private_subnet_ids
}

output "database_endpoint" {
  description = "The connection endpoint for the PostgreSQL database"
  value       = module.database.database_endpoint
}

output "database_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret containing database credentials"
  value       = aws_secretsmanager_secret.database_credentials.arn
}