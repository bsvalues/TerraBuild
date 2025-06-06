# TerraBuild Enterprise Documentation Index

## Quick Start Documentation

### 🚀 Essential Setup
- [**README**](../README.md) - Project overview and quick start guide
- [**Bootstrap Guide**](BOOTSTRAP_GUIDE.md) - Complete installation and configuration
- [**Deployment Script**](../deploy.sh) - One-click production deployment

### 📋 Planning and Requirements
- [**Product Requirements Document**](PRODUCT_REQUIREMENTS_DOCUMENT.md) - Complete feature specifications
- [**Enterprise Implementation Summary**](../ENTERPRISE_IMPLEMENTATION_COMPLETE.md) - Architecture overview

## Technical Documentation

### 🔧 Development and Operations
- [**DevOps Kit**](DEVOPS_KIT.md) - Infrastructure, CI/CD, monitoring, and deployment automation
- [**API Reference**](API_REFERENCE.md) - Complete REST API documentation with examples

### 🏗️ Architecture Components

#### AI Agent System
- **Location**: `src/enterprise/ai-agents/`
- **Key File**: `AgentSwarmOrchestrator.ts`
- **Features**: 6 specialized agents for automated workflows

#### Local LLM Integration
- **Location**: `src/enterprise/mcp/`
- **Key File**: `LocalLLMIntegration.ts`
- **Features**: RAG-enabled property valuation AI

#### Security Framework
- **Location**: `src/enterprise/security/`
- **Key File**: `SecureNetworkConfig.ts`
- **Features**: County-compliant network restrictions

#### Deployment System
- **Location**: `src/enterprise/deployment/`
- **Key File**: `OneClickDeploy.ts`
- **Features**: Automated production deployment

## Implementation Guides

### Database Management
```bash
# Apply schema changes
npm run db:push

# Import property data
node import_property_data.js

# Import cost matrices
node import_proper_benton_data.js
```

### AI Services Setup
```bash
# Start AI services
docker-compose up -d ollama chroma

# Pull language models
docker exec terrabuild-ollama-1 ollama pull llama3.2:3b
```

### Security Configuration
```bash
# Apply firewall rules (requires sudo)
sudo ./scripts/firewall-setup.sh

# Generate SSL certificates
./scripts/generate-certificates.sh
```

## File Organization

### Core Application Files
```
├── client/               # React frontend application
├── server/               # Node.js backend services
├── shared/               # Shared TypeScript schemas
├── src/enterprise/       # Enterprise AI and security features
├── docs/                 # Complete documentation suite
├── scripts/              # Automation and utility scripts
└── deploy.sh            # One-click deployment script
```

### Archive Structure
```
archive/
├── legacy_parsers/       # Historical cost matrix scripts
├── experimental/         # Proof-of-concept components
├── deprecated_docs/      # Outdated documentation
├── unused_assets/        # Media files no longer active
└── old_imports/          # Legacy data import scripts
```

## Data Management

### Property Data Import
- **Source**: CSV files in `attached_assets/`
- **Script**: `import_property_data.py`
- **Target**: PostgreSQL database tables

### Cost Matrix Management
- **Source**: Excel files with standardized format
- **Script**: `import_proper_benton_data.js`
- **Features**: Automated parsing and validation

### Backup Procedures
- **Database**: Automated PostgreSQL backups
- **Application**: Complete system state preservation
- **Recovery**: One-command restoration process

## Monitoring and Health

### System Health Endpoints
- **Application Health**: `GET /api/health`
- **Database Status**: `GET /api/database/health`
- **AI Agents Status**: `GET /api/agents/status`

### Performance Metrics
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization dashboards
- **Real-time**: Agent performance monitoring

## Security and Compliance

### Network Security
- **Firewall Rules**: Restrictive outbound connections
- **Domain Whitelist**: GitHub, NPM, Docker registries only
- **Port Management**: Minimal exposure configuration

### Data Protection
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: Role-based permissions
- **Audit Trails**: Comprehensive logging system

### Government Compliance
- **Standards**: NIST Cybersecurity Framework
- **Certification**: SOC 2 Type II ready
- **Requirements**: Municipal IT standards met

## Integration Capabilities

### GIS Systems
- **ArcGIS**: Server integration support
- **QGIS**: Compatibility and data exchange
- **Formats**: Shapefile, KML, GeoJSON support

### ERP Integration
- **SAP**: Connection capabilities
- **Oracle**: Database connectivity
- **Custom APIs**: Flexible integration points

### Tax Systems
- **Assessment Rolls**: Automated generation
- **Appeals Management**: Workflow support
- **Compliance**: Audit trail maintenance

## Support Resources

### Technical Support
- **Documentation**: Comprehensive guides and references
- **Training**: User and administrator materials
- **Professional Services**: Implementation assistance

### Development Support
- **Code Standards**: TypeScript, ESLint, Prettier
- **Testing**: Unit, integration, and E2E frameworks
- **CI/CD**: Automated pipelines and deployment

## Version Information

- **Current Version**: 1.0.0
- **Release Date**: 2024
- **License**: Enterprise License Agreement
- **Support**: Professional support included

## Quick Reference

### Essential Commands
```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run test               # Run test suite

# Database
npm run db:push            # Apply schema changes
npm run db:reset           # Reset database

# Deployment
./deploy.sh production     # Deploy to production
docker-compose up -d       # Start services
```

### Default Access
- **URL**: http://localhost:5000
- **Username**: admin
- **Password**: admin123
- **Change credentials immediately in production**

### Environment Configuration
- **Development**: `.env` file configuration
- **Production**: Environment variable setup
- **Security**: Restrictive network policies

## Getting Help

### Documentation Hierarchy
1. **Quick Start**: README and Bootstrap Guide
2. **Technical Details**: API Reference and DevOps Kit
3. **Planning**: Product Requirements Document
4. **Implementation**: Enterprise Implementation Summary

### Support Channels
- **Technical Issues**: Review troubleshooting sections
- **Feature Requests**: Consult Product Requirements Document
- **Security Questions**: Reference Security Framework documentation
- **Integration Support**: Check integration guides and API documentation

This documentation index provides a complete roadmap for understanding, deploying, and maintaining the TerraBuild Enterprise Platform.