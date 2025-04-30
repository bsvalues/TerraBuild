# TerraFusion Platform

TerraFusion is a cutting-edge AI-powered infrastructure optimization platform designed to transform government infrastructure lifecycle management for Benton County, Washington, through intelligent decision support and advanced predictive modeling.

## Overview

TerraFusion offers a comprehensive solution for infrastructure cost management with advanced AI capabilities:

- AI-powered cost assessment and prediction system
- Multi-agent AI architecture with specialized components
- Complete API with import and calculation endpoints
- React-based UI with modular, responsive components
- Pre-configured PostgreSQL database integration
- Advanced data analysis and visualization tools
- Comprehensive DevOps infrastructure with CI/CD
- Docker containerization and AWS deployment support

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (for containerized development)
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/terrabuild-devkit.git
   cd terrabuild-devkit
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development environment:
   ```
   npm run dev
   ```

### Using Docker (Recommended)

For a completely isolated development environment:

1. Build and start the containers:
   ```
   docker-compose -f dev-compose.yml up -d
   ```

2. The application will be available at http://localhost:5000

## Key Components

### API Routes

The TerraBuild Developer Kit provides several key API routes:

- `/api/calculate` - POST endpoint for cost calculations
- `/api/import/parcels` - POST endpoint for importing property data
- `/api/import/factors` - POST endpoint for importing cost factors

### Data Import

Sample data can be imported using the provided script:

```
chmod +x scripts/import_sample.sh
./scripts/import_sample.sh
```

This will populate your database with:
- Cost factors from `data/factors-2025.json`
- Property data from `sample/parcel_data.csv`

### React Components

The kit includes a React-based cost calculator component:

- CostCalculator - A form-based calculator for estimating building costs

Access the calculator at: `/cost-calculator`

## Cost Calculation

The system uses a factor-based approach to calculate building costs:

1. Base cost determined by building type (e.g., residential, commercial)
2. Adjustments applied based on:
   - Region
   - Building quality
   - Condition
   - Age
   - Design complexity

The calculation follows this formula:
```
Total Cost = Base Cost × Region Factor × Quality Factor × Condition Factor × Age Factor × Complexity Factor
```

## Development

### Project Structure

```
terrafusion/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       └── pages/          # Application pages
├── data/                   # Cost factor data
├── sample/                 # Sample data for import
├── scripts/                # Utility scripts
│   ├── backup_and_restore.sh    # Database backup/restore
│   ├── db-migration.sh          # Database migration
│   ├── init-terraform-backend.sh # Terraform backend setup
│   ├── setup-aws-profiles.sh    # AWS profile setup
│   └── terraform-cmd.sh         # Terraform command wrapper
├── server/                 # Express API server
│   ├── routes/             # API route definitions
│   └── storage/            # Database integration
├── terraform/              # Infrastructure as Code
│   └── environments/       # Environment-specific configurations
│       ├── dev/            # Development environment
│       ├── staging/        # Staging environment
│       └── prod/           # Production environment
├── docker-compose.yml      # Docker configuration
├── .github/workflows/      # CI/CD pipelines
│   ├── ci.yml              # Continuous Integration
│   └── deploy.yml          # Deployment workflow
└── DEVOPS_README.md        # DevOps documentation
```

### Adding Custom Factors

To customize the cost factors:

1. Edit the `data/factors-2025.json` file
2. Add or modify the factors as needed
3. Run the import script to update the database

### Extending the API

To add new API endpoints:

1. Create a new route file in `server/routes/`
2. Implement your custom logic
3. Register the route in `server/routes.ts`

### DevOps Infrastructure

The project includes a comprehensive DevOps setup:

1. **Environment Management**: Configure dev, staging, and production environments
2. **CI/CD Pipelines**: Automated testing, building, and deployment
3. **Database Operations**: Migration, backup, and restore scripts
4. **Infrastructure as Code**: AWS resources managed with Terraform

For detailed instructions, see the [DevOps Guide](DEVOPS_README.md)

## Testing

Run the API tests:

```
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions and support, please open an issue on the GitHub repository or contact the TerraBuild team.