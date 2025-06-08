#!/bin/bash

# TerraFusion Enterprise Build Script
# Builds both Electron and Tauri launcher packages

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_OUTPUT="$SCRIPT_DIR/releases"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%H:%M:%S')] $1"
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

check_dependencies() {
    log_info "Checking build dependencies..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log_error "Node.js not found. Please install Node.js 18 or higher"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | sed 's/v//')
    if ! node -e "process.exit(process.version.slice(1).localeCompare('18.0.0', undefined, {numeric: true}) >= 0 ? 0 : 1)"; then
        log_error "Node.js version $NODE_VERSION is below required 18.0.0"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        log_error "npm not found"
        exit 1
    fi
    
    # Check Rust for Tauri (optional)
    if command -v rustc >/dev/null 2>&1; then
        RUST_AVAILABLE=true
        log_info "Rust compiler found - Tauri build available"
    else
        RUST_AVAILABLE=false
        log_warning "Rust compiler not found - Tauri build will be skipped"
    fi
    
    log_success "Dependencies check completed"
}

prepare_build_environment() {
    log_info "Preparing build environment..."
    
    # Create build output directory
    mkdir -p "$BUILD_OUTPUT"
    
    # Create build log
    BUILD_LOG="$BUILD_OUTPUT/build-$TIMESTAMP.log"
    touch "$BUILD_LOG"
    
    log_success "Build environment prepared"
}

build_electron_launcher() {
    log_info "Building Electron launcher..."
    
    cd "$SCRIPT_DIR/enterprise-launcher"
    
    # Install dependencies
    log_info "Installing Electron dependencies..."
    npm install >> "$BUILD_LOG" 2>&1
    
    # Build the application
    log_info "Building Electron application..."
    npm run build >> "$BUILD_LOG" 2>&1
    
    # Create installers
    log_info "Creating Electron installers..."
    node scripts/package-installer.js >> "$BUILD_LOG" 2>&1
    
    # Copy releases to output directory
    if [ -d "dist" ]; then
        cp -r dist/* "$BUILD_OUTPUT/"
        log_success "Electron launcher built successfully"
    else
        log_error "Electron build failed - no dist directory found"
        return 1
    fi
}

build_tauri_launcher() {
    if [ "$RUST_AVAILABLE" = false ]; then
        log_warning "Skipping Tauri build - Rust not available"
        return 0
    fi
    
    log_info "Building Tauri launcher..."
    
    cd "$SCRIPT_DIR/tauri-launcher"
    
    # Install Tauri CLI if not present
    if ! command -v cargo-tauri >/dev/null 2>&1; then
        log_info "Installing Tauri CLI..."
        cargo install tauri-cli >> "$BUILD_LOG" 2>&1
    fi
    
    # Install npm dependencies
    if [ -f "package.json" ]; then
        log_info "Installing Tauri frontend dependencies..."
        npm install >> "$BUILD_LOG" 2>&1
    fi
    
    # Build the application
    log_info "Building Tauri application..."
    cargo tauri build >> "$BUILD_LOG" 2>&1
    
    # Copy releases to output directory
    if [ -d "src-tauri/target/release/bundle" ]; then
        cp -r src-tauri/target/release/bundle/* "$BUILD_OUTPUT/"
        log_success "Tauri launcher built successfully"
    else
        log_error "Tauri build failed - no bundle directory found"
        return 1
    fi
}

create_unified_installer() {
    log_info "Creating unified installer package..."
    
    cd "$BUILD_OUTPUT"
    
    # Create installer script
    cat > install-terrafusion.sh << 'EOF'
#!/bin/bash
# TerraFusion Enterprise Unified Installer

echo "TerraFusion Enterprise Installer"
echo "================================"

# Detect platform
PLATFORM=$(uname -s)
ARCH=$(uname -m)

case "$PLATFORM" in
    Darwin)
        echo "Detected macOS"
        if [ -f "TerraFusion-Enterprise-Launcher.dmg" ]; then
            echo "Installing Electron-based launcher..."
            open TerraFusion-Enterprise-Launcher.dmg
        elif [ -f "TerraFusion-Launcher.app.tar.gz" ]; then
            echo "Installing Tauri-based launcher..."
            tar -xzf TerraFusion-Launcher.app.tar.gz
            mv TerraFusion-Launcher.app /Applications/
        fi
        ;;
    Linux)
        echo "Detected Linux"
        if [ -f "TerraFusion-Enterprise-Launcher.AppImage" ]; then
            echo "Installing Electron-based launcher..."
            chmod +x TerraFusion-Enterprise-Launcher.AppImage
            mv TerraFusion-Enterprise-Launcher.AppImage ~/Applications/
        elif [ -f "terrafusion-launcher_amd64.deb" ]; then
            echo "Installing Tauri-based launcher..."
            sudo dpkg -i terrafusion-launcher_amd64.deb
        fi
        ;;
    *)
        echo "Unsupported platform: $PLATFORM"
        exit 1
        ;;
esac

echo "Installation completed!"
EOF
    
    chmod +x install-terrafusion.sh
    
    log_success "Unified installer created"
}

generate_checksums() {
    log_info "Generating checksums..."
    
    cd "$BUILD_OUTPUT"
    
    # Generate SHA256 checksums for all files
    find . -type f \( -name "*.exe" -o -name "*.msi" -o -name "*.dmg" -o -name "*.app" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) -exec sha256sum {} \; > SHA256SUMS
    
    log_success "Checksums generated"
}

create_release_notes() {
    log_info "Creating release notes..."
    
    cat > "$BUILD_OUTPUT/RELEASE_NOTES.md" << EOF
# TerraFusion Enterprise v2.0.0 Release

## Enterprise-Grade Property Valuation Platform

This release includes both Electron and Tauri-based enterprise launchers for comprehensive deployment options.

### Package Options

#### Electron Launcher (Full Enterprise Features)
- Advanced monitoring dashboards
- Complete service orchestration
- Enterprise security features
- Real-time analytics and reporting

#### Tauri Launcher (High Performance)
- Lightweight, fast startup
- Minimal resource usage
- Essential deployment features
- Native performance

### Installation Files

The following installers are available in this release:

- **Windows**: .exe and .msi installers
- **macOS**: .dmg and .app packages
- **Linux**: .AppImage and .deb packages

### Quick Start

1. Choose your preferred launcher type
2. Download the appropriate installer for your platform
3. Run installer with administrator privileges
4. Launch TerraFusion from applications menu
5. Select "Quick Deploy" for immediate setup

### System Requirements

- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 10GB free disk space
- **Network**: Internet connection for cloud features
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

### Verification

Verify package integrity using provided checksums:
\`\`\`bash
sha256sum -c SHA256SUMS
\`\`\`

### Support

- Documentation: https://docs.terrafusion.com
- Support: support@terrafusion.com
- Issues: https://github.com/terrafusion/enterprise-deployment/issues

---
Build Date: $(date)
Build Log: build-$TIMESTAMP.log
EOF
    
    log_success "Release notes created"
}

main() {
    log_info "Starting TerraFusion Enterprise build process..."
    
    check_dependencies
    prepare_build_environment
    
    # Build Electron launcher
    if build_electron_launcher; then
        log_success "Electron launcher build completed"
    else
        log_error "Electron launcher build failed"
    fi
    
    # Build Tauri launcher
    if build_tauri_launcher; then
        log_success "Tauri launcher build completed"
    else
        log_warning "Tauri launcher build skipped or failed"
    fi
    
    create_unified_installer
    generate_checksums
    create_release_notes
    
    log_success "Enterprise build process completed!"
    log_info "Build output available in: $BUILD_OUTPUT"
    log_info "Build log: $BUILD_LOG"
    
    # List built packages
    echo ""
    log_info "Built packages:"
    find "$BUILD_OUTPUT" -type f \( -name "*.exe" -o -name "*.msi" -o -name "*.dmg" -o -name "*.app" -o -name "*.AppImage" -o -name "*.deb" -o -name "*.rpm" \) -exec basename {} \; | sort
}

# Handle script termination
cleanup() {
    log_info "Build process interrupted"
    exit 1
}

trap cleanup INT TERM

# Run main function
main "$@"