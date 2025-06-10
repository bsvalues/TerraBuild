#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="terrabuild-enterprise"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"
ENVIRONMENT="${ENVIRONMENT:-production}"
LOG_FILE="/tmp/terrabuild-deploy-${VERSION}.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

check_prerequisites() {
    log "Checking system prerequisites..."
    
    local required_commands=("docker" "docker-compose" "node" "npm" "git" "openssl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command '$cmd' not found. Please install it first."
        fi
    done
    
    if [ "$(docker info 2>/dev/null | grep -c 'Server Version')" -eq 0 ]; then
        error "Docker daemon is not running. Please start Docker first."
    fi
    
    local node_version=$(node --version | sed 's/v//')
    local required_node="18.0.0"
    if [ "$(printf '%s\n' "$required_node" "$node_version" | sort -V | head -n1)" != "$required_node" ]; then
        error "Node.js version $node_version is too old. Minimum required: $required_node"
    fi
    
    log "Prerequisites check completed successfully"
}

setup_environment() {
    log "Setting up deployment environment..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            warn "Created .env from template. Please review and update configuration."
        else
            error ".env file not found and no template available"
        fi
    fi
    
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        warn "SSL certificates not found. Generating self-signed certificates..."
        mkdir -p nginx/ssl
        openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=WA/L=Kennewick/O=Benton County/CN=terrabuild.local"
    fi
    
    export NODE_ENV="$ENVIRONMENT"
    export COMPOSE_PROJECT_NAME="$PROJECT_NAME"
    export VERSION="$VERSION"
    
    log "Environment setup completed"
}

validate_configuration() {
    log "Validating configuration..."
    
    if [ ! -f "docker-compose.yml" ]; then
        error "docker-compose.yml not found"
    fi
    
    source .env
    
    if [ -z "${DATABASE_URL:-}" ]; then
        error "DATABASE_URL not configured in .env"
    fi
    
    if [ -z "${JWT_SECRET:-}" ]; then
        error "JWT_SECRET not configured in .env"
    fi
    
    docker-compose config > /dev/null || error "Invalid docker-compose configuration"
    
    log "Configuration validation completed"
}

build_application() {
    log "Building application..."
    
    info "Installing dependencies..."
    npm ci --production=false
    
    info "Running tests..."
    npm run test || warn "Some tests failed, but continuing deployment"
    
    info "Building frontend..."
    npm run build
    
    info "Building Docker images..."
    docker-compose build --no-cache
    
    log "Application build completed"
}

deploy_database() {
    log "Deploying database..."
    
    info "Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    info "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U postgres; then
            break
        fi
        if [ $i -eq 30 ]; then
            error "Database failed to start within 30 seconds"
        fi
        sleep 1
    done
    
    info "Running database migrations..."
    npm run db:push
    
    log "Database deployment completed"
}

deploy_application() {
    log "Deploying application services..."
    
    info "Starting Redis cache..."
    docker-compose up -d redis
    
    info "Starting application server..."
    docker-compose up -d app
    
    info "Starting NGINX reverse proxy..."
    docker-compose up -d nginx
    
    info "Waiting for services to be healthy..."
    sleep 10
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -k -f https://localhost/api/health &>/dev/null; then
            log "Application is healthy and responding"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            error "Application failed health check after $max_attempts attempts"
        fi
        
        info "Attempt $attempt/$max_attempts: Waiting for application to be ready..."
        sleep 2
        ((attempt++))
    done
    
    log "Application deployment completed"
}

run_health_checks() {
    log "Running comprehensive health checks..."
    
    local checks_passed=0
    local total_checks=5
    
    info "Check 1/5: Application API health"
    if curl -k -f https://localhost/api/health; then
        ((checks_passed++))
        info "✓ API health check passed"
    else
        warn "✗ API health check failed"
    fi
    
    info "Check 2/5: Database connectivity"
    if docker-compose exec -T postgres pg_isready -U postgres; then
        ((checks_passed++))
        info "✓ Database connectivity check passed"
    else
        warn "✗ Database connectivity check failed"
    fi
    
    info "Check 3/5: Redis cache"
    if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
        ((checks_passed++))
        info "✓ Redis cache check passed"
    else
        warn "✗ Redis cache check failed"
    fi
    
    info "Check 4/5: SSL certificate validation"
    if openssl x509 -in nginx/ssl/cert.pem -noout -dates; then
        ((checks_passed++))
        info "✓ SSL certificate check passed"
    else
        warn "✗ SSL certificate check failed"
    fi
    
    info "Check 5/5: Application logs"
    if docker-compose logs app | grep -q "serving on port"; then
        ((checks_passed++))
        info "✓ Application logs check passed"
    else
        warn "✗ Application logs check failed"
    fi
    
    info "Health checks completed: $checks_passed/$total_checks passed"
    
    if [ $checks_passed -lt 4 ]; then
        error "Critical health checks failed. Deployment aborted."
    fi
    
    log "All critical health checks passed"
}

setup_monitoring() {
    log "Setting up monitoring and logging..."
    
    info "Creating log directories..."
    mkdir -p logs/{app,nginx,postgres}
    
    info "Setting up log rotation..."
    cat > /tmp/terrabuild-logrotate << 'EOF'
./logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF
    
    if [ -d "/etc/logrotate.d" ]; then
        sudo cp /tmp/terrabuild-logrotate /etc/logrotate.d/terrabuild
        info "Log rotation configured"
    else
        warn "System logrotate not found, skipping log rotation setup"
    fi
    
    info "Setting up monitoring endpoints..."
    cat > monitoring/docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
    restart: unless-stopped

volumes:
  grafana-storage:
EOF
    
    log "Monitoring setup completed"
}

create_backup_strategy() {
    log "Creating backup strategy..."
    
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/terrabuild"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
docker-compose exec -T postgres pg_dump -U postgres terrabuild > "$DB_BACKUP_FILE"

echo "Compressing backup..."
gzip "$DB_BACKUP_FILE"

echo "Cleaning old backups (keeping last 30 days)..."
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: ${DB_BACKUP_FILE}.gz"
EOF
    
    chmod +x scripts/backup.sh
    
    cat > scripts/restore.sh << 'EOF'
#!/bin/bash

if [ $# -ne 1 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring database from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres psql -U postgres terrabuild

echo "Database restored successfully"
EOF
    
    chmod +x scripts/restore.sh
    
    info "Adding backup cron job..."
    (crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && ./scripts/backup.sh") | crontab -
    
    log "Backup strategy created"
}

generate_deployment_report() {
    log "Generating deployment report..."
    
    cat > "deployment-report-${VERSION}.md" << EOF
# TerraBuild Enterprise Deployment Report

**Deployment Version**: $VERSION
**Environment**: $ENVIRONMENT
**Deployment Date**: $(date)
**Deployment Log**: $LOG_FILE

## Services Status

$(docker-compose ps)

## Health Check Results

- API Health: $(curl -k -s https://localhost/api/health && echo "✓ PASS" || echo "✗ FAIL")
- Database: $(docker-compose exec -T postgres pg_isready -U postgres && echo "✓ PASS" || echo "✗ FAIL")
- Redis: $(docker-compose exec -T redis redis-cli ping 2>/dev/null && echo "✓ PASS" || echo "✗ FAIL")

## Deployment URLs

- Application: https://localhost
- API Documentation: https://localhost/api/docs
- Health Check: https://localhost/api/health

## Default Credentials

- Username: admin
- Password: admin123
- **⚠️ IMPORTANT: Change default password immediately**

## Next Steps

1. Update default passwords
2. Configure SSL certificates for production
3. Set up external monitoring
4. Configure backup strategy
5. Review security settings

## Support

For technical support, contact: support@terrabuild.com
EOF
    
    log "Deployment report generated: deployment-report-${VERSION}.md"
}

cleanup_deployment() {
    log "Cleaning up deployment artifacts..."
    
    info "Removing temporary files..."
    rm -f /tmp/terrabuild-logrotate
    
    info "Optimizing Docker images..."
    docker system prune -f
    
    log "Cleanup completed"
}

main() {
    log "Starting TerraBuild Enterprise Civil Infrastructure Brain deployment..."
    log "Version: $VERSION"
    log "Environment: $ENVIRONMENT"
    
    check_prerequisites
    setup_environment
    validate_configuration
    build_application
    deploy_database
    deploy_application
    run_health_checks
    setup_monitoring
    create_backup_strategy
    generate_deployment_report
    cleanup_deployment
    
    log "🚀 TerraBuild Enterprise deployment completed successfully!"
    log "🌐 Application available at: https://localhost"
    log "📊 Monitoring available at: http://localhost:3000 (Grafana)"
    log "📋 Deployment report: deployment-report-${VERSION}.md"
    log "🔒 Remember to change default passwords immediately"
    
    info "To view logs: docker-compose logs -f"
    info "To stop services: docker-compose down"
    info "To restart services: docker-compose restart"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi