# TerraFusion Curve Trainer Agent Dockerfile
# Extends the base agent image with specific code for the Curve Trainer agent

ARG BASE_IMAGE=terrafusion-agent-base:latest

# ---- Base Stage ----
FROM ${BASE_IMAGE} AS base

# Copy Curve Trainer specific files
COPY --chown=terrafusion:terrafusion server/mcp/agents/curveAgent.ts ./server/mcp/agents/
COPY --chown=terrafusion:terrafusion server/agents/curve-trainer ./server/agents/curve-trainer/
COPY --chown=terrafusion:terrafusion server/services/curve-analysis ./server/services/curve-analysis/

# Copy AI models and training data
COPY --chown=terrafusion:terrafusion data/models/curve-trainer ./data/models/curve-trainer/
COPY --chown=terrafusion:terrafusion data/training/curve-trainer ./data/training/curve-trainer/
COPY --chown=terrafusion:terrafusion data/curve-libraries ./data/curve-libraries/

# Install additional dependencies including Python for numerical processing
USER root
RUN apk add --no-cache python3 python3-dev py3-pip build-base && \
    pip3 install --no-cache-dir numpy scipy scikit-learn pandas tensorflow && \
    npm install --no-save \
    mathjs@latest \
    ml-regression@latest \
    ml-matrix@latest \
    brain.js@latest \
    node-tensorflow@latest \
    numeric@latest && \
    chown -R terrafusion:terrafusion /app

# Return to non-root user
USER terrafusion

# Set environment variables
ENV AGENT_ID=curve-trainer
ENV AGENT_NAME="Curve Trainer"
ENV AGENT_DESCRIPTION="Trains and optimizes cost curve models using historical data"
ENV AGENT_VERSION=${BUILD_VERSION:-1.0.0}
ENV MODEL_PATH=/app/data/models/curve-trainer
ENV TRAINING_DATA_PATH=/app/data/training/curve-trainer
ENV CURVE_LIBRARIES_PATH=/app/data/curve-libraries
ENV PYTHONPATH=/app/server/agents/curve-trainer/python
ENV TF_CPP_MIN_LOG_LEVEL=2

# Create directory for Python scripts
RUN mkdir -p /app/server/agents/curve-trainer/python
COPY --chown=terrafusion:terrafusion server/agents/curve-trainer/python /app/server/agents/curve-trainer/python/

# Expose metrics endpoint
EXPOSE 9090

# Override the default command
CMD ["node", "server/agents/curve-trainer/index.js"]

# Add agent-specific labels
LABEL org.opencontainers.image.title="TerraFusion Curve Trainer Agent" \
      org.opencontainers.image.description="Curve Trainer agent for TerraFusion platform" \
      terrafusion.agent.id="curve-trainer" \
      terrafusion.agent.type="machine-learning" \
      terrafusion.agent.priority="medium" \
      terrafusion.agent.capabilities="curve-fitting,regression-analysis,model-training,predictive-analytics"