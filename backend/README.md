# TerraBuild Backend

This directory contains the FastAPI backend service for TerraBuild, a property valuation platform for county assessor's offices.

## Overview

The TerraBuild backend provides:

- RESTful API endpoints for matrix data management
- Session handling and persistence
- PDF and JSON export generation
- AI agent insights integration
- Cross-jurisdiction configuration

## Getting Started

### Prerequisites

- Python 3.9+
- pip or poetry for dependency management
- PostgreSQL (optional, for production)

### Installation

1. Create a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` to configure your environment (see [Environment Configuration](../docs/development/environment_config.md) for details).

### Development

Start the development server:

```bash
uvicorn terrabuild_api:app --reload --port 5001
```

This will start the API at [http://localhost:5001](http://localhost:5001).

API documentation will be available at:
- Swagger UI: [http://localhost:5001/docs](http://localhost:5001/docs)
- ReDoc: [http://localhost:5001/redoc](http://localhost:5001/redoc)

## Directory Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   ├── core/             # Core functionality
│   ├── models/           # Data models
│   ├── services/         # Business logic services
│   │   ├── export_service.py
│   │   └── session_service.py
│   └── utils/            # Utility functions
│       └── pdf_generator.py
├── data/                 # Data storage for development
│   └── benton_matrix_demo.json
├── terrabuild_api.py     # Main API entry point
├── requirements.txt      # Python dependencies
└── .env.example          # Example environment variables
```

## Key Components

### terrabuild_api.py

The main FastAPI application that defines routes and handlers.

### session_service.py

Manages storage and retrieval of valuation sessions.

### export_service.py

Handles the generation of PDF and JSON exports.

### pdf_generator.py

Creates formatted PDF reports with county branding.

## API Endpoints

- `GET /api/health` - Health check endpoint
- `POST /api/sessions` - Create a new valuation session
- `GET /api/sessions/{session_id}` - Get a valuation session by ID
- `PUT /api/sessions/{session_id}` - Update an existing valuation session
- `POST /api/insights/generate` - Generate AI agent insights
- `POST /api/export` - Export session data as PDF or JSON
- `GET /api/jurisdictions` - Get available jurisdictions

## Database Setup

See the [Database Setup](../docs/development/database_setup.md) document for detailed instructions on configuring storage options.

## Deployment

The backend can be deployed to Fly.io, Heroku, or other Python-compatible hosting services. See the [Fly.io Deployment Guide](../docs/deployment/fly_io_deployment.md) for detailed instructions.

## Related Documentation

- [Main README](../README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)
- [Deployment Guides](../docs/deployment/)
- [Demo Scripts](../docs/demo/)