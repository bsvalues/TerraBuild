# TerraFusion Factor Tuner Agent Dockerfile
# Extends the base agent image with specific code for the Factor Tuner agent

ARG BASE_IMAGE=terrafusion-agent-base:latest

# ---- Base Stage ----
FROM ${BASE_IMAGE} AS base

# Copy Factor Tuner specific files
COPY --chown=terrafusion:terrafusion server/mcp/agents/costAnalysisAgent.ts ./server/mcp/agents/
COPY --chown=terrafusion:terrafusion server/agents/factor-tuner ./server/agents/factor-tuner/
COPY --chown=terrafusion:terrafusion server/services/cost-analysis ./server/services/cost-analysis/

# Copy AI models and training data
COPY --chown=terrafusion:terrafusion data/models/factor-tuner ./data/models/factor-tuner/
COPY --chown=terrafusion:terrafusion data/training/factor-tuner ./data/training/factor-tuner/

# Install additional dependencies specific to Factor Tuner
RUN npm install --no-save \
    mathjs@latest \
    ml-regression@latest \
    fast-xml-parser@latest \
    csv-parser@latest

# Set environment variables
ENV AGENT_ID=factor-tuner
ENV AGENT_NAME="Factor Tuner"
ENV AGENT_DESCRIPTION="Tunes cost factors based on historical data and regional adjustments"
ENV AGENT_VERSION=${BUILD_VERSION:-1.0.0}
ENV MODEL_PATH=/app/data/models/factor-tuner
ENV TRAINING_DATA_PATH=/app/data/training/factor-tuner

# Expose metrics endpoint
EXPOSE 9090

# Override the default command
CMD ["node", "server/agents/factor-tuner/index.js"]

# Add agent-specific labels
LABEL org.opencontainers.image.title="TerraFusion Factor Tuner Agent" \
      org.opencontainers.image.description="Factor Tuner agent for TerraFusion platform" \
      terrafusion.agent.id="factor-tuner" \
      terrafusion.agent.type="cost-analysis" \
      terrafusion.agent.priority="high" \
      terrafusion.agent.capabilities="regional-factors,cost-tuning,quality-factors,temporal-analysis"