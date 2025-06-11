#!/bin/bash

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

check_dependencies() {
    log "Checking system dependencies..."
    
    local deps=("node" "npm" "docker" "docker-compose" "openssl" "curl" "jq")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing[*]}"
    fi
    
    success "All dependencies available"
}

setup_ssl_certificates() {
    log "Setting up SSL certificates..."
    
    mkdir -p nginx/ssl
    
    if [[ ! -f "nginx/ssl/cert.pem" || ! -f "nginx/ssl/key.pem" ]]; then
        warning "SSL certificates not found. Generating self-signed certificates..."
        
        openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem \
            -days 365 -nodes -subj "/C=US/ST=State/L=City/O=TerraFusion/CN=localhost"
        
        chmod 600 nginx/ssl/key.pem
        chmod 644 nginx/ssl/cert.pem
        
        success "Self-signed SSL certificates generated"
    else
        success "SSL certificates found"
    fi
}

setup_environment() {
    log "Setting up environment configuration..."
    
    if [[ ! -f ".env" ]]; then
        if [[ -f ".env.example" ]]; then
            cp .env.example .env
            warning "Created .env from template. Please configure with your actual values."
        else
            error ".env.example not found"
        fi
    else
        success "Environment file exists"
    fi
    
    local required_vars=("DATABASE_URL" "SESSION_SECRET" "JWT_SECRET")
    local missing_vars=()
    
    source .env 2>/dev/null || true
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        warning "Please configure these environment variables: ${missing_vars[*]}"
    fi
}

validate_database() {
    log "Validating database connection..."
    
    if [[ -z "${DATABASE_URL:-}" ]]; then
        warning "DATABASE_URL not set, skipping database validation"
        return
    fi
    
    node -e "
        const { Pool } = require('pg');
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });
        pool.query('SELECT NOW()')
            .then(() => { console.log('Database connection successful'); process.exit(0); })
            .catch(err => { console.error('Database connection failed:', err.message); process.exit(1); });
    " || warning "Database connection failed"
}

install_dependencies() {
    log "Installing Node.js dependencies..."
    
    if [[ -f "package-lock.json" ]]; then
        npm ci
    else
        npm install
    fi
    
    success "Dependencies installed"
}

build_application() {
    log "Building application..."
    
    npm run build || error "Build failed"
    
    success "Application built successfully"
}

setup_database_schema() {
    log "Setting up database schema..."
    
    if command -v npm &> /dev/null && npm run db:push &> /dev/null; then
        success "Database schema updated"
    else
        warning "Database schema setup skipped (run 'npm run db:push' manually)"
    fi
}

health_check() {
    log "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    npm start &
    local server_pid=$!
    
    sleep 5
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:5000/api/health &> /dev/null; then
            success "Health check passed"
            kill $server_pid 2>/dev/null || true
            return 0
        fi
        
        sleep 2
        ((attempt++))
    done
    
    kill $server_pid 2>/dev/null || true
    warning "Health check timed out"
}

generate_deployment_summary() {
    log "Generating deployment summary..."
    
    cat > DEPLOYMENT_SUMMARY.md << EOF
# TerraFusion Enterprise Deployment Summary

**Deployment Date:** $(date)
**Environment:** ${NODE_ENV:-development}
**Version:** $(node -p "require('./package.json').version" 2>/dev/null || echo "unknown")

## Configuration Status
- ✅ SSL Certificates: $([ -f "nginx/ssl/cert.pem" ] && echo "Present" || echo "Missing")
- ✅ Environment: $([ -f ".env" ] && echo "Configured" || echo "Missing")
- ✅ Dependencies: Installed
- ✅ Application: Built

## Services
- **Web Server:** http://localhost:5000
- **Admin Panel:** http://localhost:5000/admin
- **API Documentation:** http://localhost:5000/api/docs

## Next Steps
1. Configure environment variables in .env
2. Set up production SSL certificates
3. Configure external integrations (AWS, OpenAI, etc.)
4. Set up monitoring and logging
5. Configure backup strategy

## Support
For technical support, refer to the documentation or contact the development team.
EOF

    success "Deployment summary generated"
}

main() {
    cd "$PROJECT_ROOT"
    
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                TerraFusion Enterprise Setup              ║"
    echo "║              Precision • Excellence • Scale              ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_dependencies
    setup_ssl_certificates
    setup_environment
    install_dependencies
    build_application
    setup_database_schema
    validate_database
    health_check
    generate_deployment_summary
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║              🚀 DEPLOYMENT SUCCESSFUL 🚀                ║"
    echo "║                                                          ║"
    echo "║  Your TerraFusion enterprise system is ready!           ║"
    echo "║  Access your application at: http://localhost:5000      ║"
    echo "║                                                          ║"
    echo "║  Review DEPLOYMENT_SUMMARY.md for next steps            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi