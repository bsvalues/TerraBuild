#!/bin/sh
# Docker healthcheck script for TerraFusion containers

set -e

# Check if nginx is running
if ! pgrep -x "nginx" > /dev/null; then
  echo "Nginx is not running"
  exit 1
fi

# Curl the health endpoint - adjust if needed
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)

if [ "$response" = "200" ]; then
  echo "Health check succeeded"
  exit 0
else
  echo "Health check failed with status: $response"
  exit 1
fi