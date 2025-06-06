# TerraFusion Enterprise Platform

**Advanced AI-Powered Geospatial Property Valuation System for County Governments**

[![License](https://img.shields.io/badge/license-Enterprise-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](package.json)
[![Security](https://img.shields.io/badge/security-SOC2-orange.svg)](docs/SECURITY.md)
[![AI Powered](https://img.shields.io/badge/AI-Powered-purple.svg)](src/enterprise/ai-agents/)

## Overview

TerraFusion transforms property assessment for county governments through AI-driven automation, providing accurate valuations with enterprise-grade security and one-click deployment capabilities.

### Key Features

- **AI Agent Orchestration**: 6 specialized agents for comprehensive automation
- **Local LLM Integration**: On-premises language models with RAG capabilities
- **RCN Calculation Engine**: Automated Replacement Cost New methodology
- **Enterprise Security**: County network compliance and restrictive deployment
- **One-Click Deployment**: Non-technical user friendly installation
- **Geospatial Analysis**: Advanced GIS integration and visualization

## Quick Start

### Prerequisites
- Node.js 18+
- Docker 20+
- PostgreSQL 13+
- 8GB RAM minimum

### Installation
```bash
git clone <repository-url> terrafusion
cd terrafusion
chmod +x deploy.sh
./deploy.sh production
```

### Access
- **Application**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin
- **API Docs**: http://localhost:5000/api/docs
- **Login**: admin / admin123

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    TerraBuild Platform                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/TypeScript)                               │
│  ├── Property Valuation Dashboard                          │
│  ├── AI Agent Management Interface                         │
│  ├── GIS Mapping and Visualization                         │
│  └── Administrative Controls                               │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (Node.js/Express)                        │
│  ├── RESTful API Layer                                     │
│  ├── Authentication & Authorization                        │
│  ├── Data Processing Pipeline                              │
│  └── Integration Endpoints                                 │
├─────────────────────────────────────────────────────────────┤
│  AI Agent Swarm                                            │
│  ├── Development Agent     ├── Design Agent               │
│  ├── Data Analysis Agent   ├── Cost Analysis Agent        │
│  ├── Security Agent        └── Deployment Agent           │
├─────────────────────────────────────────────────────────────┤
│  Local LLM & Vector DB                                     │
│  ├── Ollama (LLM Runtime)                                  │
│  ├── Chroma (Vector Store)                                 │
│  ├── RAG Pipeline                                          │
│  └── Document Processing                                   │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── PostgreSQL (Primary Database)                        │
│  ├── Property Records                                      │
│  ├── Cost Matrices                                         │
│  └── User Management                                       │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, Drizzle ORM
- **Database**: PostgreSQL with spatial extensions
- **AI/ML**: Ollama, LangChain, Chroma Vector DB
- **Infrastructure**: Docker, Docker Compose
- **Security**: Enterprise firewall, SSL/TLS, VPN gateway

## Core Functionality

### Property Valuation Engine

The system performs automated property valuations using the Replacement Cost New (RCN) methodology:

1. **Data Collection**: Import property records, building characteristics, and market data
2. **Factor Analysis**: Apply quality, condition, age, and regional adjustment factors
3. **AI Enhancement**: Use local LLMs for market trend analysis and validation
4. **Report Generation**: Create comprehensive valuation reports with confidence intervals

### AI Agent Capabilities

#### Development Agent
- Code generation and refactoring
- Bug detection and resolution
- Performance optimization
- Technical documentation

#### Design Agent
- UI/UX design optimization
- Accessibility compliance
- User experience analysis
- Interface standardization

#### Data Analysis Agent
- Property data processing
- Market trend analysis
- Statistical modeling
- Report generation

#### Cost Analysis Agent
- RCN calculations
- Market comparisons
- Valuation modeling
- Risk assessment

#### Security Agent
- Vulnerability scanning
- Compliance monitoring
- Threat detection
- Security policy enforcement

#### Deployment Agent
- Infrastructure provisioning
- Environment configuration
- Service orchestration
- Health monitoring

### Security Framework

Enterprise-grade security designed for government deployment:

- **Network Security**: Restrictive firewalls with county-approved domain whitelist
- **Data Protection**: AES-256 encryption at rest, TLS 1.3 in transit
- **Access Control**: Role-based permissions with multi-factor authentication
- **Compliance**: SOC 2, NIST Cybersecurity Framework, government standards
- **Audit Trail**: Comprehensive logging and monitoring

## Development

### Environment Setup

1. **Clone Repository**
```bash
git clone <repository-url>
cd terrabuild
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start Development Services**
```bash
npm run dev
```

### Database Management

```bash
# Apply schema changes
npm run db:push

# Generate migrations
npm run db:generate

# Reset database
npm run db:reset

# Seed test data
npm run db:seed
```

### AI Services

```bash
# Start AI services
docker-compose up -d ollama chroma

# Pull language models
docker exec terrabuild-ollama-1 ollama pull llama3.2:3b
docker exec terrabuild-ollama-1 ollama pull nomic-embed-text
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Deployment

### Production Deployment

```bash
# Automated deployment
./deploy.sh production

# Manual deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Configuration Options

#### Environment Variables
```env
# Application
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@localhost:5432/terrabuild

# AI Services
OLLAMA_URL=http://localhost:11434
CHROMA_URL=http://localhost:8000
AGENT_SWARM_SIZE=6

# Security
NETWORK_RESTRICTIVE_MODE=true
SSL_ENFORCEMENT=true
VPN_REQUIRED=false
```

#### Security Policies
```env
# Network Security
ALLOWED_DOMAINS=github.com,npmjs.com,docker.io
ALLOWED_PORTS=80,443,5000,5432,11434,8000
FIREWALL_ENABLED=true
CERTIFICATE_VALIDATION=true
```

### Monitoring

#### Health Checks
```bash
# Application health
curl http://localhost:5000/api/health

# Database health
curl http://localhost:5000/api/database/health

# AI services health
curl http://localhost:5000/api/agents/health
```

#### Metrics
- System performance metrics
- Agent workload distribution
- Database query performance
- Security event monitoring

## API Reference

### Authentication
```bash
# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

# Logout
POST /api/auth/logout
```

### Property Valuation
```bash
# Calculate property value
POST /api/valuations/calculate
{
  "propertyId": "123",
  "buildingType": "SFR",
  "squareFeet": 2000,
  "yearBuilt": 2010,
  "quality": "good",
  "condition": "average"
}

# Get valuation history
GET /api/valuations/history/:propertyId
```

### AI Agents
```bash
# Get agent status
GET /api/agents/status

# Submit task to agents
POST /api/agents/tasks
{
  "type": "property_valuation",
  "payload": { ... },
  "priority": "high"
}

# Get task results
GET /api/agents/tasks/:taskId
```

## Data Management

### Import Formats

- **Property Data**: CSV, Excel, Shapefile
- **Cost Matrices**: Excel with standardized format
- **GIS Data**: Shapefile, KML, GeoJSON
- **Assessment Data**: CAMA system exports

### Export Options

- **Valuation Reports**: PDF, Excel, CSV
- **GIS Data**: Shapefile, KML, GeoJSON
- **Analytics**: Charts, graphs, statistical summaries
- **Audit Reports**: Comprehensive system logs

## Integration

### GIS Systems
- ArcGIS Server integration
- QGIS compatibility
- Web mapping services
- Spatial data synchronization

### ERP Systems
- SAP integration capabilities
- Oracle connectivity
- Custom API endpoints
- Data transformation pipelines

### Tax Systems
- Property tax calculation
- Assessment roll generation
- Appeal management
- Compliance reporting

## Support

### Documentation
- [Bootstrap Guide](docs/BOOTSTRAP_GUIDE.md)
- [Product Requirements](docs/PRODUCT_REQUIREMENTS_DOCUMENT.md)
- [DevOps Guide](docs/DEVOPS_KIT.md)
- [API Reference](docs/API_REFERENCE.md)
- [Security Guide](docs/SECURITY_GUIDE.md)

### Training Resources
- User training materials
- Administrator guides
- Developer documentation
- Video tutorials

### Technical Support
- 24/7 system monitoring
- Professional services
- Training programs
- Consulting services

## Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Maintain test coverage >80%
3. Use conventional commit messages
4. Update documentation for changes
5. Security review for all changes

### Code Standards
- ESLint configuration enforced
- Prettier for code formatting
- Husky pre-commit hooks
- Automated testing required

## License

Enterprise License - See [LICENSE](LICENSE) file for details.

## Contact

For technical support, feature requests, or licensing inquiries, please contact the development team through the appropriate channels.

---

**TerraBuild Enterprise Platform** - Revolutionizing property assessment through AI-driven automation and enterprise-grade security.