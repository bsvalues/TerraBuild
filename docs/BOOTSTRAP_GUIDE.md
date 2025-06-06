# TerraBuild Enterprise Bootstrap Guide

## Quick Start (5 Minutes)

### 1. Prerequisites Check
```bash
# Verify system requirements
node --version    # Should be 18+ 
npm --version     # Should be 8+
docker --version  # Should be 20+
git --version     # Should be 2.25+
```

### 2. Clone and Deploy
```bash
git clone <repository-url> terrabuild
cd terrabuild
chmod +x deploy.sh
./deploy.sh production
```

### 3. Access System
- **URL**: http://localhost:5000
- **Login**: admin / admin123
- **Change password immediately in production**

## Detailed Setup Instructions

### Environment Configuration

#### 1. Create Environment File
```bash
cp .env.example .env
```

#### 2. Configure Database
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/terrabuild
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=terrabuild
```

#### 3. AI Services Configuration
```env
# Local LLM Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
EMBEDDING_MODEL=nomic-embed-text

# Vector Database
CHROMA_URL=http://localhost:8000
VECTOR_COLLECTION=terrabuild_docs

# AI Agent Configuration
AGENT_SWARM_SIZE=6
AGENT_COORDINATION=true
```

#### 4. Security Settings
```env
# Security Configuration
NETWORK_RESTRICTIVE_MODE=true
VPN_REQUIRED=false
SSL_ENFORCEMENT=true
CERTIFICATE_VALIDATION=true

# Allowed Domains (comma-separated)
ALLOWED_DOMAINS=github.com,npmjs.com,docker.io

# Network Ports
ALLOWED_PORTS=80,443,5000,5432,11434,8000
```

### Development Environment Setup

#### 1. Install Dependencies
```bash
npm install
```

#### 2. Database Setup
```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Run migrations
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

#### 3. Start Development Server
```bash
npm run dev
```

#### 4. Start AI Services
```bash
# Start Ollama
docker-compose up -d ollama

# Start Vector Database
docker-compose up -d chroma

# Pull AI models
docker exec terrabuild-ollama-1 ollama pull llama3.2:3b
docker exec terrabuild-ollama-1 ollama pull nomic-embed-text
```

### Production Deployment

#### 1. Automated Production Setup
```bash
./deploy.sh production
```

#### 2. Manual Production Setup
```bash
# Build application
npm run build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Apply security configuration
sudo ./firewall-setup.sh
sudo ./generate-certificates.sh
```

#### 3. Verify Deployment
```bash
# Health check
curl -f http://localhost:5000/api/health

# Check services
docker-compose ps

# View logs
docker-compose logs -f
```

### Configuration Options

#### AI Agent Configuration
```json
{
  "swarmSize": 6,
  "agents": [
    {
      "id": "development-agent",
      "type": "development",
      "priority": 9,
      "resources": {
        "cpu": 2,
        "memory": 4096,
        "storage": 10240
      }
    }
  ],
  "coordination": true,
  "loadBalancing": "round-robin"
}
```

#### Security Policies
```json
{
  "restrictiveMode": true,
  "allowedDomains": [
    "github.com",
    "npmjs.com",
    "docker.io"
  ],
  "allowedPorts": [80, 443, 5000],
  "vpnRequired": false,
  "certificateValidation": true
}
```

### Data Import

#### 1. Property Data Import
```bash
# Import property CSV files
node scripts/import-properties.js path/to/properties.csv

# Import cost matrix data
node scripts/import-cost-matrix.js path/to/cost_matrix.xlsx

# Import building types
node scripts/import-building-types.js path/to/building_types.csv
```

#### 2. GIS Data Import
```bash
# Import shapefiles
node scripts/import-shapefile.js path/to/parcels.shp

# Import KML boundaries
node scripts/import-kml.js path/to/boundaries.kml
```

### Monitoring and Maintenance

#### 1. System Health Monitoring
```bash
# Check system status
curl http://localhost:5000/api/health

# View agent metrics
curl http://localhost:5000/api/agents/metrics

# Database health
curl http://localhost:5000/api/database/health
```

#### 2. Log Management
```bash
# Application logs
docker-compose logs app

# Database logs
docker-compose logs postgres

# AI service logs
docker-compose logs ollama
docker-compose logs chroma
```

#### 3. Backup Procedures
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz ./

# Restore database
psql $DATABASE_URL < backup_20241206.sql
```

### Troubleshooting

#### Common Issues

1. **Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :5000

# Kill process using port
sudo kill -9 $(sudo lsof -t -i:5000)
```

2. **Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT 1"

# Reset database
docker-compose down postgres
docker volume rm terrabuild_postgres_data
docker-compose up -d postgres
```

3. **AI Service Issues**
```bash
# Restart Ollama
docker-compose restart ollama

# Check model availability
docker exec terrabuild-ollama-1 ollama list

# Pull missing models
docker exec terrabuild-ollama-1 ollama pull llama3.2:3b
```

4. **SSL Certificate Issues**
```bash
# Regenerate certificates
sudo ./generate-certificates.sh

# Verify certificate
openssl x509 -in server-cert.pem -text -noout
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Create indexes for performance
CREATE INDEX CONCURRENTLY idx_properties_geo_id ON properties(geo_id);
CREATE INDEX CONCURRENTLY idx_improvements_property_id ON improvements(property_id);
CREATE INDEX CONCURRENTLY idx_cost_matrices_region ON cost_matrices(region);
```

#### 2. Application Tuning
```env
# Node.js optimization
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=4096"

# Agent tuning
AGENT_CONCURRENCY=10
AGENT_TIMEOUT=30000
AGENT_RETRY_ATTEMPTS=3
```

#### 3. System Resources
```bash
# Monitor resource usage
htop
docker stats

# Adjust container resources
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

### Security Hardening

#### 1. Firewall Configuration
```bash
# Apply restrictive firewall rules
sudo ./firewall-setup.sh

# Verify firewall status
sudo ufw status verbose
```

#### 2. SSL/TLS Configuration
```bash
# Generate production certificates
sudo ./generate-certificates.sh

# Test SSL configuration
openssl s_client -connect localhost:443
```

#### 3. Access Control
```bash
# Create user accounts
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"assessor1","password":"secure_password","role":"assessor"}'
```

### Integration Guide

#### 1. GIS System Integration
```javascript
// ArcGIS integration example
const arcgisConfig = {
  serverUrl: "https://your-arcgis-server.com",
  username: "service_account",
  password: "service_password"
};
```

#### 2. ERP Integration
```javascript
// SAP integration example
const sapConfig = {
  host: "your-sap-server.com",
  port: 8000,
  client: "100",
  username: "integration_user",
  password: "integration_password"
};
```

### Advanced Configuration

#### 1. Multi-Tenant Setup
```env
# Enable multi-tenancy
MULTI_TENANT=true
TENANT_ISOLATION=schema
DEFAULT_TENANT=benton_county
```

#### 2. High Availability
```yaml
# docker-compose.ha.yml
version: '3.8'
services:
  app:
    deploy:
      replicas: 3
  postgres:
    deploy:
      replicas: 2
  redis:
    deploy:
      replicas: 2
```

#### 3. Load Balancing
```nginx
upstream terrabuild_backend {
    server app1:5000;
    server app2:5000;
    server app3:5000;
}

server {
    listen 80;
    location / {
        proxy_pass http://terrabuild_backend;
    }
}
```

## Support and Resources

- **Documentation**: ./docs/
- **API Reference**: http://localhost:5000/api/docs
- **Health Dashboard**: http://localhost:5000/health
- **Agent Monitor**: http://localhost:5000/agents

For technical support or questions, refer to the comprehensive documentation in the docs/ directory.