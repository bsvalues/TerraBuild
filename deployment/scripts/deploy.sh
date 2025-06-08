#!/bin/bash

# TerraFusion One-Click Enterprise Deployment Script
# Automated production deployment with comprehensive monitoring and security

set -e
set -o pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_DIR="$PROJECT_ROOT/deployment"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
ENV_FILE="$PROJECT_ROOT/.env.prod"

# Default values
DOMAIN=""
EMAIL=""
ENVIRONMENT="production"
ENABLE_MONITORING=true
ENABLE_BACKUP=true
ENABLE_LOGGING=false
SKIP_BUILD=false
FORCE_RECREATE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}"
    echo "=================================="
    echo "$1"
    echo "=================================="
    echo -e "${NC}"
}

# Function to show usage
show_usage() {
    cat << EOF
TerraFusion Enterprise Deployment Script

Usage: $0 [OPTIONS]

OPTIONS:
    -d, --domain DOMAIN         Domain name for the deployment (required)
    -e, --email EMAIL          Email for SSL certificates (required)
    --env ENVIRONMENT          Environment: production, staging (default: production)
    --no-monitoring            Disable monitoring stack
    --no-backup                Disable backup service
    --enable-logging           Enable ELK logging stack
    --skip-build               Skip Docker image build
    --force-recreate           Force recreate all containers
    -h, --help                 Show this help message

Examples:
    $0 -d terrafusion.company.com -e admin@company.com
    $0 -d staging.company.com -e admin@company.com --env staging --no-backup
    $0 -d local.company.com -e admin@company.com --enable-logging --force-recreate

Environment Variables:
    POSTGRES_PASSWORD          Database password (will be generated if not set)
    REDIS_PASSWORD             Redis password (will be generated if not set)
    SESSION_SECRET             Session secret (will be generated if not set)
    JWT_SECRET                 JWT secret (will be generated if not set)
    GRAFANA_PASSWORD           Grafana admin password (will be generated if not set)

EOF
}

# Function to parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -e|--email)
                EMAIL="$2"
                shift 2
                ;;
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --no-monitoring)
                ENABLE_MONITORING=false
                shift
                ;;
            --no-backup)
                ENABLE_BACKUP=false
                shift
                ;;
            --enable-logging)
                ENABLE_LOGGING=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --force-recreate)
                FORCE_RECREATE=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "$DOMAIN" ]]; then
        print_error "Domain is required. Use -d or --domain option."
        show_usage
        exit 1
    fi

    if [[ -z "$EMAIL" ]]; then
        print_error "Email is required. Use -e or --email option."
        show_usage
        exit 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    local missing_tools=()

    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        missing_tools+=("docker-compose")
    fi

    # Check openssl for generating secrets
    if ! command -v openssl &> /dev/null; then
        missing_tools+=("openssl")
    fi

    # Check curl for health checks
    if ! command -v curl &> /dev/null; then
        missing_tools+=("curl")
    fi

    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install the missing tools and run again."
        exit 1
    fi

    # Check Docker daemon
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker and try again."
        exit 1
    fi

    print_success "All prerequisites are satisfied"
}

# Function to generate secure passwords
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to setup environment file
setup_environment() {
    print_header "Setting Up Environment"

    # Generate passwords if not set
    export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(generate_password)}"
    export REDIS_PASSWORD="${REDIS_PASSWORD:-$(generate_password)}"
    export SESSION_SECRET="${SESSION_SECRET:-$(generate_password)}"
    export JWT_SECRET="${JWT_SECRET:-$(generate_password)}"
    export GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-$(generate_password)}"
    export DOMAIN="$DOMAIN"
    export ACME_EMAIL="$EMAIL"

    # Create environment file
    cat > "$ENV_FILE" << EOF
# TerraFusion Production Environment Configuration
# Generated on $(date)

# Domain Configuration
DOMAIN=$DOMAIN
ACME_EMAIL=$EMAIL
ENVIRONMENT=$ENVIRONMENT

# Database Configuration
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# Cache Configuration
REDIS_PASSWORD=$REDIS_PASSWORD

# Application Security
SESSION_SECRET=$SESSION_SECRET
JWT_SECRET=$JWT_SECRET

# Monitoring
GRAFANA_PASSWORD=$GRAFANA_PASSWORD

# Feature Flags
ENABLE_MONITORING=$ENABLE_MONITORING
ENABLE_BACKUP=$ENABLE_BACKUP
ENABLE_LOGGING=$ENABLE_LOGGING
EOF

    print_success "Environment configuration created at $ENV_FILE"
    print_warning "Store these credentials securely:"
    echo "  Database Password: $POSTGRES_PASSWORD"
    echo "  Redis Password: $REDIS_PASSWORD"
    echo "  Grafana Password: $GRAFANA_PASSWORD"
}

# Function to build Docker images
build_images() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_status "Skipping Docker image build"
        return
    fi

    print_header "Building Docker Images"

    cd "$PROJECT_ROOT"
    
    print_status "Building TerraFusion application image..."
    docker build -t terrafusion:latest -f Dockerfile .
    
    print_success "Docker images built successfully"
}

# Function to setup Docker networks and volumes
setup_docker_resources() {
    print_header "Setting Up Docker Resources"

    # Create network if it doesn't exist
    if ! docker network ls | grep -q terrafusion-network; then
        print_status "Creating Docker network..."
        docker network create terrafusion-network
    fi

    print_success "Docker resources are ready"
}

# Function to deploy services
deploy_services() {
    print_header "Deploying Services"

    cd "$PROJECT_ROOT"

    # Build compose command
    local compose_cmd="docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE"
    local profiles=""

    # Add profiles based on configuration
    if [[ "$ENABLE_MONITORING" == "true" ]]; then
        profiles="$profiles"
    fi

    if [[ "$ENABLE_BACKUP" == "true" ]]; then
        profiles="$profiles,backup"
    fi

    if [[ "$ENABLE_LOGGING" == "true" ]]; then
        profiles="$profiles,logging"
    fi

    # Remove leading comma
    profiles="${profiles#,}"

    # Add profiles to command if any
    if [[ -n "$profiles" ]]; then
        compose_cmd="$compose_cmd --profile $profiles"
    fi

    # Deploy services
    if [[ "$FORCE_RECREATE" == "true" ]]; then
        print_status "Force recreating all services..."
        $compose_cmd up -d --force-recreate
    else
        print_status "Starting services..."
        $compose_cmd up -d
    fi

    print_success "Services deployed successfully"
}

# Function to wait for services to be healthy
wait_for_services() {
    print_header "Waiting for Services to be Ready"

    local max_attempts=60
    local attempt=1

    print_status "Waiting for database to be ready..."
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T db pg_isready -U terrafusion -d terrafusion &> /dev/null; then
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Database failed to start within timeout"
            exit 1
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for database..."
        sleep 5
        ((attempt++))
    done

    print_status "Waiting for application to be ready..."
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -sf "http://localhost:3000/api/health" &> /dev/null; then
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            print_error "Application failed to start within timeout"
            exit 1
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for application..."
        sleep 5
        ((attempt++))
    done

    print_success "All services are ready"
}

# Function to run database migrations
run_migrations() {
    print_header "Running Database Migrations"

    print_status "Executing database migrations..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T terrafusion-app npm run db:push

    print_success "Database migrations completed"
}

# Function to setup SSL certificates
setup_ssl() {
    print_header "Setting Up SSL Certificates"

    print_status "SSL certificates will be automatically generated by Let's Encrypt"
    print_status "Ensure DNS records point to this server before accessing via HTTPS"

    print_success "SSL setup completed"
}

# Function to display deployment summary
show_deployment_summary() {
    print_header "Deployment Summary"

    echo -e "${GREEN}🚀 TerraFusion has been successfully deployed!${NC}"
    echo
    echo "Access URLs:"
    echo "  Main Application: https://$DOMAIN"
    echo "  Traefik Dashboard: https://traefik.$DOMAIN"
    
    if [[ "$ENABLE_MONITORING" == "true" ]]; then
        echo "  Grafana Dashboard: https://grafana.$DOMAIN (admin/$GRAFANA_PASSWORD)"
        echo "  Prometheus: https://prometheus.$DOMAIN"
    fi
    
    if [[ "$ENABLE_LOGGING" == "true" ]]; then
        echo "  Kibana Dashboard: https://kibana.$DOMAIN"
    fi
    
    echo
    echo "Service Status:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    echo
    echo "Next Steps:"
    echo "1. Configure DNS records to point to this server"
    echo "2. Access the application at https://$DOMAIN"
    echo "3. Configure monitoring alerts (if enabled)"
    echo "4. Set up backup schedule (if enabled)"
    echo
    echo "Configuration files:"
    echo "  Environment: $ENV_FILE"
    echo "  Docker Compose: $COMPOSE_FILE"
    echo
    print_warning "Remember to store your credentials securely!"
}

# Function to cleanup on error
cleanup_on_error() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        print_error "Deployment failed with exit code $exit_code"
        print_status "Cleaning up..."
        
        # Optionally cleanup containers
        if [[ -f "$COMPOSE_FILE" && -f "$ENV_FILE" ]]; then
            docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down &> /dev/null || true
        fi
    fi
    exit $exit_code
}

# Main deployment function
main() {
    # Set up error handling
    trap cleanup_on_error EXIT

    print_header "TerraFusion Enterprise Deployment"
    
    # Parse command line arguments
    parse_arguments "$@"
    
    # Run deployment steps
    check_prerequisites
    setup_environment
    build_images
    setup_docker_resources
    deploy_services
    wait_for_services
    run_migrations
    setup_ssl
    
    # Show deployment summary
    show_deployment_summary
    
    print_success "Deployment completed successfully!"
}

# Run main function with all arguments
main "$@"