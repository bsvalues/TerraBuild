# Observability and Security Guide

This guide provides an overview of the observability and security features implemented in the Benton County Building Cost System (BCBS) project.

## Observability Features

### 1. Health Check Endpoints

The application provides several health check endpoints:

- **`/api/health`**: Returns comprehensive health information about the application
- **`/api/health/metrics`**: Returns detailed metrics for monitoring systems
- **`/api/health/liveness`**: Simple liveness probe for Kubernetes
- **`/api/health/readiness`**: Readiness probe to check if the application is ready to receive traffic

Example response from `/api/health`:

```json
{
  "status": "healthy",
  "timestamp": "2025-04-26T08:00:00.000Z",
  "system": {
    "hostname": "bcbs-app-server",
    "uptime": 3600,
    "memory": {
      "free": 1073741824,
      "total": 4294967296,
      "usage": 75.0
    },
    "cpus": 4,
    "load": [1.5, 1.2, 0.9]
  },
  "application": {
    "version": "1.0.0",
    "nodeVersion": "v20.0.0",
    "connectedClients": 5,
    "environment": "production"
  },
  "features": [
    {
      "name": "advanced_analytics",
      "description": "Enable advanced analytics features",
      "enabled": true,
      "enabledFor": ["admin"]
    },
    // Additional feature flags...
  ],
  "responseTime": "15.23ms"
}
```

### 2. Metrics Collection

The CI/CD pipeline now collects and stores metrics about each run, including:

- Build times
- Test results
- Code coverage
- Security scan results

These metrics are stored as GitHub Actions artifacts and can be used to generate dashboards and reports.

### 3. Performance Monitoring

The application collects performance metrics during runtime and makes them available through the `/api/health/metrics` endpoint. This data can be ingested by monitoring systems like Prometheus or Datadog.

Metrics collected include:

- Memory usage
- CPU usage
- Response times
- Active WebSocket connections
- Request counts

### 4. Logging and Tracing

The application uses structured logging to facilitate log aggregation and analysis. Logs include:

- Timestamp
- Log level
- Request ID (for tracing)
- User ID (when authenticated)
- Source file
- Message

## Security Features

### 1. Code Security Scanning

The CI pipeline now includes:

- **CodeQL**: Static code analysis to find security vulnerabilities
- **Dependency scanning**: Checking for vulnerabilities in dependencies
- **Docker image scanning**: Using Trivy to scan for vulnerabilities in Docker images

### 2. Software Bill of Materials (SBOM)

Each build generates a Software Bill of Materials (SBOM) that lists all components and dependencies used in the application. This helps with:

- Vulnerability management
- License compliance
- Auditing

### 3. Feature Flags

The application includes a feature flag system that allows:

- Enabling/disabling features at runtime
- Gradual rollout of features to specific users or percentages
- A/B testing
- Feature isolation for security

### 4. Secure Deployment

The deployment process includes:

- AWS IAM Role assumption for least privilege
- Terraform plan review before apply
- Canary deployments to detect issues early
- Automated rollback on failure
- Post-deployment security validation

## Configuration

### Feature Flags

Feature flags can be configured through environment variables:

- `FEATURE_ADVANCED_ANALYTICS`: Enable advanced analytics features
- `FEATURE_NEW_UI`: Enable new UI components
- `FEATURE_NEW_UI_PERCENTAGE`: Percentage rollout for new UI (0-100)
- `FEATURE_API_V2`: Use v2 API endpoints
- `FEATURE_EXPERIMENTAL`: Enable experimental features

### Monitoring Integration

To integrate with external monitoring systems:

1. **Prometheus**:
   - Deploy Prometheus using Terraform (see `terrafusion/modules/monitoring`)
   - Prometheus will scrape the `/api/health/metrics` endpoint

2. **Datadog**:
   - Add Datadog API key to environment variables
   - Deploy Datadog agent using Terraform

3. **ELK Stack**:
   - Deploy Elasticsearch, Logstash, and Kibana using Terraform
   - Configure Logstash to ingest application logs

## Best Practices

1. **Regular Security Scans**: Review CodeQL and Trivy scan results after each build
2. **Metrics Dashboards**: Create dashboards for key performance indicators
3. **Alert Configuration**: Set up alerts for abnormal patterns in metrics
4. **Feature Flag Hygiene**: Regularly review and clean up unused feature flags
5. **Continuous Improvement**: Use metrics to identify and address performance bottlenecks

## Troubleshooting

### Common Issues

1. **High Memory Usage**:
   - Check for memory leaks using the metrics endpoint
   - Review resource allocation in Kubernetes/ECS

2. **Slow Response Times**:
   - Check database query performance
   - Review application logs for slow operations
   - Check external service dependencies

3. **Security Scan Failures**:
   - Review CodeQL findings and address high-priority issues first
   - Update dependencies with known vulnerabilities
   - Follow recommended remediation steps in security reports

## Further Reading

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Google SRE Handbook](https://sre.google/sre-book/table-of-contents/)
- [AWS Security Best Practices](https://aws.amazon.com/architecture/security-identity-compliance/)
- [Prometheus Documentation](https://prometheus.io/docs/introduction/overview/)
- [Feature Flag Best Practices](https://launchdarkly.com/blog/best-practices-feature-flags/)