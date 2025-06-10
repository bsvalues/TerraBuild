# TerraBuild Enterprise Bootstrap Setup Guide

## Enterprise-Grade Setup Process

### System Requirements

**Minimum Specifications:**
- CPU: 8+ cores (16 recommended for production)
- RAM: 16GB minimum (32GB recommended)
- Storage: 500GB SSD (1TB+ for production)
- Network: 1Gbps connection
- OS: Ubuntu 20.04 LTS, CentOS 8, or Windows Server 2019+

### Pre-Installation Checklist

1. **Network Configuration**
   - Firewall ports configured (80, 443, 5432, 5000)
   - DNS records pointing to server
   - SSL certificates obtained

2. **Security Preparation**
   - Administrative access configured
   - Security scanning completed
   - Backup strategy planned

3. **Database Setup**
   - PostgreSQL 14+ installed
   - PostGIS extension available
   - Database user with appropriate permissions

### Automated Bootstrap Script

Create and run the enterprise bootstrap script:

```bash
#!/bin/bash
# enterprise-bootstrap.sh

set -euo pipefail

# Configuration
TERRABUILD_VERSION="latest"
DB_NAME="terrabuild_prod"
SSL_DIR="/etc/ssl/terrabuild"
LOG_DIR="/var/log/terrabuild"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# System validation
validate_system() {
    log_info "Validating system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS_TYPE="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS_TYPE="macos"
    else
        log_error "Unsupported operating system"
        exit 1
    fi
    
    # Check memory
    TOTAL_MEM=$(free -g | awk 'NR==2{print $2}')
    if [ "$TOTAL_MEM" -lt 16 ]; then
        log_error "Insufficient memory. Required: 16GB, Available: ${TOTAL_MEM}GB"
        exit 1
    fi
    
    # Check disk space
    DISK_SPACE=$(df / | awk 'NR==2 {print int($4/1048576)}')
    if [ "$DISK_SPACE" -lt 100 ]; then
        log_error "Insufficient disk space. Required: 100GB, Available: ${DISK_SPACE}GB"
        exit 1
    fi
    
    log_info "System requirements validated successfully"
}

# Install dependencies
install_dependencies() {
    log_info "Installing system dependencies..."
    
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        apt-get update
        apt-get install -y curl wget git nginx postgresql-14 postgresql-contrib postgresql-14-postgis-3 redis-server nodejs npm docker.io docker-compose
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        yum update -y
        yum install -y curl wget git nginx postgresql14-server postgresql14-contrib postgis33_14 redis nodejs npm docker docker-compose
    else
        log_error "Unsupported package manager"
        exit 1
    fi
    
    # Install Node.js 18+
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    
    log_info "Dependencies installed successfully"
}

# Configure database
setup_database() {
    log_info "Configuring PostgreSQL database..."
    
    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};"
    sudo -u postgres psql -c "CREATE USER terrabuild WITH ENCRYPTED PASSWORD 'secure_password';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO terrabuild;"
    
    # Enable extensions
    sudo -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS postgis;"
    sudo -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
    sudo -u postgres psql -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
    
    log_info "Database configured successfully"
}

# Configure SSL
setup_ssl() {
    log_info "Configuring SSL certificates..."
    
    mkdir -p "$SSL_DIR"
    
    if [ -f "/tmp/cert.pem" ] && [ -f "/tmp/key.pem" ]; then
        cp /tmp/cert.pem "$SSL_DIR/"
        cp /tmp/key.pem "$SSL_DIR/"
        chmod 600 "$SSL_DIR"/*.pem
    else
        log_warn "SSL certificates not found. Generating self-signed certificates..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/key.pem" \
            -out "$SSL_DIR/cert.pem" \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    fi
    
    log_info "SSL certificates configured"
}

# Deploy application
deploy_application() {
    log_info "Deploying TerraBuild application..."
    
    # Create application directory
    mkdir -p /opt/terrabuild
    cd /opt/terrabuild
    
    # Clone or copy application
    if [ -d "/tmp/terrabuild" ]; then
        cp -r /tmp/terrabuild/* .
    else
        git clone https://github.com/your-org/terrabuild.git .
    fi
    
    # Install dependencies
    npm install --production
    
    # Build application
    npm run build
    
    # Configure environment
    cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://terrabuild:secure_password@localhost:5432/${DB_NAME}
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
SSL_CERT_PATH=${SSL_DIR}/cert.pem
SSL_KEY_PATH=${SSL_DIR}/key.pem
EOF
    
    # Run database migrations
    npm run db:push
    
    log_info "Application deployed successfully"
}

# Configure reverse proxy
setup_nginx() {
    log_info "Configuring NGINX reverse proxy..."
    
    cat > /etc/nginx/sites-available/terrabuild << 'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name _;
    
    ssl_certificate /etc/ssl/terrabuild/cert.pem;
    ssl_certificate_key /etc/ssl/terrabuild/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/terrabuild /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload NGINX
    nginx -t
    systemctl reload nginx
    systemctl enable nginx
    
    log_info "NGINX configured successfully"
}

# Setup monitoring
setup_monitoring() {
    log_info "Configuring monitoring and logging..."
    
    # Create log directories
    mkdir -p "$LOG_DIR"
    chown -R www-data:www-data "$LOG_DIR"
    
    # Configure log rotation
    cat > /etc/logrotate.d/terrabuild << EOF
${LOG_DIR}/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
}
EOF
    
    # Setup systemd service
    cat > /etc/systemd/system/terrabuild.service << EOF
[Unit]
Description=TerraBuild Enterprise Application
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/terrabuild
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl daemon-reload
    systemctl enable terrabuild
    systemctl start terrabuild
    
    log_info "Monitoring and services configured"
}

# Health check
health_check() {
    log_info "Performing health checks..."
    
    # Wait for application to start
    sleep 10
    
    # Check database connection
    if ! sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Database health check failed"
        exit 1
    fi
    
    # Check application health
    if ! curl -k -f https://localhost/api/health > /dev/null 2>&1; then
        log_error "Application health check failed"
        exit 1
    fi
    
    # Check SSL certificate
    if ! openssl x509 -in "$SSL_DIR/cert.pem" -noout -dates > /dev/null 2>&1; then
        log_error "SSL certificate validation failed"
        exit 1
    fi
    
    log_info "All health checks passed"
}

# Main execution
main() {
    log_info "Starting TerraBuild Enterprise Bootstrap..."
    
    validate_system
    install_dependencies
    setup_database
    setup_ssl
    deploy_application
    setup_nginx
    setup_monitoring
    health_check
    
    log_info "TerraBuild Enterprise installation completed successfully!"
    log_info "Application available at: https://$(hostname -f)"
    log_info "Default credentials: admin/admin123"
    log_info "Please change default passwords immediately"
}

# Run main function
main "$@"
```

### Manual Installation Steps

If automated bootstrap fails, follow these manual steps:

#### 1. System Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git nginx postgresql-14 postgresql-contrib \
    postgresql-14-postgis-3 redis-server nodejs npm docker.io docker-compose

# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 2. Database Configuration

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres createdb terrabuild_prod
sudo -u postgres createuser -P terrabuild

# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE terrabuild_prod TO terrabuild;"

# Enable extensions
sudo -u postgres psql -d terrabuild_prod -c "CREATE EXTENSION postgis;"
sudo -u postgres psql -d terrabuild_prod -c "CREATE EXTENSION \"uuid-ossp\";"
```

#### 3. Application Deployment

```bash
# Create application directory
sudo mkdir -p /opt/terrabuild
sudo chown $USER:$USER /opt/terrabuild
cd /opt/terrabuild

# Clone application
git clone <repository-url> .

# Install dependencies
npm install --production

# Configure environment
cp .env.example .env
# Edit .env with production values

# Run migrations
npm run db:push

# Build application
npm run build
```

#### 4. Service Configuration

```bash
# Create systemd service
sudo tee /etc/systemd/system/terrabuild.service << EOF
[Unit]
Description=TerraBuild Enterprise
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/terrabuild
ExecStart=/usr/bin/node server/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable terrabuild
sudo systemctl start terrabuild
```

### Post-Installation Security

#### 1. Secure Database

```bash
# Change default passwords
sudo -u postgres psql -c "ALTER USER terrabuild PASSWORD 'your_secure_password';"

# Configure pg_hba.conf for security
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Change 'trust' to 'md5' for local connections
```

#### 2. Configure SSL

```bash
# Generate certificates (if not provided)
sudo mkdir -p /etc/ssl/terrabuild
sudo openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
    -keyout /etc/ssl/terrabuild/key.pem \
    -out /etc/ssl/terrabuild/cert.pem

# Set permissions
sudo chmod 600 /etc/ssl/terrabuild/*.pem
```

#### 3. Firewall Configuration

```bash
# Configure iptables rules
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -P INPUT DROP

# Save rules
sudo iptables-save > /etc/iptables/rules.v4
```

### Verification Steps

#### 1. Application Health

```bash
# Check application status
sudo systemctl status terrabuild

# Verify database connection
curl -k https://localhost/api/health

# Check logs
sudo journalctl -u terrabuild -f
```

#### 2. Performance Testing

```bash
# Load test
npm install -g artillery
artillery quick --count 100 --num 10 https://localhost/api/health

# Database performance
sudo -u postgres psql -d terrabuild_prod -c "EXPLAIN ANALYZE SELECT COUNT(*) FROM properties;"
```

### Troubleshooting

#### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL service: `sudo systemctl status postgresql`
   - Verify credentials in .env file
   - Check pg_hba.conf configuration

2. **SSL Certificate Errors**
   - Verify certificate files exist and have correct permissions
   - Check NGINX SSL configuration
   - Test certificate: `openssl x509 -in cert.pem -text -noout`

3. **Application Won't Start**
   - Check logs: `sudo journalctl -u terrabuild`
   - Verify Node.js version: `node --version`
   - Check port availability: `sudo netstat -tlnp | grep 5000`

#### Log Locations

- Application logs: `/var/log/terrabuild/`
- NGINX logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`
- System logs: `journalctl -u terrabuild`

### Support Contacts

- **Technical Support**: support@terrabuild.com
- **Emergency Hotline**: +1-800-TERRA-BUILD
- **Documentation**: https://docs.terrabuild.com

This bootstrap guide ensures enterprise-grade deployment with security, monitoring, and reliability built-in from day one.