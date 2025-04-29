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
  })
}