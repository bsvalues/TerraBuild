#!/bin/bash
set -e

# Set default agent type if not provided
AGENT_TYPE=${AGENT_TYPE:-"generic"}
echo "Starting TerraFusion AI Agent: $AGENT_TYPE"

# Configure environment based on agent type
case "$AGENT_TYPE" in
  "data-quality")
    AGENT_MODULE="server/ai/agents/data-quality-agent"
    ;;
  "compliance")
    AGENT_MODULE="server/ai/agents/compliance-agent"
    ;;
  "cost-analysis")
    AGENT_MODULE="server/ai/agents/cost-analysis-agent"
    ;;
  "development")
    AGENT_MODULE="server/ai/agents/development-agent"
    ;;
  "design")
    AGENT_MODULE="server/ai/agents/design-agent"
    ;;
  "data-analysis")
    AGENT_MODULE="server/ai/agents/data-analysis-agent"
    ;;
  "geospatial")
    AGENT_MODULE="server/ai/agents/geospatial-analysis-agent"
    ;;
  "document")
    AGENT_MODULE="server/ai/agents/document-processing-agent"
    ;;
  "benton-conversion")
    AGENT_MODULE="server/ai/agents/benton-county-conversion-agent"
    ;;
  *)
    echo "Unknown agent type: $AGENT_TYPE. Using generic agent."
    AGENT_MODULE="server/ai/agents/generic-agent"
    ;;
esac

# Start health check server
node -e "
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'application/json'});
  res.end(JSON.stringify({status: 'ok', agent: '$AGENT_TYPE'}));
});
server.listen(8080, '0.0.0.0', () => {
  console.log('Health check server running on port 8080');
});
" &

# Wait for dependencies to be available if needed
if [ ! -z "$WAIT_FOR_SERVICES" ]; then
  echo "Waiting for dependencies: $WAIT_FOR_SERVICES"
  # Add logic to wait for dependent services
  sleep 5
fi

# Run the agent process
echo "Executing agent module: $AGENT_MODULE"
NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY:-512}" node $AGENT_MODULE