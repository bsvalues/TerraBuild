# TerraBuild Database Setup

This guide explains how to set up and configure the database for TerraBuild development and production environments.

## Database Options

TerraBuild supports two primary database options:

1. **File-based Storage** (default for development)
   - Uses JSON files for storage
   - Simple setup, no additional services required
   - Suitable for development and testing

2. **PostgreSQL** (recommended for production)
   - Scalable relational database
   - Supports complex queries and transactions
   - Suitable for production deployments

## Setting Up PostgreSQL

### Local Development

#### Option 1: Using Docker (Recommended)

The easiest way to set up PostgreSQL for local development is using Docker:

```bash
# Start a PostgreSQL container
docker run --name terrabuild-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=terrabuild -p 5432:5432 -d postgres:14
```

This will create a PostgreSQL instance accessible at `localhost:5432` with:
- Username: `postgres`
- Password: `postgres`
- Database: `terrabuild`

#### Option 2: Native Installation

1. [Download and install PostgreSQL](https://www.postgresql.org/download/)
2. Create a database:

```bash
# Log into PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE terrabuild;
CREATE USER terrabuild_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE terrabuild TO terrabuild_user;
```

### Production Setup

For production, we recommend:

1. **Managed PostgreSQL Services**:
   - [Fly.io Postgres](https://fly.io/docs/postgres/)
   - [Supabase PostgreSQL](https://supabase.com/)
   - [Railway PostgreSQL](https://railway.app/)
   - [Amazon RDS](https://aws.amazon.com/rds/postgresql/)

2. **Self-Hosted Options**:
   - PostgreSQL on a dedicated VM
   - PostgreSQL in Docker with persistent volumes

## Configuration

### Environment Variables

Configure the database connection using environment variables:

```bash
# PostgreSQL connection
DATABASE_URL=postgresql://username:password@hostname:port/database

# Optional settings
PG_MAX_CONNECTIONS=10
PG_IDLE_TIMEOUT=30
```

### Database Initialization

The TerraBuild API will automatically initialize the database schema on first run. To manually initialize:

```bash
# From backend directory
python -m app.utils.db_init
```

## Data Migration

### Migrating from File Storage to PostgreSQL

If you've been using file-based storage and want to migrate to PostgreSQL:

1. Export existing data:

```bash
# From backend directory
python -m app.utils.export_data --output data_export.json
```

2. Import data to PostgreSQL:

```bash
# From backend directory
python -m app.utils.import_data --input data_export.json
```

## Backup and Restore

### Creating a Backup

```bash
# PostgreSQL backup
pg_dump -U username -h hostname -d terrabuild > terrabuild_backup.sql

# For Docker-based PostgreSQL
docker exec terrabuild-postgres pg_dump -U postgres terrabuild > terrabuild_backup.sql
```

### Restoring from Backup

```bash
# PostgreSQL restore
psql -U username -h hostname -d terrabuild < terrabuild_backup.sql

# For Docker-based PostgreSQL
cat terrabuild_backup.sql | docker exec -i terrabuild-postgres psql -U postgres terrabuild
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if PostgreSQL is running: `ps -ef | grep postgres`
   - Verify your host and port settings
   - Check firewall settings

2. **Authentication Failed**
   - Verify username and password
   - Check `pg_hba.conf` for allowed authentication methods

3. **Database Does Not Exist**
   - Connect to PostgreSQL and create the database: `CREATE DATABASE terrabuild;`

4. **Permission Denied**
   - Ensure your user has appropriate permissions: `GRANT ALL PRIVILEGES ON DATABASE terrabuild TO username;`

### Connection Testing

Test your database connection:

```bash
# From backend directory
python -m app.utils.test_db_connection
```

## Database Schema

The primary tables in the TerraBuild schema are:

1. **sessions** - Stores valuation sessions
2. **matrix_data** - Stores cost matrix values
3. **insights** - Stores AI agent insights
4. **history** - Stores change history and audit trails
5. **users** - Stores user information

See the entity-relationship diagram in `docs/development/database_schema.md` for details.