# Advanced Deployment Strategies

This guide explains advanced deployment strategies implemented in the Benton County Building Cost System (BCBS) project, including blue-green deployments, canary releases, and feature flags.

## Overview

Traditional deployments involve replacing the old version of an application with a new one, which can lead to downtime and risk. Advanced deployment strategies reduce these risks by:

- Deploying without downtime
- Testing in production-like environments
- Gradually rolling out changes
- Enabling quick rollbacks
- Validating changes with real users

## Blue-Green Deployments

### What is Blue-Green Deployment?

Blue-green deployment is a technique that reduces downtime and risk by running two identical production environments called Blue and Green.

At any time, only one of the environments is live, serving all production traffic. The other environment remains idle.

### How It Works

1. **Blue Environment**: The currently active production environment
2. **Green Environment**: The new environment with the updated version

When deploying:

1. Deploy the new version to the idle environment (Green)
2. Test the Green environment thoroughly
3. Switch traffic from Blue to Green (typically by updating a load balancer)
4. Green becomes the new production environment
5. Blue becomes idle and available for the next update

### Implementation in BCBS

Blue-green deployments are implemented through our Terraform infrastructure and AWS services:

```hcl
# In terrafusion/modules/blue-green/main.tf

resource "aws_lb_target_group" "blue" {
  name     = "${var.name}-blue"
  port     = var.container_port
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  
  health_check {
    path = "/api/health/liveness"
    interval = 30
    timeout = 5
    healthy_threshold = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_target_group" "green" {
  name     = "${var.name}-green"
  port     = var.container_port
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  
  health_check {
    path = "/api/health/liveness"
    interval = 30
    timeout = 5
    healthy_threshold = 2
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener_rule" "blue_green" {
  listener_arn = var.lb_listener_arn
  priority     = 100
  
  action {
    type             = "forward"
    target_group_arn = var.active_environment == "blue" ? aws_lb_target_group.blue.arn : aws_lb_target_group.green.arn
  }
  
  condition {
    path_pattern {
      values = ["/*"]
    }
  }
}
```

### Switching Between Blue and Green

To switch from Blue to Green:

```bash
# Assuming 'blue' is currently active
./scripts/terraform-cmd.sh staging apply -var="active_environment=green"
```

To roll back to Blue:

```bash
./scripts/terraform-cmd.sh staging apply -var="active_environment=blue"
```

## Canary Releases

### What is a Canary Release?

A canary release is a technique that reduces the risk of introducing a new software version in production by gradually rolling out the change to a small subset of users before rolling it out to the entire infrastructure.

### How It Works

1. Deploy the new version alongside the old version
2. Route a small percentage of traffic to the new version
3. Monitor for any issues
4. Gradually increase traffic to the new version
5. If issues occur, route all traffic back to the old version

### Implementation in BCBS

Canary releases are implemented in our deployment workflow:

```yaml
# In .github/workflows/deploy.yml

canary-deployment:
  name: Canary Deployment
  runs-on: ubuntu-latest
  needs: [prepare-deployment, deploy-staging]
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ secrets.AWS_REGION }}
    
    - name: Canary Deployment (10% Traffic)
      run: |
        echo "Starting canary deployment with 10% traffic to new version"
        # In a real scenario, this would call AWS CLI to update a Lambda function, 
        # ECS service, or K8s deployment to direct 10% of traffic to the new version
        
        echo "Monitoring canary deployment metrics..."
        # This would check error rates, latency, etc. for the canary deployment
        
        echo "Canary deployment successful, increasing to 100% traffic"
        # This would update the traffic split to 100% for the new version
```

### Manual Canary Deployment

To manually perform a canary deployment:

```bash
# Start with 10% traffic to the new version
./scripts/deploy.sh staging --canary=10

# Increase to 50% traffic
./scripts/deploy.sh staging --canary=50

# Complete the rollout (100% traffic)
./scripts/deploy.sh staging --canary=100

# Roll back if needed
./scripts/deploy.sh staging --rollback
```

## Feature Flags

### What are Feature Flags?

Feature flags (also called feature toggles) are a technique that allows teams to modify system behavior without changing code. They enable controlled feature rollouts, A/B testing, and quick disabling of problematic features.

### How They Work

1. Wrap new features in conditional logic (the feature flag)
2. Control the flag's state externally (via configuration, database, or API)
3. Enable the feature for specific users, a percentage of users, or all users
4. Disable the feature quickly if issues arise

### Implementation in BCBS

Feature flags are implemented through the `server/feature-flags.ts` module:

```typescript
// Example usage in code
import { isFeatureEnabled } from '../feature-flags';

function handleRequest(req, res) {
  // Check if feature is enabled for this user
  if (isFeatureEnabled('new_ui', { 
    userId: req.user?.id,
    roles: req.user?.roles
  })) {
    // Serve new UI
    return res.render('new-ui');
  }
  
  // Fall back to old UI
  return res.render('old-ui');
}
```

### Managing Feature Flags

Feature flags can be controlled through:

1. **Environment variables**:
   ```
   FEATURE_NEW_UI=true
   FEATURE_NEW_UI_PERCENTAGE=25
   ```

2. **Runtime API** (for authorized users):
   ```
   POST /api/admin/features
   {
     "name": "new_ui",
     "enabled": true,
     "rolloutPercentage": 50
   }
   ```

3. **Terraform variables**:
   ```hcl
   variable "feature_flags" {
     type = map(object({
       enabled = bool
       rollout_percentage = number
     }))
     default = {
       new_ui = {
         enabled = true
         rollout_percentage = 25
       }
     }
   }
   ```

## Best Practices

### Blue-Green Deployment

1. **Identical Environments**: Ensure Blue and Green environments are identical in infrastructure
2. **Database Compatibility**: Ensure database schema changes are backward compatible
3. **Pre-Warming**: Pre-warm the new environment before switching traffic
4. **Automated Testing**: Run comprehensive tests in the new environment before switching
5. **Quick Rollback**: Have a documented rollback procedure

### Canary Releases

1. **Start Small**: Begin with a small percentage (5-10%) of traffic
2. **Monitor Closely**: Watch error rates, latency, and user feedback
3. **Gradual Increase**: Increase traffic in stages (10% → 25% → 50% → 100%)
4. **Defined Metrics**: Have clear success/failure metrics
5. **Automated Rollback**: Set up automatic rollback triggers based on error thresholds

### Feature Flags

1. **Short-lived Flags**: Remove feature flags once features are stable
2. **Flag Governance**: Document all flags and their purpose
3. **Testing**: Test both enabled and disabled states
4. **Default-Off**: New features should be off by default
5. **Monitoring**: Track feature flag state changes

## Rollback Procedures

### Blue-Green Rollback

If issues are detected after switching to Green:

```bash
# Switch back to Blue
./scripts/terraform-cmd.sh staging apply -var="active_environment=blue"
```

### Canary Rollback

If issues are detected during canary deployment:

```bash
# Rollback to previous version
./scripts/deploy.sh staging --rollback
```

### Feature Flag Rollback

If a feature causes issues:

```bash
# Disable the feature flag
export FEATURE_PROBLEMATIC_FEATURE=false
npm run restart
```

## Monitoring During Deployments

During any advanced deployment, you should monitor:

1. **Error rates**: Watch for increases in error rates
2. **Latency**: Monitor response times for degradation
3. **Resource usage**: Check CPU, memory, and disk usage
4. **User feedback**: Look for negative user feedback or support tickets
5. **Business metrics**: Monitor core business metrics

## Further Reading

- [Blue-Green Deployments on AWS](https://aws.amazon.com/builders-library/going-faster-with-continuous-delivery/)
- [Canary Releases with Kubernetes](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/)
- [Feature Flag Best Practices](https://launchdarkly.com/blog/best-practices-feature-flags/)
- [Testing in Production](https://www.atlassian.com/continuous-delivery/principles/testing-in-production)