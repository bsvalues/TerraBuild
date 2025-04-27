# Infrastructure as Code (IaC) for BCBS

This document outlines the Infrastructure as Code (IaC) approach implemented for the Benton County Building Cost System (BCBS) using Terraform.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Terraform Modules](#terraform-modules)
4. [Environment Management](#environment-management)
5. [State Management](#state-management)
6. [CI/CD Integration](#cicd-integration)
7. [Security Considerations](#security-considerations)
8. [Operational Guidelines](#operational-guidelines)
9. [Best Practices](#best-practices)

## Overview

The BCBS infrastructure is managed entirely through code using Terraform, enabling consistent, repeatable, and version-controlled infrastructure deployments across multiple environments. This approach ensures:

- Consistency across environments
- Disaster recovery capabilities
- Documentation as code
- Infrastructure versioning
- Automated deployments
- Reduced configuration drift

## Architecture

The BCBS infrastructure is built on AWS and consists of the following key components:

- **Networking**: VPC, subnets, security groups, NAT gateways
- **Compute**: ECS clusters with Fargate for containerized applications
- **Database**: RDS PostgreSQL for data persistence
- **Load Balancing**: Application Load Balancer for traffic distribution
- **Deployment Strategies**: Blue-Green and Canary deployment capabilities
- **Monitoring**: CloudWatch for metrics, logs, and alarms
- **Serverless**: Lambda functions for operational tasks
- **Storage**: S3 for static content and backups

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            AWS Cloud                                 │
│                                                                     │
│  ┌─────────────┐            ┌─────────────┐      ┌──────────────┐   │
│  │             │            │             │      │              │   │
│  │   Public    │            │   Private   │      │  Database    │   │
│  │   Subnet    │            │   Subnet    │      │  Subnet      │   │
│  │             │            │             │      │              │   │
│  └─────────────┘            └─────────────┘      └──────────────┘   │
│         │                          │                    │           │
│         ▼                          ▼                    ▼           │
│  ┌─────────────┐            ┌─────────────┐      ┌──────────────┐   │
│  │             │            │             │      │              │   │
│  │  Internet   │            │   ECS       │      │   RDS        │   │
│  │  Gateway    │─────┬─────▶│   Cluster   │      │  Database    │   │
│  │             │     │      │             │◀─────│              │   │
│  └─────────────┘     │      └─────────────┘      └──────────────┘   │
│         ▲            │             ▲                                │
│         │            │             │                                │
│         │      ┌─────▼─────┐  ┌────┴────┐                           │
│         │      │           │  │         │                           │
│         └──────┤    ALB    │  │ Lambda  │                           │
│                │           │  │Functions│                           │
│                └───────────┘  └─────────┘                           │
│                      ▲             ▲                                │
│                      │             │                                │
└──────────────────────┼─────────────┼────────────────────────────────┘
                       │             │
                  ┌────┴─────────────┴───┐
                  │                      │
                  │  CI/CD Pipeline      │
                  │                      │
                  └──────────────────────┘
```

## Terraform Modules

The infrastructure is organized into reusable modules:

### Networking Module

Manages the VPC, public/private subnets, and network security:

- VPC with CIDR block
- Public and private subnets across multiple AZs
- Internet Gateway and NAT Gateways
- Route tables and associations
- Network ACLs and security groups

### Database Module

Manages the PostgreSQL database:

- RDS instance with specified instance class
- Multi-AZ deployment for production
- Automated backups and snapshots
- Encryption at rest
- Parameter groups for database configuration
- Security groups for database access

### Deployment Module

Handles the application deployment infrastructure:

- ECS cluster and task definitions
- Target groups and load balancer
- Blue-Green deployment infrastructure
- Canary deployment capabilities
- Auto-scaling configurations
- IAM roles and policies

### Backup Module

Manages backup and disaster recovery:

- AWS Backup plans and selections
- Backup retention policies
- Cross-region replication for production

### Monitoring Module

Sets up monitoring and alerting:

- CloudWatch metrics and dashboards
- Alarms for critical thresholds
- Log groups and subscription filters
- SNS topics for notifications

## Environment Management

We maintain separate environments for different stages of the development lifecycle:

### Development Environment

- Lower resource allocations
- Simplified infrastructure (single NAT Gateway)
- Shorter backup retention
- Non-production data

### Staging Environment

- Mirrors production setup at a smaller scale
- Used for pre-production testing
- Basic disaster recovery capabilities
- Test data resembling production

### Production Environment

- Full high-availability configuration
- Multi-AZ deployments
- Comprehensive monitoring and alerting
- Strict security controls
- Robust backup and disaster recovery

## State Management

Terraform state is managed securely:

- Remote state stored in S3 buckets
- State locking via DynamoDB tables
- Environment-specific state files
- Encrypted state storage
- Limited access to state management

## CI/CD Integration

The Terraform code is fully integrated with our CI/CD pipeline:

1. **Infrastructure Testing**:
   - Automated validation and linting
   - Static security analysis
   - `terraform plan` review

2. **Deployment Process**:
   - PR approval triggers infrastructure changes
   - Automatic application of non-destructive changes
   - Manual approval for destructive changes
   - Post-deployment validation

3. **Workflows**:
   - Environment-specific workflows
   - Scheduled security scans
   - Drift detection

## Security Considerations

Security is built into the infrastructure:

- **Least Privilege**: IAM roles with minimal permissions
- **Network Isolation**: Private subnets for sensitive resources
- **Encryption**: Data encrypted at rest and in transit
- **Secrets Management**: Sensitive values stored in Parameter Store
- **Security Groups**: Restrictive ingress/egress rules
- **Logging**: Comprehensive auditing and monitoring
- **Compliance**: Infrastructure matches compliance requirements

## Operational Guidelines

### Applying Changes

1. **Development**:
   ```bash
   cd terrafusion
   ./terraform-setup.sh dev plan
   ./terraform-setup.sh dev apply
   ```

2. **Staging**:
   ```bash
   cd terrafusion
   ./terraform-setup.sh staging plan
   # Review changes carefully
   ./terraform-setup.sh staging apply
   ```

3. **Production**:
   ```bash
   cd terrafusion
   ./terraform-setup.sh prod plan
   # Mandatory peer review
   # Change window approval
   ./terraform-setup.sh prod apply
   ```

### Managing Modules

1. **Adding New Resources**:
   - Add resource definitions to the appropriate module
   - Update variables and outputs as needed
   - Test in development first

2. **Updating Existing Resources**:
   - Check for potential downtime before applying
   - Consider using `lifecycle` blocks for critical resources
   - Update documentation

## Best Practices

1. **Code Organization**:
   - Use consistent naming conventions
   - Group related resources
   - Comment complex configurations
   - Break large files into logical components

2. **Variables and Outputs**:
   - Define variable types and constraints
   - Provide descriptive variable descriptions
   - Use output values for cross-module references
   - Mark sensitive outputs appropriately

3. **State Management**:
   - Never manipulate state files directly
   - Use `terraform import` for existing resources
   - Lock state during operations
   - Back up state regularly

4. **Security**:
   - Store secrets in AWS Parameter Store or Secrets Manager
   - Regularly rotate credentials
   - Apply security patches promptly
   - Perform regular security audits

5. **Operations**:
   - Document manual procedures
   - Create runbooks for common tasks
   - Monitor infrastructure costs
   - Use tagging for resource organization

6. **Team Workflow**:
   - Peer review all infrastructure changes
   - Use feature branches
   - Document significant changes
   - Maintain an infrastructure change log