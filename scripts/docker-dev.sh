#!/bin/bash

# Docker Development Helper Script for BCBS Project
# This script provides shortcuts for common Docker operations

set -e

# Display help information
function show_help {
  echo "BCBS Docker Development Helper"
  echo ""
  echo "Usage: ./scripts/docker-dev.sh [command]"
  echo ""
  echo "Commands:"
  echo "  up             Start all containers"
  echo "  down           Stop all containers"
  echo "  build          Rebuild containers"
  echo "  restart        Restart all containers"
  echo "  logs           View container logs"
  echo "  db             Access PostgreSQL CLI"
  echo "  redis          Access Redis CLI"
  echo "  migrate        Run database migrations"
  echo "  test           Run tests in Docker environment"
  echo "  clean          Remove all containers and volumes"
  echo "  help           Show this help message"
  echo ""
}

# Start all containers
function start_containers {
  echo "🚀 Starting BCBS development environment..."
  docker-compose up -d
  echo "✅ Development environment is running"
  echo "🌎 Application is available at http://localhost:5000"
}

# Stop all containers
function stop_containers {
  echo "🛑 Stopping BCBS development environment..."
  docker-compose down
  echo "✅ Development environment stopped"
}

# Rebuild containers
function rebuild_containers {
  echo "🏗️ Rebuilding BCBS containers..."
  docker-compose build
  echo "✅ Containers rebuilt successfully"
}

# Restart all containers
function restart_containers {
  echo "🔄 Restarting BCBS development environment..."
  docker-compose restart
  echo "✅ Development environment restarted"
}

# View container logs
function view_logs {
  echo "📋 Showing container logs (press Ctrl+C to exit)..."
  docker-compose logs -f
}

# Access PostgreSQL CLI
function access_db {
  echo "🗃️ Connecting to PostgreSQL database..."
  docker-compose exec db psql -U bcbs -d bcbs
}

# Access Redis CLI
function access_redis {
  echo "📦 Connecting to Redis..."
  docker-compose exec redis redis-cli
}

# Run database migrations
function run_migrations {
  echo "🔄 Running database migrations..."
  docker-compose exec web npm run db:push
  echo "✅ Migrations completed"
}

# Run tests in Docker environment
function run_tests {
  echo "🧪 Running tests in Docker environment..."
  docker-compose exec web npm test
}

# Clean all Docker resources
function clean_resources {
  echo "🧹 Cleaning up Docker resources..."
  docker-compose down -v
  echo "✅ All containers and volumes removed"
}

# Main script logic
case "$1" in
  up)
    start_containers
    ;;
  down)
    stop_containers
    ;;
  build)
    rebuild_containers
    ;;
  restart)
    restart_containers
    ;;
  logs)
    view_logs
    ;;
  db)
    access_db
    ;;
  redis)
    access_redis
    ;;
  migrate)
    run_migrations
    ;;
  test)
    run_tests
    ;;
  clean)
    clean_resources
    ;;
  help|*)
    show_help
    ;;
esac