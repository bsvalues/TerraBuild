# TerraBuild - Comprehensive Rust Axum Backend

## Overview

A complete production-ready property valuation platform built with Rust (Axum) backend and Next.js frontend, designed for municipal property assessments with advanced cost approach methodology.

## Architecture

### Backend Stack
- **Framework**: Axum (async web framework)
- **Database**: PostgreSQL with PostGIS
- **Authentication**: JWT with role-based access control
- **Testing**: Comprehensive unit and integration tests
- **Documentation**: OpenAPI/Swagger compatible

### Frontend Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: SWR for data fetching
- **Forms**: React Hook Form with Zod validation

## Features Implemented

### Core Functionality
✅ Property valuation using cost approach methodology
✅ Cost table management with versioning
✅ Depreciation schedule calculations
✅ Scenario modeling and what-if analysis
✅ Comprehensive reporting and analytics
✅ GIS spatial analysis capabilities
✅ Batch data processing
✅ Role-based access control (Admin, Assessor, Analyst, Viewer)

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - List all users (admin only)

#### Valuations
- `GET /api/valuation/{id}` - Get property valuation
- `POST /api/valuation` - Create new valuation
- `GET /api/valuation/{id}/history` - Get valuation history
- `POST /api/valuation/batch` - Batch valuation processing

#### Cost Tables
- `GET /api/cost-table` - List cost tables with filtering
- `POST /api/cost-table` - Create cost table entry
- `PUT /api/cost-table/{id}` - Update cost table entry
- `DELETE /api/cost-table/{id}` - Delete cost table entry
- `GET /api/cost-table/lookup` - Lookup specific cost factors
- `POST /api/cost-table/bulk` - Bulk import cost tables

#### Scenarios
- `GET /api/scenario` - List user scenarios
- `POST /api/scenario` - Create scenario
- `POST /api/scenario/matrix` - Create matrix scenario
- `GET /api/scenario/{id}` - Get scenario details
- `DELETE /api/scenario/{id}` - Delete scenario
- `POST /api/scenario/compare` - Compare scenarios

#### Reports
- `GET /api/report/summary` - Summary statistics
- `GET /api/report/regional` - Regional analysis
- `GET /api/report/trends` - Historical trends
- `GET /api/report/valuations` - Valuation reports

#### GIS Operations
- `GET /api/gis/layers` - List GIS layers
- `POST /api/gis/layers` - Create GIS layer
- `POST /api/gis/spatial-query` - Spatial queries
- `POST /api/gis/properties-in-area` - Find properties in area
- `POST /api/gis/buffer-analysis` - Buffer analysis

#### Batch Processing
- `POST /api/batch/upload` - Upload batch files
- `GET /api/batch/status/{id}` - Check batch status
- `GET /api/batch/history` - Batch processing history

## Quick Start

### Prerequisites
- Rust 1.75+
- Node.js 18+
- PostgreSQL 15+ with PostGIS
- Docker & Docker Compose (optional)

### Development Setup

1. **Clone and setup backend**:
```bash
cd backend
cp .env.example .env
# Edit .env with your database connection
cargo build
cargo run
```

2. **Setup frontend**:
```bash
cd frontend
npm install
npm run dev
```

3. **Database setup**:
```bash
# Create database
createdb terrabuild

# Run migrations (handled automatically by backend)
cd backend
cargo run
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Database Schema

### Core Tables
- `property` - Property information with geospatial data
- `cost_table` - Cost factors by property type, quality, year, region
- `depreciation_schedule` - Age-based depreciation factors
- `valuation` - Calculated valuations with audit trails
- `scenario` - Scenario modeling data
- `user` - Authentication and role management
- `gis_layer` - Geospatial layers for analysis
- `batch_upload` - Batch processing tracking

### Sample Data
The system includes sample cost tables and depreciation schedules based on Marshall Swift standards.

## Authentication & Authorization

### Roles
- **Admin**: Full system access, user management
- **Assessor**: Create/update cost tables, run valuations
- **Analyst**: Run scenarios, generate reports
- **Viewer**: Read-only access to reports

### Default Credentials
- Username: `admin`
- Password: `admin123`

## Testing

### Backend Tests
```bash
cd backend
cargo test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
# Run full test suite
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Deployment

### Production Environment Variables

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/terrabuild
PORT=8080
RUST_LOG=info
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Performance & Scaling

### Database Optimization
- Indexed queries on property lookups
- Geospatial indexes for GIS operations
- Pagination on all list endpoints
- Connection pooling configured

### Caching Strategy
- Redis integration ready
- Query result caching
- Static asset optimization

### Monitoring
- Structured logging with tracing
- Health check endpoints
- Metrics collection ready

## API Documentation

Access interactive API documentation:
- Development: http://localhost:8080/docs
- Production: Configure Swagger UI endpoint

## Security Features

- JWT token authentication
- Password hashing with Argon2
- SQL injection prevention
- CORS configuration
- Input validation with Zod
- Rate limiting ready

## Cost Calculation Engine

### Methodology
The system implements the cost approach to property valuation:

1. **Replacement Cost New (RCN)**:
   ```
   RCN = Base Cost × Square Footage × Market Factor × Location Factor
   ```

2. **Depreciated Value**:
   ```
   Final Value = RCN × Percent Good
   ```

3. **Factors**:
   - Base costs from Marshall Swift tables
   - Market factors for economic conditions
   - Location factors for regional adjustments
   - Age-based depreciation schedules

### Audit Trail
Every calculation includes complete audit trail with:
- Input parameters
- Applied factors and sources
- Step-by-step calculation chain
- User attribution and timestamps

## Extensibility

### Adding New Features
1. Define models in `src/models.rs`
2. Implement business logic in `src/services/`
3. Create API endpoints in `src/api/`
4. Add frontend components in React
5. Write comprehensive tests

### Database Migrations
```bash
# Backend handles migrations automatically
# Add new migration files to backend/migrations/
```

## Troubleshooting

### Common Issues

1. **Database Connection**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure PostGIS extension is installed

2. **Compilation Errors**:
   - Update Rust toolchain: `rustup update`
   - Clean build: `cargo clean && cargo build`

3. **Frontend Issues**:
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check API URL configuration

### Logs
```bash
# Backend logs
RUST_LOG=debug cargo run

# Docker logs
docker-compose logs backend
docker-compose logs frontend
```

## Support

For technical issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify configuration settings
4. Test with sample data

## License

MIT License - see LICENSE file for details.

---

This implementation provides a comprehensive, production-ready property valuation platform with modern architecture, security features, and extensive functionality for municipal assessment operations.