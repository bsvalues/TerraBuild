# TerraFusion Enterprise Launcher

## Overview

The TerraFusion Enterprise Launcher is a cross-platform desktop application that provides one-click deployment and management of the TerraFusion property valuation platform. Built with Electron, it offers enterprise-grade deployment capabilities with a polished user interface.

## Features

### 🚀 One-Click Deployment
- Quick deployment with default production settings
- Custom configuration for advanced users
- Real-time deployment progress tracking
- Automated health checks and validation

### 🔧 Enterprise Management
- Service monitoring and control
- Real-time log viewing
- System status dashboard
- Configuration management

### 🛡️ Security & Compliance
- Code-signed applications
- Secure configuration handling
- Enterprise authentication support
- Audit logging capabilities

### 📊 Monitoring & Analytics
- Performance metrics dashboard
- Service health monitoring
- Deployment analytics
- Error tracking and reporting

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Memory**: 4GB RAM
- **Storage**: 10GB free disk space
- **Network**: Internet connection for cloud deployments

### Recommended Requirements
- **Operating System**: Windows 11, macOS 12+, Ubuntu 20.04+
- **Memory**: 8GB RAM
- **Storage**: 20GB free disk space
- **CPU**: Multi-core processor (4+ cores)

## Installation

### Quick Install (Recommended)

1. **Download the installer** for your platform:
   - Windows: `TerraFusion-Enterprise-Launcher-Setup.exe`
   - macOS: `TerraFusion-Enterprise-Launcher.dmg`
   - Linux: `TerraFusion-Enterprise-Launcher.AppImage`

2. **Run the installer** with administrator privileges

3. **Launch the application** from your applications menu

### One-Click Deployment Script

For automated deployment on servers or development environments:

```bash
# Download and run the deployment script
curl -fsSL https://raw.githubusercontent.com/terrafusion/enterprise-launcher/main/scripts/deploy-enterprise.sh | bash

# Or clone and run locally
git clone https://github.com/terrafusion/enterprise-launcher.git
cd enterprise-launcher
./scripts/deploy-enterprise.sh
```

### Manual Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/terrafusion/enterprise-launcher.git
   cd enterprise-launcher
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Create distributables**:
   ```bash
   npm run dist
   ```

## Usage

### First Launch

1. **Start the launcher** from your applications menu or command line
2. **System check** will run automatically to verify requirements
3. **Choose deployment type**:
   - **Quick Deploy**: Uses optimized defaults for immediate setup
   - **Custom Configuration**: Allows detailed configuration options

### Deployment Options

#### Quick Deployment
- Local deployment on current machine
- Production-ready configuration
- Automated service setup
- Default security settings

#### Custom Configuration
- **Infrastructure**: Local, Docker, or Cloud deployment
- **Security**: SSL/TLS, authentication, backup options
- **Features**: AI agents, monitoring, analytics
- **Environment**: Development, staging, or production settings

### Managing Services

The launcher provides comprehensive service management:

- **Start/Stop Services**: Control individual application components
- **View Logs**: Real-time log streaming and historical log access
- **Health Monitoring**: Service status indicators and health checks
- **Performance Metrics**: CPU, memory, and network usage tracking

## Configuration

### Environment Variables

Key environment variables for customization:

```bash
# Application settings
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/terrafusion

# Security settings
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
JWT_SECRET=your-jwt-secret

# Feature flags
ENABLE_AI_AGENTS=true
ENABLE_MONITORING=true
ENABLE_BACKUP=true
```

### Configuration Files

- `config/deployment.json`: Deployment settings
- `config/services.json`: Service configuration
- `config/security.json`: Security policies
- `logs/`: Application and deployment logs

## Development

### Building from Source

1. **Prerequisites**:
   ```bash
   node --version  # v18.0.0 or higher
   npm --version   # v9.0.0 or higher
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Development mode**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

### Creating Installers

To create platform-specific installers:

```bash
# Build for current platform
npm run build

# Build for all platforms (requires appropriate build environment)
npm run dist

# Build with code signing (requires certificates)
npm run sign
```

### Project Structure

```
deployment/enterprise-launcher/
├── src/
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Preload script for security
│   ├── views/               # HTML templates
│   ├── styles/              # CSS stylesheets
│   └── scripts/             # Frontend JavaScript
├── assets/
│   ├── icons/               # Application icons
│   └── images/              # UI assets
├── build/                   # Build configuration
├── scripts/                 # Deployment and packaging scripts
└── dist/                    # Built application files
```

## Security

### Code Signing

All release binaries are digitally signed:

- **Windows**: Authenticode signature with SHA-256
- **macOS**: Apple Developer ID signature and notarization
- **Linux**: GPG signature verification

### Verification

To verify the integrity of downloaded files:

```bash
# Verify checksums
sha256sum -c SHA256SUMS

# Verify GPG signature (Linux)
gpg --verify terrafusion-enterprise-launcher.sig

# Verify code signature (macOS)
codesign -v TerraFusion-Enterprise-Launcher.app
```

## Troubleshooting

### Common Issues

1. **Deployment fails with permission errors**
   - Run installer as administrator
   - Check file system permissions
   - Verify user has write access to installation directory

2. **Services fail to start**
   - Check system requirements (memory, disk space)
   - Verify database connectivity
   - Review application logs in the launcher

3. **Application won't open**
   - Check system compatibility
   - Verify all dependencies are installed
   - Run from command line to see error messages

### Log Files

Important log locations:

- **Application logs**: `~/.terrafusion-enterprise/logs/`
- **Deployment logs**: `/tmp/terrafusion-deploy-*.log`
- **Service logs**: Available through the launcher interface

### Support Channels

- **Documentation**: https://docs.terrafusion.com
- **GitHub Issues**: https://github.com/terrafusion/enterprise-launcher/issues
- **Email Support**: support@terrafusion.com
- **Community Forum**: https://community.terrafusion.com

## Contributing

We welcome contributions to the TerraFusion Enterprise Launcher:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation for any API changes
- Ensure cross-platform compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 2.0.0 (Current)
- Initial enterprise launcher release
- One-click deployment system
- Cross-platform desktop application
- Real-time monitoring and management
- Enterprise security features

### Roadmap

#### Version 2.1.0
- Cloud deployment integration (AWS, GCP, Azure)
- Advanced monitoring dashboards
- Multi-tenant support
- API management interface

#### Version 2.2.0
- Kubernetes deployment support
- CI/CD pipeline integration
- Advanced security compliance
- Performance optimization tools

## Acknowledgments

- Built with [Electron](https://electronjs.org/)
- UI components from [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- Deployment automation with [electron-builder](https://electron.build/)

---

For the latest updates and documentation, visit: https://docs.terrafusion.com/enterprise-launcher