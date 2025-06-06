# TerraBuild DevOps Kit

## Infrastructure as Code

### Docker Configuration

#### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - OLLAMA_URL=http://ollama:11434
      - CHROMA_URL=http://chroma:8000
    depends_on:
      postgres:
        condition: service_healthy
      ollama:
        condition: service_started
      chroma:
        condition: service_started
    restart: unless-stopped
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G

  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: terrabuild
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d terrabuild"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_ORIGINS=*
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  chroma:
    image: chromadb/chroma:latest
    volumes:
      - chroma_data:/chroma/chroma
    ports:
      - "8000:8000"
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_HTTP_PORT=8000
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  ollama_data:
  chroma_data:
  redis_data:
```

#### Multi-Stage Dockerfile
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S terrabuild -u 1001
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY package*.json ./
USER terrabuild
EXPOSE 5000
CMD ["npm", "start"]
```

### Kubernetes Manifests

#### Deployment Configuration
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrabuild-app
  namespace: terrabuild
spec:
  replicas: 3
  selector:
    matchLabels:
      app: terrabuild-app
  template:
    metadata:
      labels:
        app: terrabuild-app
    spec:
      containers:
      - name: app
        image: terrabuild:latest
        ports:
        - containerPort: 5000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: terrabuild-secrets
              key: database-url
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service Configuration
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: terrabuild-service
  namespace: terrabuild
spec:
  selector:
    app: terrabuild-app
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

#### Ingress Configuration
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: terrabuild-ingress
  namespace: terrabuild
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - terrabuild.county.gov
    secretName: terrabuild-tls
  rules:
  - host: terrabuild.county.gov
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: terrabuild-service
            port:
              number: 80
```

## CI/CD Pipelines

### GitHub Actions
```yaml
# .github/workflows/ci-cd.yml
name: TerraBuild CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: terrabuild

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test:unit
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/terrabuild_test
    
    - name: Generate coverage report
      run: npm run test:coverage
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        scan-type: 'fs'
        scan-ref: '.'
        format: 'sarif'
        output: 'trivy-results.sarif'
    
    - name: Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

  build:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ github.repository }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add staging deployment commands

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add production deployment commands
```

### GitLab CI/CD
```yaml
# .gitlab-ci.yml
stages:
  - test
  - security
  - build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  POSTGRES_DB: terrabuild_test
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres

test:
  stage: test
  image: node:18-alpine
  services:
    - postgres:15
  variables:
    DATABASE_URL: postgresql://postgres:postgres@postgres:5432/terrabuild_test
  script:
    - npm ci
    - npm run lint
    - npm run type-check
    - npm run test:unit
    - npm run test:integration
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

security-scan:
  stage: security
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker run --rm -v "$PWD":/app -w /app aquasec/trivy fs .
    - docker run --rm -v "$PWD":/app -w /app securecodewarrior/docker-image-scanner

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker push $DOCKER_IMAGE
  only:
    - main
    - develop

deploy-staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context staging
    - kubectl set image deployment/terrabuild-app app=$DOCKER_IMAGE
    - kubectl rollout status deployment/terrabuild-app
  environment:
    name: staging
    url: https://staging.terrabuild.county.gov
  only:
    - develop

deploy-production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - kubectl set image deployment/terrabuild-app app=$DOCKER_IMAGE
    - kubectl rollout status deployment/terrabuild-app
  environment:
    name: production
    url: https://terrabuild.county.gov
  only:
    - main
  when: manual
```

## Monitoring and Observability

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'terrabuild-app'
    static_configs:
      - targets: ['app:5000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'nginx-exporter'
    static_configs:
      - targets: ['nginx-exporter:9113']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboards
```json
{
  "dashboard": {
    "title": "TerraBuild System Overview",
    "panels": [
      {
        "title": "Application Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "AI Agent Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(ai_agent_tasks_completed_total[5m])) by (agent_type)",
            "legendFormat": "{{agent_type}}"
          }
        ]
      },
      {
        "title": "Database Connections",
        "type": "singlestat",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"terrabuild\"}"
          }
        ]
      }
    ]
  }
}
```

### Alert Rules
```yaml
# monitoring/rules/alerts.yml
groups:
  - name: terrabuild.rules
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }} errors per second"

    - alert: DatabaseDown
      expr: up{job="postgres-exporter"} == 0
      for: 1m
      labels:
        severity: critical
      annotations:
        summary: "Database is down"
        description: "PostgreSQL database is not responding"

    - alert: AIAgentFailure
      expr: ai_agent_failures_total > 10
      for: 2m
      labels:
        severity: warning
      annotations:
        summary: "AI Agent experiencing failures"
        description: "Agent {{ $labels.agent_type }} has {{ $value }} failures"

    - alert: HighMemoryUsage
      expr: (node_memory_MemTotal_bytes - node_memory_MemFree_bytes) / node_memory_MemTotal_bytes > 0.9
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "High memory usage"
        description: "Memory usage is above 90%"
```

## Security Configuration

### Network Security Scripts
```bash
#!/bin/bash
# scripts/firewall-setup.sh

echo "Configuring enterprise firewall rules..."

# Flush existing rules
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow SSH (modify port as needed)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A OUTPUT -p tcp --sport 22 -j ACCEPT

# Allow HTTP/HTTPS
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A OUTPUT -p tcp --sport 80 -j ACCEPT
iptables -A OUTPUT -p tcp --sport 443 -j ACCEPT

# Allow application ports
iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
iptables -A OUTPUT -p tcp --sport 5000 -j ACCEPT

# Allow database connections (internal only)
iptables -A INPUT -p tcp -s 10.0.0.0/8 --dport 5432 -j ACCEPT
iptables -A OUTPUT -p tcp -d 10.0.0.0/8 --sport 5432 -j ACCEPT

# Allow AI service ports (internal only)
iptables -A INPUT -p tcp -s 10.0.0.0/8 --dport 11434 -j ACCEPT
iptables -A INPUT -p tcp -s 10.0.0.0/8 --dport 8000 -j ACCEPT

# Allow DNS
iptables -A OUTPUT -p udp --dport 53 -j ACCEPT
iptables -A OUTPUT -p tcp --dport 53 -j ACCEPT

# Allow NTP
iptables -A OUTPUT -p udp --dport 123 -j ACCEPT

# Restrict outbound to approved domains only
ALLOWED_DOMAINS=(
    "github.com"
    "npmjs.com" 
    "docker.io"
    "registry-1.docker.io"
    "auth.docker.io"
    "production.cloudflare.docker.com"
)

for domain in "${ALLOWED_DOMAINS[@]}"; do
    IP=$(dig +short $domain | head -1)
    if [[ -n "$IP" ]]; then
        iptables -A OUTPUT -d $IP -j ACCEPT
    fi
done

# Log dropped packets
iptables -A INPUT -j LOG --log-prefix "DROPPED INPUT: "
iptables -A OUTPUT -j LOG --log-prefix "DROPPED OUTPUT: "

# Save rules
iptables-save > /etc/iptables/rules.v4

echo "Firewall configuration completed"
```

### SSL Certificate Generation
```bash
#!/bin/bash
# scripts/generate-certificates.sh

echo "Generating SSL certificates..."

DOMAIN="terrabuild.county.gov"
CERT_DIR="./ssl"

mkdir -p $CERT_DIR

# Generate private key
openssl genrsa -out $CERT_DIR/server-key.pem 2048

# Generate certificate signing request
openssl req -new -key $CERT_DIR/server-key.pem -out $CERT_DIR/server.csr \
    -subj "/C=US/ST=County/L=City/O=County Government/CN=$DOMAIN"

# Generate self-signed certificate (for development)
openssl x509 -req -in $CERT_DIR/server.csr -signkey $CERT_DIR/server-key.pem \
    -out $CERT_DIR/server-cert.pem -days 365

# Set appropriate permissions
chmod 600 $CERT_DIR/server-key.pem
chmod 644 $CERT_DIR/server-cert.pem

echo "SSL certificates generated in $CERT_DIR"
echo "For production, replace with certificates from your CA"
```

## Backup and Recovery

### Database Backup Script
```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="terrabuild"
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/terrabuild_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/terrabuild_$DATE.sql

# Upload to cloud storage (optional)
if [[ -n "$AWS_S3_BUCKET" ]]; then
    aws s3 cp $BACKUP_DIR/terrabuild_$DATE.sql.gz s3://$AWS_S3_BUCKET/backups/
fi

# Clean old backups
find $BACKUP_DIR -name "terrabuild_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Database backup completed: terrabuild_$DATE.sql.gz"
```

### Application Backup Script
```bash
#!/bin/bash
# scripts/backup-application.sh

BACKUP_DIR="/backups/application"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/terrabuild"

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/terrabuild_app_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    $APP_DIR

# Backup configuration
tar -czf $BACKUP_DIR/terrabuild_config_$DATE.tar.gz \
    /etc/terrabuild \
    /etc/nginx/sites-available/terrabuild \
    /etc/ssl/certs/terrabuild*

echo "Application backup completed"
```

### Disaster Recovery Script
```bash
#!/bin/bash
# scripts/disaster-recovery.sh

BACKUP_DIR="/backups"
RESTORE_DATE=$1

if [[ -z "$RESTORE_DATE" ]]; then
    echo "Usage: $0 <YYYYMMDD_HHMMSS>"
    exit 1
fi

echo "Starting disaster recovery for $RESTORE_DATE..."

# Stop services
docker-compose down

# Restore database
gunzip -c $BACKUP_DIR/postgresql/terrabuild_$RESTORE_DATE.sql.gz | psql $DATABASE_URL

# Restore application
tar -xzf $BACKUP_DIR/application/terrabuild_app_$RESTORE_DATE.tar.gz -C /

# Restore configuration
tar -xzf $BACKUP_DIR/application/terrabuild_config_$RESTORE_DATE.tar.gz -C /

# Start services
docker-compose up -d

echo "Disaster recovery completed"
```

## Performance Optimization

### Database Optimization
```sql
-- Performance optimization queries
-- Create essential indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_geo_id ON properties(geo_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_address ON properties USING gin(to_tsvector('english', address));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_improvements_property_id ON improvements(property_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cost_matrices_region_building ON cost_matrices(region, building_type);

-- Analyze tables for query optimization
ANALYZE properties;
ANALYZE improvements;
ANALYZE cost_matrices;
ANALYZE building_types;

-- Update statistics
UPDATE pg_stat_user_tables SET n_tup_upd = 0, n_tup_del = 0;
```

### Application Performance Tuning
```javascript
// config/performance.js
module.exports = {
  // Database connection pooling
  database: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  },
  
  // Redis caching
  cache: {
    ttl: 3600, // 1 hour
    maxKeys: 10000
  },
  
  // AI agent optimization
  agents: {
    concurrency: 10,
    timeout: 30000,
    retryAttempts: 3
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // requests per window
  }
};
```

## Load Testing

### Artillery Load Test
```yaml
# tests/load/artillery.yml
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 50
      name: "Normal load"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"
  payload:
    path: "./test-data.csv"
    fields:
      - propertyId
      - buildingType

scenarios:
  - name: "Property valuation workflow"
    weight: 70
    flow:
      - post:
          url: "/api/auth/login"
          json:
            username: "testuser"
            password: "testpass"
          capture:
            - json: "$.token"
              as: "authToken"
      - post:
          url: "/api/valuations/calculate"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            propertyId: "{{ propertyId }}"
            buildingType: "{{ buildingType }}"
            squareFeet: 2000
            yearBuilt: 2010

  - name: "AI agent task submission"
    weight: 30
    flow:
      - post:
          url: "/api/agents/tasks"
          json:
            type: "property_analysis"
            payload:
              propertyId: "{{ propertyId }}"
```

### K6 Load Test
```javascript
// tests/load/k6-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  // Login
  let loginResponse = http.post('http://localhost:5000/api/auth/login', {
    username: 'testuser',
    password: 'testpass',
  });
  
  check(loginResponse, {
    'login successful': (r) => r.status === 200,
  });
  
  let authToken = loginResponse.json('token');
  
  // Calculate property valuation
  let valuationResponse = http.post(
    'http://localhost:5000/api/valuations/calculate',
    JSON.stringify({
      propertyId: '123',
      buildingType: 'SFR',
      squareFeet: 2000,
      yearBuilt: 2010,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    }
  );
  
  check(valuationResponse, {
    'valuation calculated': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
}
```

## Deployment Automation

### Ansible Playbook
```yaml
# ansible/deploy.yml
---
- hosts: terrabuild_servers
  become: yes
  vars:
    app_name: terrabuild
    app_version: latest
    app_port: 5000
    
  tasks:
    - name: Update system packages
      apt:
        update_cache: yes
        upgrade: dist
        
    - name: Install Docker
      apt:
        name:
          - docker.io
          - docker-compose
        state: present
        
    - name: Start Docker service
      systemd:
        name: docker
        state: started
        enabled: yes
        
    - name: Create application directory
      file:
        path: /opt/{{ app_name }}
        state: directory
        owner: www-data
        group: www-data
        
    - name: Copy application files
      copy:
        src: ../
        dest: /opt/{{ app_name }}/
        owner: www-data
        group: www-data
        
    - name: Copy environment file
      template:
        src: .env.j2
        dest: /opt/{{ app_name }}/.env
        owner: www-data
        group: www-data
        mode: '0600'
        
    - name: Pull Docker images
      docker_image:
        name: "{{ item }}"
        source: pull
      loop:
        - postgres:15
        - ollama/ollama:latest
        - chromadb/chroma:latest
        
    - name: Start application services
      docker_compose:
        project_src: /opt/{{ app_name }}
        state: present
        
    - name: Configure nginx
      template:
        src: nginx.conf.j2
        dest: /etc/nginx/sites-available/{{ app_name }}
      notify: restart nginx
      
    - name: Enable nginx site
      file:
        src: /etc/nginx/sites-available/{{ app_name }}
        dest: /etc/nginx/sites-enabled/{{ app_name }}
        state: link
      notify: restart nginx
      
  handlers:
    - name: restart nginx
      systemd:
        name: nginx
        state: restarted
```

### Terraform Infrastructure
```hcl
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_vpc" "terrabuild_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "terrabuild-vpc"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.terrabuild_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "terrabuild-public-subnet"
  }
}

resource "aws_security_group" "terrabuild_sg" {
  name        = "terrabuild-sg"
  description = "Security group for TerraBuild application"
  vpc_id      = aws_vpc.terrabuild_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "terrabuild_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_pair
  vpc_security_group_ids = [aws_security_group.terrabuild_sg.id]
  subnet_id              = aws_subnet.public_subnet.id
  
  root_block_device {
    volume_size = 50
    volume_type = "gp3"
  }
  
  user_data = file("${path.module}/user-data.sh")
  
  tags = {
    Name = "terrabuild-server"
  }
}
```

This comprehensive DevOps kit provides everything needed for enterprise deployment, monitoring, security, and maintenance of the TerraBuild platform.