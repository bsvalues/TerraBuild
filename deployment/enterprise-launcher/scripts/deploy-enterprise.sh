#!/bin/bash

# TerraFusion Enterprise One-Click Deployment Script
# This script automates the complete deployment process for enterprise environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
LAUNCHER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_LOG="/tmp/terrafusion-deploy-$(date +%Y%m%d_%H%M%S).log"
REQUIRED_MEMORY_GB=4
REQUIRED_DISK_GB=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$DEPLOY_LOG"
}

log_info() {
    log "${BLUE}INFO${NC}: $1"
}

log_success() {
    log "${GREEN}SUCCESS${NC}: $1"
}

log_warning() {
    log "${YELLOW}WARNING${NC}: $1"
}

log_error() {
    log "${RED}ERROR${NC}: $1"
}

# Error handling
error_exit() {
    log_error "$1"
    log_error "Deployment failed. Check log: $DEPLOY_LOG"
    exit 1
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment interrupted. Cleaning up..."
        # Stop any running services
        pkill -f "terrafusion" 2>/dev/null || true
        pkill -f "electron" 2>/dev/null || true
    fi
    exit $exit_code
}

trap cleanup EXIT INT TERM

# System checks
check_system_requirements() {
    log_info "Checking system requirements..."
    
    # Check operating system
    case "$(uname -s)" in
        Darwin)
            OS="macOS"
            PACKAGE_MANAGER="brew"
            ;;
        Linux)
            OS="Linux"
            if command -v apt-get >/dev/null 2>&1; then
                PACKAGE_MANAGER="apt"
            elif command -v yum >/dev/null 2>&1; then
                PACKAGE_MANAGER="yum"
            elif command -v dnf >/dev/null 2>&1; then
                PACKAGE_MANAGER="dnf"
            else
                error_exit "Unsupported Linux distribution"
            fi
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            OS="Windows"
            PACKAGE_MANAGER="choco"
            ;;
        *)
            error_exit "Unsupported operating system: $(uname -s)"
            ;;
    esac
    
    log_info "Operating System: $OS"
    
    # Check memory
    if [ "$OS" = "macOS" ]; then
        MEMORY_GB=$(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 ))
    elif [ "$OS" = "Linux" ]; then
        MEMORY_GB=$(( $(grep MemTotal /proc/meminfo | awk '{print $2}') / 1024 / 1024 ))
    fi
    
    if [ "$MEMORY_GB" -lt "$REQUIRED_MEMORY_GB" ]; then
        error_exit "Insufficient memory. Required: ${REQUIRED_MEMORY_GB}GB, Available: ${MEMORY_GB}GB"
    fi
    
    log_success "Memory check passed: ${MEMORY_GB}GB available"
    
    # Check disk space
    DISK_AVAILABLE_GB=$(df "$PROJECT_ROOT" | awk 'NR==2 {print int($4/1024/1024)}')
    if [ "$DISK_AVAILABLE_GB" -lt "$REQUIRED_DISK_GB" ]; then
        error_exit "Insufficient disk space. Required: ${REQUIRED_DISK_GB}GB, Available: ${DISK_AVAILABLE_GB}GB"
    fi
    
    log_success "Disk space check passed: ${DISK_AVAILABLE_GB}GB available"
}

# Install system dependencies
install_dependencies() {
    log_info "Installing system dependencies..."
    
    case "$PACKAGE_MANAGER" in
        brew)
            if ! command -v brew >/dev/null 2>&1; then
                log_info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            
            brew update
            brew install node npm python3 postgresql
            ;;
        apt)
            sudo apt-get update
            sudo apt-get install -y nodejs npm python3 python3-pip postgresql postgresql-contrib curl git
            ;;
        yum|dnf)
            sudo $PACKAGE_MANAGER update -y
            sudo $PACKAGE_MANAGER install -y nodejs npm python3 python3-pip postgresql postgresql-server curl git
            ;;
        choco)
            if ! command -v choco >/dev/null 2>&1; then
                error_exit "Chocolatey not found. Please install from https://chocolatey.org/"
            fi
            
            choco install -y nodejs python3 postgresql git
            ;;
    esac
    
    log_success "System dependencies installed"
}

# Check and install Node.js dependencies
setup_nodejs() {
    log_info "Setting up Node.js environment..."
    
    # Check Node.js version
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | sed 's/v//')
        REQUIRED_NODE_VERSION="18.0.0"
        
        if ! version_compare "$NODE_VERSION" "$REQUIRED_NODE_VERSION"; then
            log_warning "Node.js version $NODE_VERSION is below required $REQUIRED_NODE_VERSION"
            log_info "Installing Node.js $REQUIRED_NODE_VERSION..."
            
            # Install Node Version Manager and latest Node.js
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
            nvm install 18
            nvm use 18
        fi
    else
        error_exit "Node.js not found. Please install Node.js 18 or higher"
    fi
    
    log_success "Node.js environment ready"
}

# Version comparison function
version_compare() {
    local version1=$1
    local version2=$2
    
    IFS='.' read -ra VER1 <<< "$version1"
    IFS='.' read -ra VER2 <<< "$version2"
    
    for i in "${!VER1[@]}"; do
        if [[ ${VER1[i]} -lt ${VER2[i]:-0} ]]; then
            return 1
        elif [[ ${VER1[i]} -gt ${VER2[i]:-0} ]]; then
            return 0
        fi
    done
    
    return 0
}

# Setup PostgreSQL database
setup_database() {
    log_info "Setting up PostgreSQL database..."
    
    # Start PostgreSQL service
    case "$OS" in
        macOS)
            brew services start postgresql
            ;;
        Linux)
            sudo systemctl start postgresql
            sudo systemctl enable postgresql
            ;;
    esac
    
    # Wait for PostgreSQL to be ready
    sleep 5
    
    # Create database and user
    if [ "$OS" = "Linux" ]; then
        sudo -u postgres createdb terrafusion 2>/dev/null || true
        sudo -u postgres psql -c "CREATE USER terrafusion WITH PASSWORD 'terrafusion123';" 2>/dev/null || true
        sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE terrafusion TO terrafusion;" 2>/dev/null || true
    else
        createdb terrafusion 2>/dev/null || true
        psql postgres -c "CREATE USER terrafusion WITH PASSWORD 'terrafusion123';" 2>/dev/null || true
        psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE terrafusion TO terrafusion;" 2>/dev/null || true
    fi
    
    # Set environment variable
    export DATABASE_URL="postgresql://terrafusion:terrafusion123@localhost:5432/terrafusion"
    echo "export DATABASE_URL=\"$DATABASE_URL\"" >> ~/.bashrc
    
    log_success "PostgreSQL database configured"
}

# Install application dependencies
install_app_dependencies() {
    log_info "Installing application dependencies..."
    
    cd "$PROJECT_ROOT"
    
    # Install main application dependencies
    npm install
    
    # Install launcher dependencies
    cd "$LAUNCHER_DIR"
    npm install
    
    log_success "Application dependencies installed"
}

# Build the application
build_application() {
    log_info "Building TerraFusion application..."
    
    cd "$PROJECT_ROOT"
    
    # Build the main application
    npm run build
    
    # Run database migrations
    npm run db:push
    
    log_success "Application built successfully"
}

# Build the enterprise launcher
build_launcher() {
    log_info "Building Enterprise Launcher..."
    
    cd "$LAUNCHER_DIR"
    
    # Build the launcher for current platform
    npm run build
    
    log_success "Enterprise Launcher built successfully"
}

# Create systemd service (Linux only)
create_systemd_service() {
    if [ "$OS" != "Linux" ]; then
        return 0
    fi
    
    log_info "Creating systemd service..."
    
    cat > /tmp/terrafusion.service << EOF
[Unit]
Description=TerraFusion Enterprise Application
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=DATABASE_URL=$DATABASE_URL
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/terrafusion.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable terrafusion
    
    log_success "Systemd service created"
}

# Create launchd service (macOS only)
create_launchd_service() {
    if [ "$OS" != "macOS" ]; then
        return 0
    fi
    
    log_info "Creating launchd service..."
    
    cat > ~/Library/LaunchAgents/com.terrafusion.enterprise.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.terrafusion.enterprise</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$PROJECT_ROOT/dist/index.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>5000</string>
        <key>DATABASE_URL</key>
        <string>$DATABASE_URL</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF
    
    launchctl load ~/Library/LaunchAgents/com.terrafusion.enterprise.plist
    
    log_success "Launchd service created"
}

# Start services
start_services() {
    log_info "Starting TerraFusion services..."
    
    case "$OS" in
        Linux)
            sudo systemctl start terrafusion
            ;;
        macOS)
            launchctl start com.terrafusion.enterprise
            ;;
        *)
            # For other systems, start manually
            cd "$PROJECT_ROOT"
            nohup node dist/index.js > /tmp/terrafusion.log 2>&1 &
            echo $! > /tmp/terrafusion.pid
            ;;
    esac
    
    # Wait for service to start
    sleep 10
    
    # Check if service is running
    if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then
        log_success "TerraFusion service started successfully"
        log_info "Application available at: http://localhost:5000"
    else
        error_exit "Failed to start TerraFusion service"
    fi
}

# Launch enterprise launcher
launch_launcher() {
    log_info "Launching Enterprise Launcher..."
    
    cd "$LAUNCHER_DIR"
    
    if [ "$OS" = "Linux" ] && [ -z "${DISPLAY:-}" ]; then
        log_warning "No display detected. Launcher requires GUI environment."
        log_info "To run the launcher manually: cd $LAUNCHER_DIR && npm start"
    else
        npm start &
        log_success "Enterprise Launcher started"
    fi
}

# Generate deployment report
generate_report() {
    log_info "Generating deployment report..."
    
    REPORT_FILE="/tmp/terrafusion-deployment-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
TerraFusion Enterprise Deployment Report
========================================

Deployment Date: $(date)
Operating System: $OS
Node.js Version: $(node --version)
PostgreSQL Status: $(if command -v psql >/dev/null 2>&1; then echo "Installed"; else echo "Not Found"; fi)

Application Details:
- Project Root: $PROJECT_ROOT
- Launcher Directory: $LAUNCHER_DIR
- Database URL: $DATABASE_URL
- Service Port: 5000

Service Status:
- Application: $(if curl -f http://localhost:5000/api/health >/dev/null 2>&1; then echo "Running"; else echo "Stopped"; fi)
- Database: $(if pg_isready >/dev/null 2>&1; then echo "Running"; else echo "Stopped"; fi)

Access URLs:
- Main Application: http://localhost:5000
- Admin Dashboard: http://localhost:5000/admin
- API Health Check: http://localhost:5000/api/health

Next Steps:
1. Open the Enterprise Launcher from your applications menu
2. Or navigate to: http://localhost:5000
3. Use admin/admin123 for initial login
4. Configure your deployment settings

Support:
- Documentation: https://docs.terrafusion.com
- Log File: $DEPLOY_LOG
- Report File: $REPORT_FILE

EOF
    
    log_success "Deployment report generated: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Main deployment function
main() {
    log_info "Starting TerraFusion Enterprise deployment..."
    log_info "Deployment log: $DEPLOY_LOG"
    
    # Pre-deployment checks
    check_system_requirements
    
    # Installation steps
    install_dependencies
    setup_nodejs
    setup_database
    install_app_dependencies
    
    # Build steps
    build_application
    build_launcher
    
    # Service setup
    create_systemd_service
    create_launchd_service
    
    # Start services
    start_services
    
    # Launch GUI
    launch_launcher
    
    # Generate report
    generate_report
    
    log_success "TerraFusion Enterprise deployment completed successfully!"
    log_info "Access your application at: http://localhost:5000"
    log_info "Enterprise Launcher should be starting automatically"
}

# Command line options
case "${1:-}" in
    --help|-h)
        echo "TerraFusion Enterprise One-Click Deployment"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --check-only        Only check system requirements"
        echo "  --no-gui            Skip launching the GUI launcher"
        echo "  --dev               Development mode installation"
        echo ""
        echo "This script will:"
        echo "1. Check system requirements"
        echo "2. Install dependencies"
        echo "3. Set up database"
        echo "4. Build applications"
        echo "5. Configure services"
        echo "6. Start TerraFusion"
        echo "7. Launch Enterprise Launcher"
        exit 0
        ;;
    --check-only)
        check_system_requirements
        log_success "System requirements check completed"
        exit 0
        ;;
    --no-gui)
        NO_GUI=true
        ;;
    --dev)
        DEV_MODE=true
        ;;
esac

# Run main deployment
main

exit 0