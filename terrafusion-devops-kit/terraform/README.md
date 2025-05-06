# TerraFusion Infrastructure as Code

This directory contains the Terraform configuration for the TerraFusion platform infrastructure. It defines all AWS resources needed to run the platform, including the EKS cluster, RDS database, ECR repositories, and more.

## 📝 Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform v1.4+ installed
- S3 buckets for Terraform state (see environments/*.tfbackend)
- DynamoDB tables for state locking (see environments/*.tfbackend)

## 🚀 Getting Started

### Initializing Terraform

Choose the environment you want to work with (dev, staging, or prod) and initialize Terraform with the corresponding backend configuration:

```bash
# For development environment
terraform init -backend-config=environments/dev.tfbackend

# For production environment
terraform init -backend-config=environments/prod.tfbackend
```

### Setting Up the Workspace

Terraform workspaces are used to manage different environments:

```bash
# List available workspaces
terraform workspace list

# Select or create the workspace for your environment
terraform workspace select dev || terraform workspace new dev
terraform workspace select prod || terraform workspace new prod
```

### Planning Changes

Before applying changes, review what Terraform plans to do:

```bash
# For development environment
terraform plan -var-file=environments/dev.tfvars -out=tfplan

# For production environment
terraform plan -var-file=environments/prod.tfvars -out=tfplan
```

### Applying Changes

Apply the planned changes to create or update the infrastructure:

```bash
terraform apply tfplan
```

### Destroying Infrastructure

⚠️ **CAUTION**: This will destroy all resources managed by Terraform. Use with care, especially in production.

```bash
# For development environment
terraform destroy -var-file=environments/dev.tfvars

# For production environment
terraform destroy -var-file=environments/prod.tfvars
```

## 📁 Directory Structure

- `main.tf`: Main Terraform configuration file defining all resources
- `variables.tf`: Variable definitions with descriptions and defaults
- `outputs.tf`: Output values that can be used by other Terraform configurations or scripts
- `environments/`: Environment-specific configuration files
  - `dev.tfvars`: Variable values for the development environment
  - `prod.tfvars`: Variable values for the production environment
  - `dev.tfbackend`: Backend configuration for the development environment
  - `prod.tfbackend`: Backend configuration for the production environment

## 🏗️ Resources Created

The Terraform configuration creates the following resources:

- **VPC**: Virtual Private Cloud with public, private, and database subnets
- **EKS**: Kubernetes cluster with multiple node groups for different workloads
- **RDS**: PostgreSQL database for application data
- **ECR**: Container registry for Docker images
- **IAM**: Roles and policies for EKS service accounts
- **S3**: Buckets for logs and data
- **CloudWatch**: Log groups for monitoring
- **KMS**: Encryption keys for securing data

## 🔧 Customizing

To customize the infrastructure for your specific needs, modify the `.tfvars` files in the `environments` directory. Each variable is documented in `variables.tf` with a description of its purpose and default value.

## 🛡️ Security Considerations

- Terraform state contains sensitive information. Always store it in a secure, encrypted S3 bucket.
- Use IAM roles with the principle of least privilege.
- Encrypt all sensitive data at rest (RDS, EKS secrets, etc.).
- Regularly rotate credentials and encryption keys.
- Enable CloudTrail for auditing all AWS API calls.

## 🌐 Networking

The VPC is configured with the following:

- Public subnets for load balancers
- Private subnets for application workloads
- Database subnets for RDS instances
- NAT Gateways for private subnet internet access

## 📊 Monitoring and Logging

CloudWatch is used for centralized logging and monitoring. Log groups are created for:

- EKS cluster logs
- Application logs
- Agent-specific logs

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)