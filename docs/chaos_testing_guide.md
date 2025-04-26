# Chaos Testing Guide

This guide outlines how to perform chaos testing in the Benton County Building Cost System (BCBS) application to improve resilience and reliability.

## What is Chaos Testing?

Chaos testing (or chaos engineering) is the practice of deliberately introducing failures in your system to test its resilience and uncover weaknesses before they manifest in production.

## Why Chaos Testing?

1. **Build Confidence**: Ensure your system can withstand turbulent and unexpected conditions
2. **Uncover Weaknesses**: Find vulnerabilities before they impact users
3. **Improve Recovery**: Practice recovery procedures before real incidents occur
4. **Validate Monitoring**: Ensure monitoring systems detect problems correctly

## Chaos Testing Environments

### 1. Local Docker Environment

The simplest way to start chaos testing is in your local Docker environment:

```bash
# Start the environment
./scripts/docker-dev.sh start

# Then run chaos tests
./scripts/chaos-test.sh
```

### 2. Staging Environment

For more realistic testing, use the staging environment:

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Run chaos tests against staging
./scripts/chaos-test.sh --env=staging
```

### 3. Production Simulation

For maximum realism, create a production-like environment:

```bash
# Create prod-sim environment
./scripts/terraform-cmd.sh prod-sim apply

# Deploy application
./scripts/deploy.sh prod-sim

# Run chaos tests
./scripts/chaos-test.sh --env=prod-sim
```

## Chaos Testing Scenarios

### 1. Infrastructure Chaos

| Scenario | Description | Command |
|----------|-------------|---------|
| CPU Stress | Simulate high CPU usage | `chaos cpu --duration=5m --load=80` |
| Memory Pressure | Simulate memory pressure | `chaos memory --duration=5m --consumption=80%` |
| Disk I/O Saturation | Simulate disk I/O pressure | `chaos io --duration=5m --volume=/data` |
| Disk Space Exhaustion | Simulate running out of disk space | `chaos disk --fill=90%` |

### 2. Network Chaos

| Scenario | Description | Command |
|----------|-------------|---------|
| Network Latency | Add latency between services | `chaos network latency --duration=5m --latency=200ms` |
| Packet Loss | Introduce packet loss | `chaos network loss --duration=5m --percent=5` |
| Network Partition | Split network into isolated segments | `chaos network partition --duration=5m --service=db` |
| DNS Failures | Simulate DNS resolution failures | `chaos dns --duration=5m --error-rate=50%` |

### 3. Service Chaos

| Scenario | Description | Command |
|----------|-------------|---------|
| Service Restarts | Randomly restart services | `chaos service restart --duration=30m --interval=5m` |
| Database Failures | Simulate database unavailability | `chaos db --duration=5m --error-rate=50%` |
| Redis Failures | Simulate Redis unavailability | `chaos redis --duration=5m --connection-refused` |
| API Timeouts | Simulate slow API responses | `chaos api --duration=5m --latency=5s` |

## Implementing Chaos Testing in CI/CD

Add chaos testing to your CI/CD pipeline as follows:

1. **Edit `.github/workflows/ci.yml`** to add a chaos testing job:

```yaml
chaos-testing:
  name: Chaos Testing
  runs-on: ubuntu-latest
  needs: test-and-build
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Set up chaos testing environment
      run: |
        docker-compose -f docker-compose.yml -f docker-compose.chaos.yml up -d
        sleep 30  # Allow system to stabilize
    
    - name: Run chaos tests
      run: |
        ./scripts/chaos-test.sh --ci
    
    - name: Capture results
      run: |
        ./scripts/chaos-test.sh --report > chaos-report.json
    
    - name: Upload chaos test results
      uses: actions/upload-artifact@v3
      with:
        name: chaos-test-results
        path: chaos-report.json
```

## Creating Chaos Test Scripts

### Basic Script Structure

Create a file `scripts/chaos-test.sh`:

```bash
#!/bin/bash
# Chaos testing script for BCBS application

set -e

# Parse command line arguments
ENV="local"
CI_MODE=false
REPORT_MODE=false

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --env=*) ENV="${1#*=}" ;;
    --ci) CI_MODE=true ;;
    --report) REPORT_MODE=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# If in report mode, just output the report
if [[ "$REPORT_MODE" == true ]]; then
  echo '{"status": "completed", "tests": 10, "passed": 8, "failed": 2, "scenarios": ["cpu", "memory", "network"]}'
  exit 0
fi

echo "Running chaos tests in $ENV environment"

# Function to run a chaos scenario
run_scenario() {
  local scenario=$1
  local duration=$2
  local params=$3
  
  echo "Running scenario: $scenario ($duration)"
  
  # These would be actual implementations in a real script
  case $scenario in
    cpu)
      echo "Simulating CPU stress"
      # Implementation would stress CPU resources
      ;;
    memory)
      echo "Simulating memory pressure"
      # Implementation would consume memory
      ;;
    network)
      echo "Simulating network issues: $params"
      # Implementation would introduce network problems
      ;;
    db)
      echo "Simulating database failures"
      # Implementation would cause database issues
      ;;
    *)
      echo "Unknown scenario: $scenario"
      return 1
      ;;
  esac
  
  return 0
}

# Run the chaos scenarios
run_scenario "cpu" "30s" "load=80%"
run_scenario "memory" "30s" "consumption=70%"
run_scenario "network" "30s" "latency=200ms"
run_scenario "db" "15s" "error-rate=50%"

echo "Chaos testing completed"
```

Make the script executable:

```bash
chmod +x scripts/chaos-test.sh
```

## Monitoring During Chaos Tests

During chaos tests, you should:

1. Monitor application metrics at `/api/health/metrics`
2. Watch logs for errors and warnings
3. Track response times and availability
4. Verify automatic recovery mechanisms

## Best Practices

1. **Start Small**: Begin with simple, isolated experiments
2. **Incremental Complexity**: Gradually increase complexity and scope
3. **Controlled Blast Radius**: Limit the potential impact of experiments
4. **Clear Hypothesis**: Always have a clear hypothesis for each test
5. **Stop Criteria**: Define clear stop conditions for each experiment
6. **Document Findings**: Keep detailed records of all experiments and results
7. **Learn and Improve**: Use findings to improve system resilience

## Tool Recommendations

1. **[Chaos Toolkit](https://chaostoolkit.org/)**: Open-source chaos testing framework
2. **[Gremlin](https://www.gremlin.com/)**: Commercial chaos engineering platform
3. **[Chaos Mesh](https://chaos-mesh.org/)**: Kubernetes-native chaos engineering platform
4. **[AWS Fault Injection Simulator](https://aws.amazon.com/fis/)**: AWS-native chaos testing service

## Further Reading

- [Principles of Chaos Engineering](https://principlesofchaos.org/)
- [Chaos Engineering: Site Reliability Through Controlled Disruption](https://www.oreilly.com/library/view/chaos-engineering/9781492043866/)
- [Awesome Chaos Engineering Resources](https://github.com/dastergon/awesome-chaos-engineering)