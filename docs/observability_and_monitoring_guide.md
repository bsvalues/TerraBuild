# Observability and Monitoring Guide for BCBS Application

This document provides comprehensive guidance on the observability and monitoring infrastructure implemented for the Benton County Building Cost System (BCBS) application.

## Table of Contents

1. [Overview](#overview)
2. [Health Checks](#health-checks)
3. [Metrics Collection](#metrics-collection)
4. [Logging](#logging)
5. [Tracing](#tracing)
6. [Alerting](#alerting)
7. [DORA Metrics](#dora-metrics)
8. [Dashboards](#dashboards)
9. [Performance Testing](#performance-testing)
10. [Security Monitoring](#security-monitoring)

## Overview

The BCBS application's observability stack is designed to provide comprehensive visibility into system health, performance, and behavior. This multi-layered approach combines health checks, metrics, logs, traces, and alerts to enable quick detection and resolution of issues.

## Health Checks

Health checks provide immediate information about the operational status of application components.

### Endpoints

The application exposes several health check endpoints:

- **`/api/health`**: Full health status with details about each component
- **`/api/health/simple`**: Simple health status for load balancers
- **`/api/readiness`**: Readiness probe for container orchestration
- **`/api/liveness`**: Liveness probe for container orchestration

### Health Components

Each health check evaluates:

1. **Database Connectivity**: Verifies database connections are working
2. **Memory Usage**: Monitors heap and memory utilization
3. **Application Status**: Checks core application components
4. **External Dependencies**: Verifies connections to external services

### Implementation

The health check implementation is in `server/routes/health.ts` and returns structured responses:

```json
{
  "status": "healthy", // can be "healthy", "degraded", or "unhealthy"
  "version": "1.0.0",
  "timestamp": "2025-04-26T15:30:45.123Z",
  "uptime": 3600,
  "components": {
    "database": {
      "status": "healthy",
      "responseTime": 12.5
    },
    "memory": {
      "status": "healthy",
      "details": {
        "heapUsed": "245MB",
        "heapTotal": "512MB"
      }
    },
    "application": {
      "status": "healthy"
    }
  }
}
```

## Metrics Collection

Metrics provide quantitative data about system performance and behavior over time.

### Key Metrics

The application collects several categories of metrics:

1. **System Metrics**:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

2. **Application Metrics**:
   - Request rates
   - Response times
   - Error rates
   - Concurrent users

3. **Business Metrics**:
   - Cost calculations performed
   - Property assessments completed
   - User registrations
   - Export operations

### Metrics Implementation

Metrics are collected in two ways:

1. **Server-side**: Using a metrics collection library that exposes a `/metrics` endpoint
2. **Client-side**: Using browser performance APIs and custom event tracking

### Metric Data Format

Metrics are structured consistently:

```
metric_name{label1="value1",label2="value2"} value timestamp
```

For example:
```
http_request_duration_seconds{path="/api/cost-calculator",method="POST",status="200"} 0.157 1619712345678
```

## Logging

Logs provide contextual information about system events and application behavior.

### Log Levels

The application uses the following log levels:

- **ERROR**: Significant errors requiring immediate attention
- **WARN**: Potential issues that should be monitored
- **INFO**: Important operational events
- **DEBUG**: Detailed information for troubleshooting
- **TRACE**: Very detailed tracing information

### Log Structure

All logs follow a consistent JSON structure:

```json
{
  "timestamp": "2025-04-26T15:32:45.123Z",
  "level": "INFO",
  "service": "bcbs-api",
  "traceId": "1234-5678-9012",
  "message": "Cost calculation completed successfully",
  "context": {
    "userId": "user-123",
    "propertyId": "prop-456",
    "calculationTime": 145.3
  }
}
```

### Log Storage and Retention

- **Short-term**: Logs are stored locally for 7 days
- **Long-term**: Logs are archived in cloud storage for 1 year
- **Compliance**: Certain logs are preserved for regulatory compliance

## Tracing

Distributed tracing tracks the flow of requests through the application.

### Trace Components

Each trace includes:

1. **Trace ID**: Unique identifier for the entire request flow
2. **Span ID**: Identifier for a specific segment of the request
3. **Parent Span ID**: Identifier linking spans in a hierarchy
4. **Tags**: Key-value pairs providing context
5. **Events**: Timestamped events within a span
6. **Status**: Success or error status of the span

### Instrumentation

Tracing is implemented through:

- **Automatic Instrumentation**: For frameworks and libraries
- **Manual Instrumentation**: For custom business logic

### Sampling Strategy

To manage volume, traces are sampled:

- 100% of error responses
- 100% of slow responses (>1s)
- 10% of normal responses
- 100% of authenticated admin requests

## Alerting

Alerts notify the team when monitoring detects problems.

### Alert Severity Levels

Alerts are categorized by severity:

- **Critical**: Immediate action required (24/7)
- **High**: Action required during business hours
- **Medium**: Should be investigated in the next 1-2 days
- **Low**: Should be reviewed in the next sprint

### Alert Channels

Alerts are sent through multiple channels depending on severity:

- **Critical**: SMS, phone call, email, and chat
- **High**: SMS, email, and chat
- **Medium**: Email and chat
- **Low**: Chat only

### Common Alerts

Key alerts configured for the application:

1. **Health Check Failures**: When component health degrades
2. **High Error Rate**: Unusual spike in error responses
3. **Latency Increases**: Response time exceeding thresholds
4. **Database Connection Issues**: Problems connecting to database
5. **Memory Leaks**: Continually increasing memory usage
6. **Disk Space**: Low disk space warnings

## DORA Metrics

DevOps Research and Assessment (DORA) metrics track deployment quality and velocity.

### Metrics Tracked

The application tracks four key DORA metrics:

1. **Deployment Frequency**: How often code is deployed to production
2. **Lead Time for Changes**: Time from commit to production deployment
3. **Mean Time to Restore (MTTR)**: Time to recover from failures
4. **Change Failure Rate**: Percentage of deployments causing failures

### Data Collection

DORA metrics are collected using the script in `scripts/collect-dora-metrics.js` which:

1. Analyzes deployment logs and Git history
2. Calculates the metrics based on collected data
3. Classifies performance into Elite, High, Medium, or Low categories
4. Generates reports for trending analysis

### Example Output

```json
{
  "deploymentFrequency": {
    "value": 0.8,
    "unit": "per day",
    "classification": "High"
  },
  "leadTimeForChanges": {
    "value": 18.5,
    "unit": "hours",
    "classification": "Elite"
  },
  "meanTimeToRestore": {
    "value": 45.2,
    "unit": "minutes",
    "classification": "Elite"
  },
  "changeFailureRate": {
    "value": 8.3,
    "unit": "percent",
    "classification": "Elite"
  }
}
```

## Dashboards

Dashboards visualize monitoring data for quick assessment of system health.

### Dashboard Types

The application provides several specialized dashboards:

1. **Executive Dashboard**: High-level system health and business metrics
2. **Operations Dashboard**: Detailed system metrics and alerts
3. **Development Dashboard**: Deployment metrics and application errors
4. **Security Dashboard**: Security events and compliance status

### Dashboard Implementation

Dashboards are implemented using:

- **Metric data**: From the metrics collection system
- **Log data**: From the logging infrastructure
- **Trace data**: From the distributed tracing system
- **Alert data**: From the alerting system

### Dashboard Access

Dashboards are accessible to:

- **Administrators**: All dashboards
- **Developers**: Development and operations dashboards
- **Managers**: Executive and operational dashboards
- **Security Team**: Security dashboard

## Performance Testing

Performance testing evaluates system behavior under various load conditions.

### Testing Types

The application uses several performance testing approaches:

1. **Load Testing**: Verifies behavior under expected load
2. **Stress Testing**: Evaluates behavior under extreme load
3. **Soak Testing**: Checks for issues over extended periods
4. **Spike Testing**: Tests response to sudden traffic surges

### Testing Tools

Performance testing uses:

- **Autocannon**: For HTTP endpoint load testing
- **Playwright**: For end-to-end browser testing
- **Custom Scripts**: For specific business scenarios

### Test Scenarios

Common performance test scenarios include:

1. **Homepage Load**: Tests homepage rendering speed
2. **Cost Calculation**: Tests calculator performance with various inputs
3. **Concurrent Users**: Simulates multiple users accessing the system
4. **Data Export**: Tests large data export performance

### Performance Thresholds

Key performance thresholds monitored:

| Endpoint | P95 Latency | Error Rate |
|----------|-------------|------------|
| Homepage | 500ms       | 0.1%       |
| API Endpoints | 200ms  | 0.1%       |
| Calculations | 1000ms  | 0.5%       |
| Data Export | 5000ms   | 1.0%       |

## Security Monitoring

Security monitoring tracks and alerts on potential security threats.

### Monitoring Categories

Security monitoring covers:

1. **Access Control**: Unauthorized access attempts
2. **Data Protection**: Potential data leaks
3. **Vulnerability Management**: New vulnerabilities
4. **Compliance**: Regulatory compliance issues

### Security Alerts

Common security alerts include:

1. **Unusual Access Patterns**: Login attempts outside normal patterns
2. **Dependency Vulnerabilities**: New CVEs in dependencies
3. **Configuration Changes**: Unexpected configuration changes
4. **Data Access**: Unusual data access patterns

### Security Dashboards

Security dashboards provide:

1. **Threat Overview**: Current security status
2. **Vulnerability Tracking**: Open vulnerabilities and remediation status
3. **Compliance Status**: Current compliance with regulations
4. **Access Logs**: Record of system access

## Conclusion

The BCBS application's comprehensive observability and monitoring infrastructure ensures high availability, performance, and security. By combining health checks, metrics, logs, traces, and alerts with specialized dashboards and performance testing, the system provides complete visibility into application behavior and quick detection of issues.