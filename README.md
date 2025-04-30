# TerraBuild Developer Kit

A comprehensive toolkit for developing with the TerraBuild infrastructure cost management platform for Benton County, Washington.

## Quick Start

```bash
# 1. Start the application and database
docker-compose up -d

# 2. Test API health
curl http://localhost:5000/api/health

# 3. Import sample data
./scripts/import_sample.sh        # or ./scripts/import_sample.sh path/to/your.csv
```

## Directory Structure

- `/client` - React frontend application
- `/server` - Express API backend
- `/shared` - Shared types and utilities
- `/data` - Cost factor tables and other data resources
- `/sample` - Sample data files for testing
- `/scripts` - Utility scripts for development and deployment

## Key Components

### API Server

The API server runs on port 5000 and provides endpoints for:

- Property data management
- Cost calculations
- Assessment reports
- User authentication
- Health monitoring

### Database

PostgreSQL database with the following configuration:

- **Host**: localhost (container name: db)
- **Port**: 5432
- **User**: postgres
- **Password**: postgres
- **Database**: terrabuild

Environment variables are used for database connection (see `.env` file).

### Cost Factor Tables

The system uses versioned cost factor tables (JSON format) to calculate building costs:

- Located in `/data/factors-{year}.json`
- Update by editing or replacing these files
- No code changes needed when updating factors

## Development

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- npm or yarn

### Running Locally Without Docker

```bash
# Install dependencies
npm install

# Start the backend API server
npm run server

# In another terminal, start the frontend
npm run client
```

### Updating Cost Factors

To update the cost factors for a new year:

1. Create a new file `data/factors-{year}.json` based on the existing template
2. Edit the factors as needed
3. Restart the application (Docker container restart required)

## API Endpoints

### Health Check

```
GET /api/health
```

### Property Data Import

```
POST /api/import/parcels
Content-Type: multipart/form-data
file: CSV file
```

### Cost Calculation

```
POST /api/calculate
Content-Type: application/json
{
  "buildingType": "RES",
  "region": "BC-CENTRAL",
  "yearBuilt": 2010,
  "quality": "STANDARD",
  "condition": "GOOD",
  "complexity": "STANDARD",
  "squareFeet": 2000
}
```

## Troubleshooting

- Check the container logs: `docker logs <container_id>`
- Verify the database connection
- Ensure correct environment variables in `.env`
- Check API health endpoint: `/api/health`

## License

© 2025 TerraBuild. All rights reserved.