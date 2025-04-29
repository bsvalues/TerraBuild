module "network" {
  source = "./modules/network"
  
  environment     = var.environment
  vpc_cidr        = var.vpc_cidr
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "database" {
  source = "./modules/database"
  
  environment          = var.environment
  vpc_id               = module.network.vpc_id
  private_subnet_ids   = module.network.private_subnet_ids
  db_instance_class    = var.db_instance_class
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  db_allocated_storage = var.db_allocated_storage
  
  depends_on = [module.network]
}

# Create an AWS Secrets Manager secret for database connection
resource "aws_secretsmanager_secret" "database_credentials" {
  name        = "${var.environment}/database/credentials"
  description = "Database credentials for the TerraBuild application"
}

resource "aws_secretsmanager_secret_version" "database_credentials" {
  secret_id = aws_secretsmanager_secret.database_credentials.id
  secret_string = jsonencode({
    host     = module.database.database_endpoint
    port     = module.database.database_port
    dbname   = module.database.database_name
    username = module.database.database_username
    password = var.db_password
    connectionString = "postgresql://${module.database.database_username}:${var.db_password}@${replace(module.database.database_endpoint, ":5432", "")}:5432/${module.database.database_name}"
  })
}

# Create a certificate for HTTPS
resource "aws_acm_certificate" "app" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name        = "${var.environment}-terrabuild-certificate"
    Environment = var.environment
  }
}

module "ecs" {
  source = "./modules/ecs"
  
  environment          = var.environment
  aws_region           = var.aws_region
  vpc_id               = module.network.vpc_id
  public_subnet_ids    = module.network.public_subnet_ids
  private_subnet_ids   = module.network.private_subnet_ids
  app_cpu              = var.app_cpu
  app_memory           = var.app_memory
  app_desired_count    = var.app_desired_count
  database_secret_arn  = aws_secretsmanager_secret.database_credentials.arn
  acm_certificate_arn  = aws_acm_certificate.app.arn
  
  depends_on = [module.network, module.database]
}

module "monitoring" {
  source = "./modules/monitoring"
  
  environment          = var.environment
  aws_region           = var.aws_region
  ecs_cluster_id       = module.ecs.ecs_cluster_id
  load_balancer_arn    = module.ecs.load_balancer_arn
  alert_email_addresses = var.alert_email_addresses
  
  depends_on = [module.ecs]
}