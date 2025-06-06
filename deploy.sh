#!/bin/bash

set -e

echo "🚀 TerraBuild Enterprise Deployment Script"
echo "==========================================="

PROJECT_NAME="terrabuild"
VERSION="1.0.0"
DEPLOYMENT_MODE="${1:-production}"

check_requirements() {
    echo "Checking system requirements..."
    
    REQUIRED_TOOLS=("docker" "docker-compose" "node" "npm" "git")
    
    for tool in "${REQUIRED_TOOLS[@]}"; do
        if ! command -v $tool &> /dev/null; then
            echo "❌ $tool is required but not installed"
            exit 1
        fi
    done
    
    echo "✅ All requirements satisfied"
}

setup_environment() {
    echo "Setting up environment for $DEPLOYMENT_MODE..."
    
    if [ ! -f .env ]; then
        cp .env.example .env 2>/dev/null || echo "Warning: No .env.example found"
    fi
    
    if [ "$DEPLOYMENT_MODE" = "production" ]; then
        export NODE_ENV=production
    else
        export NODE_ENV=development
    fi
}

build_application() {
    echo "Building application..."
    
    npm ci --only=production
    npm run build
    
    echo "✅ Application built successfully"
}

setup_database() {
    echo "Setting up database..."
    
    if [ -z "$DATABASE_URL" ]; then
        echo "📊 Starting PostgreSQL container..."
        docker-compose up -d postgres
        
        sleep 10
        
        export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/terrabuild"
    fi
    
    echo "Running database migrations..."
    npm run db:push
    
    echo "✅ Database setup complete"
}

setup_ai_services() {
    echo "Setting up AI services..."
    
    if [ "$DEPLOYMENT_MODE" = "production" ]; then
        echo "📱 Starting Ollama service..."
        docker-compose up -d ollama
        
        echo "🧠 Starting vector database..."
        docker-compose up -d chroma
        
        sleep 15
        
        echo "📥 Pulling required AI models..."
        docker exec $(docker-compose ps -q ollama) ollama pull llama3.2:3b
        docker exec $(docker-compose ps -q ollama) ollama pull nomic-embed-text
    fi
    
    echo "✅ AI services configured"
}

apply_security_config() {
    echo "Applying enterprise security configuration..."
    
    if [ -f firewall-setup.sh ]; then
        echo "🔥 Configuring firewall rules..."
        chmod +x firewall-setup.sh
        
        if [ "$EUID" -eq 0 ]; then
            ./firewall-setup.sh
        else
            echo "⚠️  Run with sudo to apply firewall rules automatically"
            echo "   Or execute: sudo ./firewall-setup.sh"
        fi
    fi
    
    if [ -f generate-certificates.sh ]; then
        echo "🔐 Generating SSL certificates..."
        chmod +x generate-certificates.sh
        ./generate-certificates.sh
    fi
    
    echo "✅ Security configuration applied"
}

start_services() {
    echo "Starting services..."
    
    if [ "$DEPLOYMENT_MODE" = "production" ]; then
        docker-compose -f docker-compose.prod.yml up -d
    else
        npm run dev &
        APP_PID=$!
        echo $APP_PID > .app.pid
    fi
    
    echo "✅ Services started"
}

run_health_checks() {
    echo "Running health checks..."
    
    HEALTH_URL="http://localhost:5000/api/health"
    MAX_ATTEMPTS=30
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if curl -sf $HEALTH_URL > /dev/null 2>&1; then
            echo "✅ Application is healthy"
            break
        fi
        
        echo "⏳ Waiting for application to start (attempt $ATTEMPT/$MAX_ATTEMPTS)..."
        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done
    
    if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
        echo "❌ Health check failed"
        exit 1
    fi
}

generate_deployment_report() {
    echo "Generating deployment report..."
    
    cat > deployment-report.md << EOF
# TerraBuild Deployment Report

**Deployment Date:** $(date)
**Version:** $VERSION
**Mode:** $DEPLOYMENT_MODE
**Node.js Version:** $(node --version)
**Docker Version:** $(docker --version)

## Services Status

- ✅ Application Server
- ✅ PostgreSQL Database
$([ "$DEPLOYMENT_MODE" = "production" ] && echo "- ✅ Ollama AI Service")
$([ "$DEPLOYMENT_MODE" = "production" ] && echo "- ✅ Vector Database")
- ✅ Security Configuration

## Access Information

- **Application URL:** http://localhost:5000
- **Admin Panel:** http://localhost:5000/admin
- **API Documentation:** http://localhost:5000/api/docs

## Default Credentials

- **Username:** admin
- **Password:** admin123

⚠️  **Important:** Change default credentials immediately in production

## Next Steps

1. Configure environment variables in .env
2. Set up domain and SSL certificates
3. Configure backup procedures
4. Set up monitoring and alerting
5. Train users on the system

## Support

For technical support, contact the system administrator.
EOF
    
    echo "✅ Deployment report generated: deployment-report.md"
}

cleanup() {
    echo "Cleaning up temporary files..."
    rm -f .app.pid
}

main() {
    echo "Starting deployment process..."
    
    check_requirements
    setup_environment
    build_application
    setup_database
    setup_ai_services
    apply_security_config
    start_services
    run_health_checks
    generate_deployment_report
    
    echo ""
    echo "🎉 TerraBuild deployed successfully!"
    echo ""
    echo "📋 Access your application:"
    echo "   URL: http://localhost:5000"
    echo "   Admin: admin / admin123"
    echo ""
    echo "📄 View deployment report: deployment-report.md"
    echo ""
    
    if [ "$DEPLOYMENT_MODE" = "development" ]; then
        echo "💡 Development mode active - logs available in terminal"
        echo "   Stop with: npm run stop or kill -TERM \$(cat .app.pid)"
    else
        echo "💡 Production mode active - services running in background"
        echo "   View logs: docker-compose logs -f"
        echo "   Stop services: docker-compose down"
    fi
}

trap cleanup EXIT

main "$@"