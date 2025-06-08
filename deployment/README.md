# TerraFusion Enterprise Deployment System

Professional-grade one-click deployment solution for TerraFusion property valuation platform with enterprise security, monitoring, and scalability.

## 🚀 Quick Start

### Desktop Application Deployment Manager

For the most user-friendly experience, use our enterprise desktop deployment manager:

```bash
# Navigate to desktop app directory
cd deployment/desktop-app

# Install dependencies
npm install

# Start the deployment manager
npm start
```

The desktop application provides:
- **Visual deployment progress** with real-time status updates
- **System prerequisite checking** with automated installation guidance
- **Configuration wizard** for cloud providers (AWS, GCP, Azure)
- **One-click deployment** with comprehensive error handling
- **Post-deployment monitoring** and health checks

### Command Line Deployment

For automated or scripted deployments:

```bash
# Make deployment script executable
chmod +x deployment/scripts/deploy.sh

# Deploy to production
./deployment/scripts/deploy.sh \
  --domain terrafusion.company.com \
  --email admin@company.com
```

## 📋 Prerequisites

### System Requirements
- **Operating System**: Linux, macOS, or Windows with WSL2
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 20GB available disk space
- **Network**: Stable internet connection for downloads

### Required Software
- **Docker** (v20.10+) and Docker Compose (v2.0+)
- **Node.js** (v18+) for desktop application
- **OpenSSL** for certificate generation
- **curl** for health checks

### Cloud Prerequisites
- **Domain name** pointing to your server
- **SSL certificate email** for Let's Encrypt
- **Cloud provider account** (AWS/GCP/Azure) with appropriate permissions

## 🎯 Deployment Options

### 1. Production Deployment
Full enterprise setup with monitoring, SSL, and backup:

```bash
./deployment/scripts/deploy.sh \
  --domain terrafusion.company.com \
  --email admin@company.com \
  --env production
```

### 2. Staging Deployment
Development environment with reduced resources:

```bash
./deployment/scripts/deploy.sh \
  --domain staging.company.com \
  --email admin@company.com \
  --env staging \
  --no-backup
```

### 3. Development with Logging
Full logging stack for debugging:

```bash
./deployment/scripts/deploy.sh \
  --domain dev.company.com \
  --email admin@company.com \
  --enable-logging \
  --no-monitoring
```

## 🏗️ Architecture Overview

### Core Services
- **TerraFusion Application**: Main property valuation platform
- **PostgreSQL Database**: Primary data storage with automated backups
- **Redis Cache**: Session management and performance optimization
- **Nginx/Traefik**: Load balancing and SSL termination

### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards and analytics
- **Node Exporter**: System metrics monitoring
- **Database Exporters**: PostgreSQL and Redis monitoring

### Security Features
- **Let's Encrypt SSL**: Automated certificate management
- **Container Security**: Non-root users and hardened images
- **Network Isolation**: Private Docker networks
- **Secret Management**: Encrypted credential storage

## 🔧 Configuration

### Environment Variables

The deployment automatically generates secure passwords, or you can set them manually:

```bash
export POSTGRES_PASSWORD="your-secure-password"
export REDIS_PASSWORD="your-redis-password"
export SESSION_SECRET="your-session-secret"
export JWT_SECRET="your-jwt-secret"
export GRAFANA_PASSWORD="your-grafana-password"
```

### Custom Domain Configuration

1. **DNS Setup**: Point your domain to the server IP
2. **SSL Certificates**: Automatically generated via Let's Encrypt
3. **Subdomain Access**:
   - Main app: `https://your-domain.com`
   - Monitoring: `https://grafana.your-domain.com`
   - Metrics: `https://prometheus.your-domain.com`

### Resource Scaling

Modify `docker-compose.prod.yml` for different resource requirements:

```yaml
services:
  terrafusion-app:
    deploy:
      replicas: 3  # Scale application instances
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
```

## 📊 Monitoring & Maintenance

### Health Checks

Monitor deployment status:

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# View application logs
docker-compose -f docker-compose.prod.yml logs -f terrafusion-app

# Check database health
docker-compose -f docker-compose.prod.yml exec db pg_isready
```

### Grafana Dashboards

Access monitoring at `https://grafana.your-domain.com`:

- **System Overview**: CPU, memory, disk usage
- **Application Metrics**: Response times, error rates
- **Database Performance**: Query performance, connections
- **Business Metrics**: Property valuations, user activity

### Backup Management

Automated backups run daily (if enabled):

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml run --rm backup

# Restore from backup
docker-compose -f docker-compose.prod.yml exec db psql -U terrafusion -d terrafusion < backup.sql
```

## 🔄 Updates & Maintenance

### Application Updates

Deploy new versions:

```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
./deployment/scripts/deploy.sh \
  --domain your-domain.com \
  --email your-email.com \
  --force-recreate
```

### Database Migrations

Migrations run automatically during deployment, or manually:

```bash
docker-compose -f docker-compose.prod.yml exec terrafusion-app npm run db:push
```

### SSL Certificate Renewal

Certificates auto-renew via Let's Encrypt. Manual renewal:

```bash
docker-compose -f docker-compose.prod.yml restart traefik
```

## 🚨 Troubleshooting

### Common Issues

#### Application Not Starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs terrafusion-app

# Verify database connection
docker-compose -f docker-compose.prod.yml exec db pg_isready
```

#### SSL Certificate Issues
```bash
# Check Traefik logs
docker-compose -f docker-compose.prod.yml logs traefik

# Verify DNS configuration
nslookup your-domain.com
```

#### Database Connection Errors
```bash
# Check database status
docker-compose -f docker-compose.prod.yml ps db

# Verify credentials
docker-compose -f docker-compose.prod.yml exec db psql -U terrafusion -d terrafusion
```

### Performance Optimization

#### Memory Issues
- Increase container memory limits
- Enable Redis for session caching
- Optimize database queries

#### Slow Response Times
- Enable CDN for static assets
- Scale application replicas
- Tune database configuration

## 🔐 Security Considerations

### Network Security
- All services run on isolated Docker networks
- Database not exposed to public internet
- SSL/TLS encryption for all external traffic

### Access Control
- Non-root container users
- Secret rotation procedures
- Audit logging (optional ELK stack)

### Backup Security
- Encrypted backup storage
- Regular backup testing
- Offsite backup replication

## 📞 Support

### Documentation
- [API Documentation](../API-ENDPOINTS.md)
- [Development Guide](../DEVELOPMENT_GUIDE.md)
- [Security Guidelines](../SECURITY.md)

### Getting Help
1. Check logs for error messages
2. Review troubleshooting section
3. Contact system administrator
4. Submit issue with deployment logs

## 📄 License

This deployment system is part of the TerraFusion platform. See LICENSE file for details.

---

**TerraFusion Enterprise Deployment System** - Professional property valuation platform deployment made simple.