# Docker Development Guide

This guide provides instructions for setting up and using the Docker development environment for the Benton County Building Cost System (BCBS) project.

## Prerequisites

- Docker and Docker Compose installed on your local machine
- Git installed for repository management
- Basic knowledge of Docker and containerization

## Quick Start

1. Clone the repository
2. Navigate to the project directory
3. Run the helper script to start the development environment:

```bash
./scripts/docker-dev.sh start
```

4. Open your browser and navigate to http://localhost:5000

## Development Environment Structure

The development environment consists of several Docker containers:

- **Web Container**: Runs the Node.js application with hot reloading
- **Database Container**: PostgreSQL database for data storage
- **Redis Container**: Redis instance for caching and session management

## Helper Script Commands

We provide a helper script (`scripts/docker-dev.sh`) to simplify common Docker operations:

| Command | Description |
|---------|-------------|
| `start` | Start the development environment |
| `stop` | Stop the development environment |
| `restart` | Restart the development environment |
| `rebuild` | Rebuild the development environment |
| `logs` | Show logs from the containers |
| `shell` | Open a shell in the web container |
| `psql` | Open a PostgreSQL shell |
| `redis-cli` | Open a Redis CLI shell |
| `test` | Run tests in the Docker environment |
| `status` | Show status of Docker containers |
| `clean` | Remove all containers and volumes |
| `help` | Show the help message |

## Manual Docker Commands

If you prefer using Docker commands directly:

```bash
# Start containers in the background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild containers
docker-compose build
```

## Database Access

The PostgreSQL database is exposed on port 5432. You can connect to it using:

- **Host**: localhost
- **Port**: 5432
- **Database**: bcbs
- **Username**: bcbs
- **Password**: bcbs

Or use the helper script to open a PostgreSQL shell:

```bash
./scripts/docker-dev.sh psql
```

## Troubleshooting

### Container not starting

If a container fails to start, check the logs:

```bash
docker-compose logs web
```

### Database connection issues

Ensure that the database credentials in `.env.dev` match those in `docker-compose.yml`.

### Port conflicts

If you have port conflicts (e.g., another service using port 5000), edit the port mappings in `docker-compose.yml`.

## Best Practices

1. **Use volume mounts** for development to keep your code changes reflected in real-time
2. **Keep containers stateless** by storing persistent data in volumes
3. **Use the helper scripts** to ensure consistent environment management
4. **Run tests inside Docker** to ensure consistency with the CI environment

## CI/CD Integration

The Docker development environment is designed to match the CI/CD pipeline. When you push changes to GitHub:

1. The CI workflow runs tests in a Docker environment
2. If tests pass and the branch is `main`, the deployment workflow builds and deploys the application

See the [CI/CD Guide](ci_cd_guide.md) for more details.