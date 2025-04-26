#!/bin/bash
# E2E Test Runner for BCBS Application
# Runs end-to-end tests using Playwright

set -e

# Parse command line arguments
UI_MODE=false
BROWSER="chromium"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --ui) UI_MODE=true ;;
    --browser=*) BROWSER="${1#*=}" ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Create directories for test results
mkdir -p test-results/playwright/html-report
mkdir -p test-results/screenshots

echo "Running E2E tests..."

if [[ "$UI_MODE" == true ]]; then
  # Run in UI mode
  echo "Starting tests in UI mode..."
  npx playwright test --ui
else
  # Run headless
  echo "Running tests with browser: $BROWSER"
  npx playwright test --project=$BROWSER
fi

# Report results
if [[ $? -eq 0 ]]; then
  echo "✅ E2E tests completed successfully!"
else
  echo "❌ E2E tests failed!"
  exit 1
fi