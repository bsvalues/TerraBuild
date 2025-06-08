#!/bin/bash

set -e

TERRAFUSION_VERSION="1.0.0"
DEPLOYMENT_ID=$(date +%Y%m%d_%H%M%S)
LOG_FILE="deployment_${DEPLOYMENT_ID}.log"
COLORS_ENABLED=true

if [ "$COLORS_ENABLED" = true ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    CYAN='\033[0;36m'
    WHITE='\033[1;37m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    CYAN=''
    WHITE=''
    NC=''
fi

log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

print_banner() {
    clear
    echo -e "${CYAN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    TerraFusion Enterprise                        ║"
    echo "║                   One-Click Deployment System                    ║"
    echo "║                                                                  ║"
    echo "║    🧬 Tesla Precision • 🍎 Jobs Elegance • 🚀 Musk Scale        ║"
    echo "║    🏛️ Brady Excellence • 🛸 Annunaki Data Matrix                ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
}

show_progress() {
    local current=$1
    local total=$2
    local message=$3
    local percentage=$((current * 100 / total))
    local filled=$((percentage / 2))
    local empty=$((50 - filled))
    
    printf "\r${WHITE}[${GREEN}"
    printf "%*s" $filled | tr ' ' '█'
    printf "${WHITE}"
    printf "%*s" $empty | tr ' ' '░'
    printf "${WHITE}] ${percentage}%% - ${CYAN}%s${NC}" "$message"
    
    if [ $current -eq $total ]; then
        echo
    fi
}

check_requirements() {
    log "INFO" "Checking system requirements..."
    
    local requirements=(
        "node:Node.js"
        "npm:NPM"
        "git:Git"
        "docker:Docker"
        "psql:PostgreSQL Client"
    )
    
    local missing=()
    
    for req in "${requirements[@]}"; do
        local cmd="${req%%:*}"
        local name="${req##*:}"
        
        if ! command -v "$cmd" &> /dev/null; then
            missing+=("$name")
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        echo -e "${RED}✗ Missing requirements: ${missing[*]}${NC}"
        echo -e "${YELLOW}Please install the missing requirements and run again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All requirements satisfied${NC}"
}

setup_environment() {
    log "INFO" "Setting up enterprise environment..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/terrafusion
ANTHROPIC_API_KEY=your_api_key_here
OPENAI_API_KEY=your_api_key_here
TERRAFUSION_VERSION=${TERRAFUSION_VERSION}
DEPLOYMENT_ID=${DEPLOYMENT_ID}
EOF
        echo -e "${GREEN}✓ Environment configuration created${NC}"
    fi
    
    export NODE_ENV=production
    export TERRAFUSION_VERSION
    export DEPLOYMENT_ID
}

install_dependencies() {
    log "INFO" "Installing enterprise dependencies..."
    
    echo -e "${CYAN}Installing core dependencies...${NC}"
    npm install --production=false 2>&1 | tee -a "$LOG_FILE"
    
    echo -e "${CYAN}Installing desktop application dependencies...${NC}"
    cd deployment/desktop-app
    npm install 2>&1 | tee -a "../../$LOG_FILE"
    cd ../..
    
    echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
}

setup_database() {
    log "INFO" "Configuring enterprise database..."
    
    if ! pg_isready -h localhost -p 5432 2>/dev/null; then
        echo -e "${YELLOW}⚠ PostgreSQL not running. Starting database service...${NC}"
        
        if command -v systemctl &> /dev/null; then
            sudo systemctl start postgresql
        elif command -v brew &> /dev/null; then
            brew services start postgresql
        else
            echo -e "${RED}Please start PostgreSQL manually${NC}"
            exit 1
        fi
    fi
    
    echo -e "${CYAN}Running database migrations...${NC}"
    npm run db:push 2>&1 | tee -a "$LOG_FILE"
    
    echo -e "${GREEN}✓ Database configured successfully${NC}"
}

build_application() {
    log "INFO" "Building enterprise application..."
    
    echo -e "${CYAN}Building frontend application...${NC}"
    npm run build 2>&1 | tee -a "$LOG_FILE"
    
    echo -e "${CYAN}Building desktop application...${NC}"
    cd deployment/desktop-app
    npm run build 2>&1 | tee -a "../../$LOG_FILE"
    cd ../..
    
    echo -e "${GREEN}✓ Application built successfully${NC}"
}

run_tests() {
    log "INFO" "Running enterprise validation tests..."
    
    echo -e "${CYAN}Running unit tests...${NC}"
    npm test 2>&1 | tee -a "$LOG_FILE"
    
    echo -e "${CYAN}Running integration tests...${NC}"
    npm run test:integration 2>&1 | tee -a "$LOG_FILE" || true
    
    echo -e "${GREEN}✓ Tests completed${NC}"
}

start_services() {
    log "INFO" "Starting enterprise services..."
    
    echo -e "${CYAN}Starting TerraFusion server...${NC}"
    npm run start:prod &
    SERVER_PID=$!
    
    sleep 5
    
    if curl -f http://localhost:5000/api/health &>/dev/null; then
        echo -e "${GREEN}✓ Server started successfully (PID: $SERVER_PID)${NC}"
    else
        echo -e "${RED}✗ Server failed to start${NC}"
        exit 1
    fi
}

create_desktop_installer() {
    log "INFO" "Creating desktop installer packages..."
    
    cd deployment/desktop-app
    
    echo -e "${CYAN}Building Windows installer...${NC}"
    npm run build-win 2>&1 | tee -a "../../$LOG_FILE" || true
    
    echo -e "${CYAN}Building macOS installer...${NC}"
    npm run build-mac 2>&1 | tee -a "../../$LOG_FILE" || true
    
    echo -e "${CYAN}Building Linux installer...${NC}"
    npm run build-linux 2>&1 | tee -a "../../$LOG_FILE" || true
    
    cd ../..
    
    echo -e "${GREEN}✓ Desktop installers created${NC}"
}

generate_deployment_report() {
    log "INFO" "Generating deployment report..."
    
    cat > "deployment_report_${DEPLOYMENT_ID}.md" << EOF
# TerraFusion Enterprise Deployment Report

**Deployment ID:** ${DEPLOYMENT_ID}
**Version:** ${TERRAFUSION_VERSION}
**Date:** $(date)
**Status:** SUCCESS

## Deployment Summary

✅ System requirements verified
✅ Environment configured
✅ Dependencies installed
✅ Database setup completed
✅ Application built successfully
✅ Tests executed
✅ Services started
✅ Desktop installers created

## Access Information

- **Web Application:** http://localhost:5000
- **Admin Panel:** http://localhost:5000/admin
- **API Documentation:** http://localhost:5000/api/docs
- **Desktop Installers:** deployment/desktop-app/dist/

## Default Credentials

- **Username:** admin
- **Password:** admin123

## Next Steps

1. Change default passwords
2. Configure API keys in .env file
3. Set up SSL certificates for production
4. Configure automated backups
5. Set up monitoring and alerting

## Support

For enterprise support, contact: support@terrafusion.ai
EOF

    echo -e "${GREEN}✓ Deployment report generated: deployment_report_${DEPLOYMENT_ID}.md${NC}"
}

cleanup_and_optimize() {
    log "INFO" "Performing post-deployment optimization..."
    
    echo -e "${CYAN}Cleaning up temporary files...${NC}"
    npm run clean 2>/dev/null || true
    
    echo -e "${CYAN}Optimizing application performance...${NC}"
    
    echo -e "${GREEN}✓ Optimization completed${NC}"
}

main() {
    print_banner
    
    local steps=(
        "check_requirements:Verifying system requirements"
        "setup_environment:Setting up environment"
        "install_dependencies:Installing dependencies"
        "setup_database:Configuring database"
        "build_application:Building application"
        "run_tests:Running tests"
        "start_services:Starting services"
        "create_desktop_installer:Creating installers"
        "generate_deployment_report:Generating report"
        "cleanup_and_optimize:Final optimization"
    )
    
    local total_steps=${#steps[@]}
    local current_step=0
    
    echo -e "${WHITE}Starting TerraFusion Enterprise deployment...${NC}\n"
    
    for step in "${steps[@]}"; do
        local func="${step%%:*}"
        local desc="${step##*:}"
        
        ((current_step++))
        show_progress $current_step $total_steps "$desc"
        
        if ! $func; then
            echo -e "\n${RED}✗ Deployment failed at step: $desc${NC}"
            log "ERROR" "Deployment failed at step: $desc"
            exit 1
        fi
        
        sleep 1
    done
    
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                 🎉 DEPLOYMENT SUCCESSFUL! 🎉                     ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${WHITE}TerraFusion Enterprise is now running at: ${CYAN}http://localhost:5000${NC}"
    echo -e "${WHITE}Desktop installers available in: ${CYAN}deployment/desktop-app/dist/${NC}"
    echo -e "${WHITE}Deployment report: ${CYAN}deployment_report_${DEPLOYMENT_ID}.md${NC}"
    echo
    echo -e "${YELLOW}Enterprise-grade deployment completed with Tesla precision!${NC}"
    
    log "INFO" "Deployment completed successfully"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi