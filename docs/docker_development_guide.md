# Docker Development Environment Guide

This guide explains how to set up and use the Docker development environment for the Benton County Building Cost System (BCBS) application.

## Prerequisites

Before you begin, make sure you have the following installed:

1. [Docker](https://docs.docker.com/get-docker/)
2. [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Getting Started

The BCBS application uses Docker Compose to create a consistent development environment with all necessary services.

### Services Included

1. **Web Service**: The Node.js application running the BCBS frontend and backend
2. **PostgreSQL Database**: For persistent data storage
3. **Redis**: For session management and caching

### Setup Instructions

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd bcbs-application
   ```

2. Create your local environment file (a template is provided):
   ```bash
   cp .env.dev .env.local
   ```

3. Modify `.env.local` with any custom settings or secrets you need for local development.

4. Start the Docker environment:
   ```bash
   docker-compose up
   ```

5. Access the application at http://localhost:5000

## Common Tasks

### Rebuilding the Docker Image

If you make changes to the Dockerfile or need to rebuild the image:

```bash
docker-compose build
```

### Running in Detached Mode

To run the services in the background:

```bash
docker-compose up -d
```

### Viewing Logs

To see logs for all services:

```bash
docker-compose logs -f
```

For a specific service:

```bash
docker-compose logs -f web
```

### Stopping the Environment

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (this will delete all database data):

```bash
docker-compose down -v
```

## Database Management

### Accessing the PostgreSQL Database

```bash
docker-compose exec db psql -U bcbs -d bcbs
```

### Running Database Migrations

The application uses Drizzle ORM for database migrations. To run migrations:

```bash
docker-compose exec web npm run db:push
```

## Troubleshooting

### Container Won't Start

1. Check if ports are already in use on your machine
2. Verify that Docker has enough resources allocated
3. Look at the container logs for specific error messages

### Database Connection Issues

If the application can't connect to the database:

1. Ensure the database container is running: `docker-compose ps`
2. Check the DATABASE_URL environment variable in .env.local
3. Wait a few moments - the database might still be initializing

## Next Steps

After getting the Docker environment running, you can:

1. Begin developing new features
2. Run the test suite
3. Set up GitHub Actions CI/CD pipeline

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)