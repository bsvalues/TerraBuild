# TerraBuild Developer Kit

The TerraBuild Developer Kit is a comprehensive toolset designed to rapidly set up a complete infrastructure cost management system. It provides everything needed to spin up an API, Postgres database, sample data, and React UI scaffold in under a minute.

## Overview

TerraBuild offers a streamlined way to calculate and manage infrastructure costs for the Benton County Building Cost Assessment System. The developer kit includes:

- Complete API with import and calculation endpoints
- React-based UI components
- Pre-configured PostgreSQL database integration
- Sample data import tools
- Docker containerization support

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
terrabuild-devkit/
├── client/               # React frontend
│   └── src/
│       ├── components/   # Reusable UI components
│       └── pages/        # Application pages
├── data/                 # Cost factor data
├── sample/               # Sample data for import
├── scripts/              # Utility scripts
├── server/               # Express API server
│   ├── routes/           # API route definitions
│   └── storage/          # Database integration
└── docker-compose.yml    # Docker configuration
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