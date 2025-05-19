# RCN Valuation Engine

## Overview

The RCN (Replacement Cost New) Valuation Engine is a core component of the TerraBuild platform that calculates accurate building replacement costs for property valuation. This module implements industry-standard cost approach methodologies while providing customization options for different jurisdictions.

## Features

- RESTful API for RCN calculations
- Support for various building types and construction methods
- Quality class adjustments
- Regional cost factors
- Age-based depreciation
- Physical condition adjustments
- Integration with TerraBuild's assessment workflow

## API Usage

### Calculate RCN Value

**Endpoint:** `/rcn/calculate`  
**Method:** POST  
**Content-Type:** application/json

#### Request Body

```json
{
  "use_type": "Residential",
  "construction_type": "Wood Frame",
  "sqft": 2000,
  "year_built": 2005,
  "quality_class": "B",
  "locality_index": 1.1,
  "condition": "Average"
}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| use_type | string | Yes | Building use type (Residential, Commercial, etc.) |
| construction_type | string | Yes | Construction method/materials |
| sqft | number | Yes | Building size in square feet |
| year_built | number | Yes | Year of construction |
| quality_class | string | No | Quality class (A, B, C, D, E) - default "B" |
| locality_index | number | No | Regional cost adjustment factor - default 1.0 |
| condition | string | No | Building condition (Excellent, Good, Average, Fair, Poor) - default "Average" |

#### Response

```json
{
  "base_cost": 220000.0,
  "adjusted_rcn": 242000.0,
  "depreciated_rcn": 181500.0,
  "depreciation_pct": 25.0
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| base_cost | number | Base cost before adjustments |
| adjusted_rcn | number | Adjusted replacement cost new (with quality & locality) |
| depreciated_rcn | number | Cost after depreciation |
| depreciation_pct | number | Total depreciation percentage applied |

## Integration

### With TerraBuild Platform

The RCN Valuation Engine integrates with the TerraBuild platform through a microservices architecture. The engine can be deployed independently and accessed via API calls from the main application.

### With External Systems

The RCN API can be called from any external system that can make HTTP requests and handle JSON responses. This allows for integration with:

- CAMA (Computer Assisted Mass Appraisal) systems
- GIS platforms
- Municipal tax management software
- Property record systems

## Deployment

### Requirements

- Python 3.9+
- FastAPI 0.95+
- PostgreSQL 13+ (for storing cost data)
- Docker (optional, for containerized deployment)

### Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

```
DATABASE_URL=postgresql://user:password@localhost:5432/terrabuild
API_KEY=your_secure_api_key
LOCALITY_DATA_PATH=/path/to/locality/data
LOG_LEVEL=INFO
```

### Docker Deployment

```bash
docker build -t rcn-valuation-engine .
docker run -p 8000:8000 --env-file .env rcn-valuation-engine
```

### Manual Deployment

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Development

### Setup Development Environment

```bash
git clone https://github.com/terrabuild/rcn-valuation-engine.git
cd rcn-valuation-engine
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements-dev.txt
```

### Running Tests

```bash
pytest
```

### Creating a New Cost Matrix

To add or update cost data in the system:

1. Prepare a JSON file with the cost data following the schema in `docs/cost_matrix_schema.json`
2. Use the import API: `POST /rcn/import-matrix`
3. Alternatively, use the CLI tool: `python -m rcn_engine.cli import-matrix /path/to/matrix.json`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for information on how to contribute to this project.

## License

This project is proprietary software owned by TerraBuild, Inc.
Copyright © 2025 TerraBuild, Inc. All rights reserved.