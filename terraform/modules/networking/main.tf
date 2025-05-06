/**
 * TerraFusion Networking Module
 * 
 * This module creates networking resources for the TerraFusion application
 * including VPC, subnets, NAT gateway, and security groups.
 */

# Create VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  
  tags = {
    Name        = "${var.environment}-terrafusion-vpc"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name        = "${var.environment}-terrafusion-igw"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create public subnets
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "${var.environment}-terrafusion-public-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
    Tier        = "Public"
  }
}

# Create private subnets
resource "aws_subnet" "private" {
  count                   = length(var.private_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = false
  
  tags = {
    Name        = "${var.environment}-terrafusion-private-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
    Tier        = "Private"
  }
}

# Create database subnets
resource "aws_subnet" "database" {
  count                   = length(var.database_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.database_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index % length(var.availability_zones)]
  map_public_ip_on_launch = false
  
  tags = {
    Name        = "${var.environment}-terrafusion-database-subnet-${count.index + 1}"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
    Tier        = "Database"
  }
}

# Create Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.public_subnet_cidrs)) : 0
  domain = "vpc"
  
  tags = {
    Name        = "${var.environment}-terrafusion-nat-eip-${count.index + 1}"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create NAT Gateway
resource "aws_nat_gateway" "main" {
  count         = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.public_subnet_cidrs)) : 0
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name        = "${var.environment}-terrafusion-nat-gateway-${count.index + 1}"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Create public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-public-route-table"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
    Tier        = "Public"
  }
}

# Create private route tables
resource "aws_route_table" "private" {
  count  = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(var.private_subnet_cidrs)) : 1
  vpc_id = aws_vpc.main.id
  
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = var.single_nat_gateway ? aws_nat_gateway.main[0].id : aws_nat_gateway.main[count.index].id
    }
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-private-route-table-${count.index + 1}"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
    Tier        = "Private"
  }
}

# Create database route table
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name        = "${var.environment}-terrafusion-database-route-table"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
    Tier        = "Database"
  }
}

# Associate public subnets with public route table
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnet_cidrs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with private route tables
resource "aws_route_table_association" "private" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = var.single_nat_gateway ? aws_route_table.private[0].id : aws_route_table.private[min(count.index, length(aws_route_table.private) - 1)].id
}

# Associate database subnets with database route table
resource "aws_route_table_association" "database" {
  count          = length(var.database_subnet_cidrs)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

# Create VPN Gateway if enabled
resource "aws_vpn_gateway" "main" {
  count  = var.enable_vpn_gateway ? 1 : 0
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name        = "${var.environment}-terrafusion-vpn-gateway"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create security group for ALB
resource "aws_security_group" "alb" {
  name        = "${var.environment}-terrafusion-alb-sg"
  description = "Security group for TerraFusion ALB"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from anywhere"
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from anywhere"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-alb-sg"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create security group for application
resource "aws_security_group" "app" {
  name        = "${var.environment}-terrafusion-app-sg"
  description = "Security group for TerraFusion application"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB on port 5000"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-app-sg"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}

# Create security group for database
resource "aws_security_group" "database" {
  name        = "${var.environment}-terrafusion-database-sg"
  description = "Security group for TerraFusion database"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
    description     = "Allow PostgreSQL traffic from application"
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = {
    Name        = "${var.environment}-terrafusion-database-sg"
    Environment = var.environment
    Project     = "TerraFusion"
    ManagedBy   = "Terraform"
  }
}