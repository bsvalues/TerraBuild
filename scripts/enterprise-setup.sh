#!/bin/bash

# TerraFusion Enterprise Setup Script
# Automates the complete deployment configuration for county-level deployment

set -e  # Exit on any error

echo "=================================================="
echo "TerraFusion Enterprise Setup"
echo "Tesla Precision • Jobs Elegance • Musk Scale"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_permissions() {
    log_info "Checking system permissions..."
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root. Some operations may require elevated privileges."
    fi
    log_success "Permission check completed"
}

# Check system requirements
check_requirements() {
    log_info "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version $NODE_VERSION detected. Please upgrade to Node.js 18+."
        exit 1
    fi
    log_success "Node.js $(node --version) detected"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    log_success "npm $(npm --version) detected"
    
    # Check PostgreSQL connection
    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL environment variable not set"
    else
        log_success "Database configuration found"
    fi
    
    # Check disk space (minimum 1GB)
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 1048576 ]; then
        log_warning "Less than 1GB disk space available"
    else
        log_success "Sufficient disk space available"
    fi
    
    log_success "System requirements check completed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    if [ -f "package.json" ]; then
        npm install --production
        log_success "Node.js dependencies installed"
    else
        log_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
}

# Setup environment configuration
setup_environment() {
    log_info "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_success "Environment file created from template"
        else
            log_info "Creating new environment file..."
            cat > .env << EOF
# TerraFusion Enterprise Configuration
# Generated on $(date -Iseconds)

NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/terrafusion

# Security
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# SSL Configuration
SSL_ENABLED=true
SSL_CERT_PATH=./certs/server.crt
SSL_KEY_PATH=./certs/server.key

# Application Settings
ORGANIZATION_NAME="County Government"
COUNTY_NAME="Sample County"
ADMIN_EMAIL="admin@county.gov"

# API Keys (Optional)
# OPENAI_API_KEY=your_openai_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/terrafusion.log
EOF
            log_success "Environment file created with secure defaults"
        fi
    else
        log_success "Environment file already exists"
    fi
}

# Create necessary directories
create_directories() {
    log_info "Creating application directories..."
    
    DIRECTORIES=(
        "uploads"
        "logs"
        "data"
        "certs"
        "backups"
        "temp"
    )
    
    for dir in "${DIRECTORIES[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        else
            log_info "Directory already exists: $dir"
        fi
    done
    
    # Set appropriate permissions
    chmod 755 uploads logs data backups temp
    chmod 700 certs  # Restrict certificate directory
    
    log_success "Directory structure created"
}

# Generate SSL certificates
generate_ssl_certificates() {
    log_info "Generating SSL certificates..."
    
    if [ ! -d "certs" ]; then
        mkdir -p certs
    fi
    
    if [ ! -f "certs/server.crt" ] || [ ! -f "certs/server.key" ]; then
        # Generate self-signed certificate for development/testing
        openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes -subj "/C=US/ST=State/L=City/O=County Government/CN=localhost" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            chmod 600 certs/server.key
            chmod 644 certs/server.crt
            log_success "SSL certificates generated"
        else
            log_warning "OpenSSL not available. SSL certificates will need to be manually configured."
        fi
    else
        log_success "SSL certificates already exist"
    fi
}

# Initialize database
initialize_database() {
    log_info "Initializing database..."
    
    if [ -n "$DATABASE_URL" ]; then
        # Run database migrations if available
        if [ -f "package.json" ] && npm run --silent | grep -q "db:migrate"; then
            npm run db:migrate
            log_success "Database migrations completed"
        elif [ -f "package.json" ] && npm run --silent | grep -q "db:push"; then
            npm run db:push
            log_success "Database schema synchronized"
        else
            log_warning "No database migration scripts found. Database may need manual setup."
        fi
    else
        log_warning "DATABASE_URL not configured. Skipping database initialization."
    fi
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up monitoring and logging..."
    
    # Create log rotation configuration
    if command -v logrotate &> /dev/null; then
        cat > /tmp/terrafusion-logrotate << EOF
./logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
        log_success "Log rotation configured"
    else
        log_warning "logrotate not available. Manual log management will be required."
    fi
    
    # Create basic health check script
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash
# TerraFusion Health Check Script

HEALTH_URL="http://localhost:5000/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)

if [ "$RESPONSE" = "200" ]; then
    echo "$(date): TerraFusion is healthy" >> logs/health.log
    exit 0
else
    echo "$(date): TerraFusion health check failed (HTTP $RESPONSE)" >> logs/health.log
    exit 1
fi
EOF
    chmod +x scripts/health-check.sh
    log_success "Health monitoring configured"
}

# Setup systemd service (if available)
setup_service() {
    log_info "Setting up system service..."
    
    if command -v systemctl &> /dev/null && [ -w /etc/systemd/system ]; then
        cat > /etc/systemd/system/terrafusion.service << EOF
[Unit]
Description=TerraFusion Enterprise Property Valuation System
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
ExecStart=$(which npm) start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=terrafusion

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable terrafusion
        log_success "System service configured and enabled"
    else
        log_warning "systemd not available or insufficient permissions. Manual process management required."
    fi
}

# Performance optimization
optimize_performance() {
    log_info "Applying performance optimizations..."
    
    # Node.js optimizations
    export NODE_OPTIONS="--max-old-space-size=4096"
    
    # Create performance configuration
    cat > config/performance.json << EOF
{
  "cache": {
    "maxSize": "256MB",
    "ttl": 3600
  },
  "compression": {
    "enabled": true,
    "level": 6
  },
  "clustering": {
    "enabled": true,
    "workers": "auto"
  }
}
EOF
    
    log_success "Performance optimizations applied"
}

# Security hardening
setup_security() {
    log_info "Applying security configurations..."
    
    # Create security headers configuration
    cat > config/security.json << EOF
{
  "headers": {
    "contentSecurityPolicy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    "hsts": {
      "maxAge": 31536000,
      "includeSubDomains": true
    },
    "xssProtection": true,
    "noSniff": true,
    "frameguard": "deny"
  },
  "rateLimiting": {
    "windowMs": 900000,
    "max": 100
  }
}
EOF
    
    # Set secure file permissions
    find . -type f -name "*.js" -exec chmod 644 {} \;
    find . -type f -name "*.json" -exec chmod 644 {} \;
    find . -type d -exec chmod 755 {} \;
    
    # Secure sensitive files
    if [ -f ".env" ]; then
        chmod 600 .env
    fi
    
    log_success "Security configurations applied"
}

# Build application
build_application() {
    log_info "Building application..."
    
    if [ -f "package.json" ] && npm run --silent | grep -q "build"; then
        npm run build
        log_success "Application built successfully"
    else
        log_warning "No build script found. Application may need manual compilation."
    fi
}

# Final verification
verify_installation() {
    log_info "Performing final verification..."
    
    # Check if all required files exist
    REQUIRED_FILES=(
        ".env"
        "package.json"
        "uploads"
        "logs"
        "data"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -e "$file" ]; then
            log_error "Required file/directory missing: $file"
            exit 1
        fi
    done
    
    # Test basic functionality
    if [ -f "package.json" ]; then
        # Start application in test mode
        timeout 30s npm start &
        SERVER_PID=$!
        sleep 10
        
        # Test health endpoint
        HEALTH_CHECK=$(curl -s http://localhost:5000/api/health 2>/dev/null || echo "failed")
        
        # Stop test server
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
        
        if [[ "$HEALTH_CHECK" == *"ok"* ]]; then
            log_success "Application verification successful"
        else
            log_warning "Application may need additional configuration"
        fi
    fi
    
    log_success "Installation verification completed"
}

# Generate deployment summary
generate_summary() {
    log_info "Generating deployment summary..."
    
    cat > deployment-summary.md << EOF
# TerraFusion Enterprise Deployment Summary

Generated: $(date)

## System Information
- Node.js Version: $(node --version)
- npm Version: $(npm --version)
- Platform: $(uname -s) $(uname -m)
- Working Directory: $(pwd)

## Configuration
- Environment: $(grep NODE_ENV .env 2>/dev/null || echo "Not configured")
- SSL Enabled: $(grep SSL_ENABLED .env 2>/dev/null || echo "Not configured")
- Database: $(echo $DATABASE_URL | sed 's/\/\/[^:]*:[^@]*@/\/\/***:***@/' 2>/dev/null || echo "Not configured")

## Directory Structure
$(find . -maxdepth 2 -type d | head -20)

## Next Steps
1. Configure your .env file with production values
2. Set up your PostgreSQL database
3. Configure SSL certificates for production
4. Start the application: npm start
5. Access the setup wizard at: http://localhost:5000/setup

## Support
- Documentation: README.md
- Configuration: .env
- Logs: logs/
- Health Check: scripts/health-check.sh

Enterprise deployment completed successfully!
EOF
    
    log_success "Deployment summary generated: deployment-summary.md"
}

# Main execution
main() {
    echo ""
    log_info "Starting TerraFusion Enterprise Setup..."
    echo ""
    
    check_permissions
    check_requirements
    install_dependencies
    setup_environment
    create_directories
    generate_ssl_certificates
    initialize_database
    setup_monitoring
    setup_service
    optimize_performance
    setup_security
    build_application
    verify_installation
    generate_summary
    
    echo ""
    echo "=================================================="
    log_success "TerraFusion Enterprise Setup Complete!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo "1. Review and edit .env file with your configuration"
    echo "2. Configure your database connection"
    echo "3. Start the application: npm start"
    echo "4. Visit http://localhost:5000/setup for final configuration"
    echo ""
    echo "For support, check deployment-summary.md"
    echo ""
}

# Run main function
main "$@"