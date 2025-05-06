# TerraFusion Benchmark Guard Agent Dockerfile
# Extends the base agent image with specific code for the Benchmark Guard agent

ARG BASE_IMAGE=terrafusion-agent-base:latest

# ---- Base Stage ----
FROM ${BASE_IMAGE} AS base

# Copy Benchmark Guard specific files
COPY --chown=terrafusion:terrafusion server/mcp/agents/benchmarkAgent.ts ./server/mcp/agents/
COPY --chown=terrafusion:terrafusion server/agents/benchmark-guard ./server/agents/benchmark-guard/
COPY --chown=terrafusion:terrafusion server/services/benchmark ./server/services/benchmark/

# Copy AI models and training data
COPY --chown=terrafusion:terrafusion data/models/benchmark-guard ./data/models/benchmark-guard/
COPY --chown=terrafusion:terrafusion data/training/benchmark-guard ./data/training/benchmark-guard/
COPY --chown=terrafusion:terrafusion data/benchmarks ./data/benchmarks/

# Install additional dependencies specific to Benchmark Guard
RUN npm install --no-save \
    deep-object-diff@latest \
    jsonata@latest \
    js-yaml@latest \
    uuid@latest \
    p-limit@latest

# Set environment variables
ENV AGENT_ID=benchmark-guard
ENV AGENT_NAME="Benchmark Guard"
ENV AGENT_DESCRIPTION="Monitors and enforces benchmark compliance for cost calculations"
ENV AGENT_VERSION=${BUILD_VERSION:-1.0.0}
ENV MODEL_PATH=/app/data/models/benchmark-guard
ENV TRAINING_DATA_PATH=/app/data/training/benchmark-guard
ENV BENCHMARKS_PATH=/app/data/benchmarks

# Expose metrics endpoint
EXPOSE 9090

# Override the default command
CMD ["node", "server/agents/benchmark-guard/index.js"]

# Add agent-specific labels
LABEL org.opencontainers.image.title="TerraFusion Benchmark Guard Agent" \
      org.opencontainers.image.description="Benchmark Guard agent for TerraFusion platform" \
      terrafusion.agent.id="benchmark-guard" \
      terrafusion.agent.type="quality-enforcement" \
      terrafusion.agent.priority="high" \
      terrafusion.agent.capabilities="benchmark-validation,regression-detection,quality-gates,compliance-checking"