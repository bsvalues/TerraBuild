#!/bin/bash
# BCBS Docker Development Helper Script
# This script provides easy commands for working with Docker during development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Command to execute
CMD=${1:-help}

# Help function
function show_help {
  echo -e "${BLUE}BCBS Docker Development Helper${NC}"
  echo -e "Usage: ./scripts/docker-dev.sh [command]"
  echo
  echo -e "Commands:"
  echo -e "  ${YELLOW}start${NC}        - Start the development environment"
  echo -e "  ${YELLOW}stop${NC}         - Stop the development environment"
  echo -e "  ${YELLOW}restart${NC}      - Restart the development environment"
  echo -e "  ${YELLOW}rebuild${NC}      - Rebuild the development environment"
  echo -e "  ${YELLOW}logs${NC}         - Show logs from the containers"
  echo -e "  ${YELLOW}shell${NC}        - Open a shell in the web container"
  echo -e "  ${YELLOW}psql${NC}         - Open a PostgreSQL shell"
  echo -e "  ${YELLOW}redis-cli${NC}    - Open a Redis CLI shell"
  echo -e "  ${YELLOW}test${NC}         - Run tests in the Docker environment"
  echo -e "  ${YELLOW}status${NC}       - Show status of Docker containers"
  echo -e "  ${YELLOW}clean${NC}        - Remove all containers and volumes"
  echo -e "  ${YELLOW}help${NC}         - Show this help message"
}

# Start the development environment
function start_dev {
  echo -e "${GREEN}Starting development environment...${NC}"
  docker-compose up -d
  echo -e "${GREEN}Development environment started at ${YELLOW}http://localhost:5000${NC}"
}

# Stop the development environment
function stop_dev {
  echo -e "${GREEN}Stopping development environment...${NC}"
  docker-compose down
  echo -e "${GREEN}Development environment stopped${NC}"
}

# Restart the development environment
function restart_dev {
  echo -e "${GREEN}Restarting development environment...${NC}"
  docker-compose restart
  echo -e "${GREEN}Development environment restarted${NC}"
}

# Rebuild the development environment
function rebuild_dev {
  echo -e "${GREEN}Rebuilding development environment...${NC}"
  docker-compose down
  docker-compose build
  docker-compose up -d
  echo -e "${GREEN}Development environment rebuilt and started${NC}"
}

# Show logs from the containers
function show_logs {
  echo -e "${GREEN}Showing logs from containers...${NC}"
  docker-compose logs -f
}

# Open a shell in the web container
function open_shell {
  echo -e "${GREEN}Opening shell in web container...${NC}"
  docker-compose exec web bash || docker-compose exec web sh
}

# Open a PostgreSQL shell
function open_psql {
  echo -e "${GREEN}Opening PostgreSQL shell...${NC}"
  docker-compose exec db psql -U bcbs -d bcbs
}

# Open a Redis CLI shell
function open_redis_cli {
  echo -e "${GREEN}Opening Redis CLI shell...${NC}"
  docker-compose exec redis redis-cli
}

# Run tests in the Docker environment
function run_tests {
  echo -e "${GREEN}Running tests in Docker environment...${NC}"
  docker-compose exec web npm test
}

# Show status of Docker containers
function show_status {
  echo -e "${GREEN}Showing status of Docker containers...${NC}"
  docker-compose ps
}

# Clean up Docker resources
function clean_dev {
  echo -e "${YELLOW}WARNING: This will remove all containers and volumes!${NC}"
  read -p "Are you sure you want to continue? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Removing all containers and volumes...${NC}"
    docker-compose down -v
    echo -e "${GREEN}Cleanup complete${NC}"
  else
    echo -e "${RED}Operation cancelled${NC}"
  fi
}

# Execute the requested command
case $CMD in
  start)
    start_dev
    ;;
  stop)
    stop_dev
    ;;
  restart)
    restart_dev
    ;;
  rebuild)
    rebuild_dev
    ;;
  logs)
    show_logs
    ;;
  shell)
    open_shell
    ;;
  psql)
    open_psql
    ;;
  redis-cli)
    open_redis_cli
    ;;
  test)
    run_tests
    ;;
  status)
    show_status
    ;;
  clean)
    clean_dev
    ;;
  help|*)
    show_help
    ;;
esac