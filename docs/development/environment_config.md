# TerraBuild Environment Configuration

This document details the environment variables and configuration settings used by the TerraBuild platform.

## Overview

TerraBuild uses environment variables for configuration to support flexible deployment across different environments (development, testing, production) and different jurisdictions (counties).

## Frontend Environment Variables

These variables configure the frontend React application:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `REACT_APP_API_URL` | URL of the backend API | `http://localhost:5001` | Yes |
| `REACT_APP_JURISDICTION` | Name of the jurisdiction/county | `Benton County, WA` | Yes |
| `REACT_APP_REGION` | Region name within the jurisdiction | `Eastern Washington` | Yes |
| `REACT_APP_DEFAULT_LANGUAGE` | Default language for the interface | `en` | No |
| `REACT_APP_ENABLE_ANALYTICS` | Enable/disable analytics | `false` | No |
| `REACT_APP_VERSION` | Application version | package.json version | No |

### Frontend Configuration Files

#### Development

Create a `.env.local` file in the frontend directory:

```
REACT_APP_API_URL=http://localhost:5001
REACT_APP_JURISDICTION=Benton County, WA
REACT_APP_REGION=Eastern Washington
```

#### Production

For production deployments (e.g., Vercel), set these environment variables in your deployment platform.

## Backend Environment Variables

These variables configure the backend FastAPI application:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Port to run the API server | `5001` | No |
| `ENVIRONMENT` | Environment name (`development`, `production`) | `development` | No |
| `DATABASE_URL` | PostgreSQL connection string | None | Required for PostgreSQL |
| `STORAGE_TYPE` | Storage type (`file`, `postgres`) | `file` | No |
| `STORAGE_DIR` | Directory for file storage | `./data` | No if using PostgreSQL |
| `LOG_LEVEL` | Logging level | `info` | No |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `*` | No |
| `SECRET_KEY` | Secret key for session encryption | Random generated | Yes for production |

### Backend Configuration Files

#### Development

Create a `.env` file in the backend directory:

```
PORT=5001
ENVIRONMENT=development
STORAGE_TYPE=file
STORAGE_DIR=./data
LOG_LEVEL=debug
```

#### Production

For production deployments (e.g., Fly.io), set these environment variables in your deployment platform:

```
PORT=5001
ENVIRONMENT=production
DATABASE_URL=postgresql://username:password@hostname:port/database
STORAGE_TYPE=postgres
LOG_LEVEL=info
CORS_ORIGINS=https://your-frontend-domain.com
SECRET_KEY=your-secure-secret-key
```

## Jurisdiction Configuration

TerraBuild is designed to support different jurisdictions (counties) through environment variables.

### Adding a New Jurisdiction

1. Set appropriate values for `REACT_APP_JURISDICTION` and `REACT_APP_REGION`
2. Create jurisdiction-specific assets (like logos, seals, and branding elements)
3. Update PDF templates and export formats if needed

### Multi-Jurisdiction Deployment

For deploying multiple instances for different jurisdictions:

1. Create separate deployments for each jurisdiction
2. Configure each with the appropriate environment variables
3. Use separate database schemas or instances if needed

## Configuration Precedence

TerraBuild loads configuration in the following order (later sources override earlier ones):

1. Default values hardcoded in the application
2. `.env` file in the project root
3. `.env.local` file (for local overrides, not committed to Git)
4. Environment variables set in the shell or deployment platform

## Sensitive Configuration

Never commit sensitive information like API keys, database credentials, or session secrets to version control. Always use environment variables for these values.

For local development, you can use `.env.local` files (which should be added to `.gitignore`).

## Configuration Validation

Both the frontend and backend applications validate their configuration on startup and will log warnings if required values are missing.

## Troubleshooting

Common configuration issues:

1. **API Connection Failures**: Check `REACT_APP_API_URL` in the frontend and `PORT` in the backend
2. **CORS Errors**: Verify `CORS_ORIGINS` includes your frontend domain
3. **Database Connection Failures**: Validate `DATABASE_URL` format and credentials
4. **Wrong Jurisdiction Display**: Confirm `REACT_APP_JURISDICTION` and `REACT_APP_REGION` are set correctly