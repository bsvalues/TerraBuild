# Blue-Green and Canary Deployment Strategies

This document provides a comprehensive guide to the Blue-Green and Canary deployment strategies implemented for the Benton County Building Cost System (BCBS) application.

## Table of Contents

1. [Overview](#overview)
2. [Deployment Architecture](#deployment-architecture)
3. [Blue-Green Deployment](#blue-green-deployment)
   - [How It Works](#how-blue-green-works)
   - [Implementation](#blue-green-implementation)
   - [Usage Guide](#blue-green-usage)
   - [Rollback Procedures](#blue-green-rollback)
4. [Canary Deployment](#canary-deployment)
   - [How It Works](#how-canary-works)
   - [Implementation](#canary-implementation)
   - [Usage Guide](#canary-usage)
   - [Monitoring During Deployment](#canary-monitoring)
   - [Rollback Procedures](#canary-rollback)
5. [Deployment Metrics](#deployment-metrics)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Overview

Zero-downtime deployments are critical for maintaining service availability while releasing new versions of the application. The BCBS application uses two complementary deployment strategies:

1. **Blue-Green Deployment**: A strategy where two identical environments (blue and green) are maintained, with only one active at a time. This provides a simple and reliable way to switch between versions with minimal risk.

2. **Canary Deployment**: A more gradual approach where a small percentage of traffic is directed to the new version initially, slowly increasing over time as confidence in the new version grows.

These strategies, combined with automated health checks and rollback mechanisms, ensure high availability and reliability during deployments.

## Deployment Architecture

The BCBS deployment architecture consists of:

- **AWS ECS** for container orchestration
- **Application Load Balancers (ALB)** for traffic routing
- **Target Groups** for organizing application instances
- **CloudWatch** for metrics and monitoring
- **Terraform** for infrastructure as code

The architecture is designed to support both Blue-Green and Canary deployment strategies with minimal configuration changes.

### Key Components

1. **Blue and Green Environments**: Two separate but identical environments, each with its own ECS services and target groups.
2. **Load Balancer**: An ALB that routes traffic between the environments based on rules.
3. **Test Listener**: A separate ALB listener for testing new deployments before routing production traffic.
4. **Health Checks**: Automated checks to verify the health of new deployments.
5. **Rollback Automation**: Scripts to automate rollback procedures if issues are detected.

## Blue-Green Deployment

<a name="how-blue-green-works"></a>
### How It Works

Blue-Green deployment operates by maintaining two identical environments (blue and green), with only one environment active and serving production traffic at any time.

The deployment process follows these steps:

1. **Preparation**: The inactive environment is prepared for deployment.
2. **Deployment**: The new version is deployed to the inactive environment.
3. **Testing**: Automated tests verify the new version's functionality.
4. **Switch**: Traffic is switched from the active to the inactive environment.
5. **Verification**: The new active environment is monitored for issues.
6. **Rollback**: If issues are detected, traffic is switched back to the previous environment.

![Blue-Green Deployment](https://raw.githubusercontent.com/aws-samples/ecs-blue-green-deployment/master/images/ecs-blue-green-deployment.png)

<a name="blue-green-implementation"></a>
### Implementation

Our implementation uses:

- **Terraform**: For infrastructure provisioning and management
- **AWS Application Load Balancer**: For traffic routing between blue and green environments
- **Target Groups**: Separate target groups for blue and green environments
- **ECS Services**: Separate services for each environment
- **CloudWatch Alarms**: For automated rollback triggers

The key components are defined in the `terrafusion/blue_green.tf` Terraform file, which creates:

- Two ECS services (blue and green)
- Two target groups
- An Application Load Balancer
- CloudWatch alarms for error rate monitoring
- IAM roles and policies for ECS task execution

<a name="blue-green-usage"></a>
### Usage Guide

To perform a Blue-Green deployment:

1. **Identify current active environment**:
   ```bash
   terraform output active_environment
   ```

2. **Deploy new version**:
   ```bash
   # Using the automated script
   node scripts/blue_green_deploy.js --image-tag=v1.2.3
   
   # Or manually with Terraform
   terraform apply -var="target_environment=green" -var="image_tag=v1.2.3"
   ```

3. **Test the deployment**:
   Access the test endpoint to verify the new version:
   ```
   https://app.example.com:8443/
   ```

4. **Switch traffic** (if using manual approach):
   ```bash
   terraform apply -var="active_environment=green"
   ```

5. **Monitor** the new environment for issues.

<a name="blue-green-rollback"></a>
### Rollback Procedures

Rollback can be triggered automatically by CloudWatch alarms or manually:

**Automatic Rollback**:
- Triggered when error rate exceeds threshold
- Or when health checks fail

**Manual Rollback**:
```bash
# Using the automated script
node scripts/blue_green_deploy.js --force-rollback

# Or manually with Terraform
terraform apply -var="active_environment=blue" # Assuming blue was previously active
```

## Canary Deployment

<a name="how-canary-works"></a>
### How It Works

Canary deployment gradually shifts traffic from the current version to the new version, allowing for early detection of issues before they affect all users.

The process works as follows:

1. **Initial Deployment**: Deploy the new version alongside the current version.
2. **Initial Traffic Shift**: Direct a small percentage (e.g., 5%) of traffic to the new version.
3. **Monitoring**: Monitor performance and error metrics of the new version.
4. **Gradual Increase**: If metrics remain healthy, gradually increase traffic to the new version.
5. **Full Deployment**: Eventually, 100% of traffic is directed to the new version.
6. **Rollback**: If issues are detected at any point, traffic is immediately shifted back to the current version.

![Canary Deployment](https://d1.awsstatic.com/product-marketing/CodeDeploy/CanaryDeployment.79c3c228404f99c5518b6c95fb54a7b5d7d48e7a.png)

<a name="canary-implementation"></a>
### Implementation

Our implementation uses:

- **AWS Application Load Balancer**: For weighted traffic routing between versions
- **Target Groups**: Separate target groups for current and new versions
- **CloudWatch Metrics**: For monitoring error rates and latency
- **Automated Scripts**: For controlling traffic distribution and monitoring

The canary deployment process is implemented in the `scripts/canary_deploy.js` script, which:

1. Creates a new target group for the canary deployment
2. Deploys the new version to a separate ECS service
3. Gradually shifts traffic using ALB weighted target groups
4. Monitors error rates and latency
5. Automatically rolls back if issues are detected

<a name="canary-usage"></a>
### Usage Guide

To perform a Canary deployment:

1. **Start Canary Deployment**:
   ```bash
   node scripts/canary_deploy.js --image-tag=v1.2.3 --initial-percent=5 --increment=10 --interval=15
   ```

   Parameters:
   - `image-tag`: The Docker image tag to deploy
   - `initial-percent`: Initial percentage of traffic to direct to the new version
   - `increment`: Percentage points to increase in each step
   - `interval`: Minutes between traffic percentage increases

2. **Monitor the Deployment**:
   The script automatically collects and displays metrics during the deployment.

3. **Verify Completion**:
   Once the deployment reaches 100%, the script finalizes the deployment by:
   - Updating the production service to use the new task definition
   - Deleting the canary service and target group
   - Restoring traffic routing to the standard configuration

<a name="canary-monitoring"></a>
### Monitoring During Deployment

During canary deployments, we monitor several key metrics:

1. **Error Rates**:
   - HTTP 5xx errors from both current and canary versions
   - Compared against thresholds and between versions

2. **Latency**:
   - P95 response times from both versions
   - Compared against thresholds and between versions

3. **Custom Application Metrics**:
   - Application-specific metrics from the `/api/metrics` endpoint

These metrics are collected and evaluated before each traffic percentage increase.

<a name="canary-rollback"></a>
### Rollback Procedures

Rollback is triggered automatically if:

- Error rate exceeds the configured threshold
- Latency exceeds the configured threshold
- Error rate or latency is significantly higher than the current version

To manually abort a canary deployment:

```bash
node scripts/canary_deploy.js --abort-deployment
```

## Deployment Metrics

We collect and analyze several metrics to evaluate deployment success:

1. **Deployment Duration**: Time taken for the complete deployment
2. **Error Rates**: Pre, during, and post-deployment
3. **Latency**: Pre, during, and post-deployment
4. **Rollback Frequency**: How often deployments require rollback
5. **DORA Metrics**:
   - Deployment Frequency
   - Lead Time for Changes
   - Mean Time to Restore (MTTR)
   - Change Failure Rate

These metrics are collected using the `scripts/collect-dora-metrics.js` script and can be viewed in deployment reports.

## Best Practices

1. **Start with Small Changes**: Begin with non-critical changes to build confidence in the deployment process.

2. **Automate Everything**: Ensure all deployment steps are automated to avoid human error.

3. **Define Clear Success Criteria**: Establish metrics and thresholds for successful deployments.

4. **Test Everything**: Run comprehensive tests before deploying to production.

5. **Monitor Closely**: Watch metrics closely during and after deployment.

6. **Have a Rollback Plan**: Always be prepared to roll back if issues arise.

7. **Document Everything**: Keep detailed records of deployments, issues, and resolutions.

8. **Review and Improve**: Regularly review deployment metrics and processes for improvement.

## Troubleshooting

### Common Issues and Solutions

1. **Health Check Failures**:
   - **Issue**: New version fails health checks in the target group.
   - **Solution**: Verify application is running correctly and health check settings are appropriate.

2. **Traffic Not Shifting**:
   - **Issue**: Traffic is not being routed to the new version.
   - **Solution**: Check ALB listener rules and target group settings.

3. **High Error Rates After Deployment**:
   - **Issue**: Error rates increase after deployment.
   - **Solution**: Compare error logs between versions, check for configuration issues.

4. **Partial Rollback**:
   - **Issue**: Rollback completes but some components remain in the new version.
   - **Solution**: Manually verify all components and force a complete rollback if needed.

5. **Deployment Timing Out**:
   - **Issue**: Deployment script times out waiting for stability.
   - **Solution**: Check ECS service events, increase timeout settings.

### Getting Help

If you encounter issues not covered in this guide:

1. Check the deployment logs in `deployment-reports/`
2. Review CloudWatch logs for the ECS services
3. Check ALB access logs for routing issues
4. Contact the DevOps team for assistance

## Conclusion

Blue-Green and Canary deployment strategies provide powerful tools for achieving zero-downtime deployments and reducing the risk associated with releasing new versions. By following the guidelines in this document, you can ensure reliable and safe deployments for the BCBS application.