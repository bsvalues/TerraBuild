# TerraFusion AI Agent Base Dockerfile
# This is the base image for all AI Agents

# ---- Base Node Stage ----
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production
ENV AGENT_PORT=4000

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    python3 \
    python3-pip \
    build-essential \
    git \
    procps \
    tzdata \
    tini \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip3 install --no-cache-dir \
    numpy \
    pandas \
    scikit-learn \
    psycopg2-binary

# ---- Dependencies Stage ----
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --omit=dev && \
    # Install additional agent dependencies
    npm install --no-save \
    @anthropic-ai/sdk@latest \
    openai@latest \
    langchain@latest \
    @tensorflow/tfjs-node@latest \
    uuid@latest \
    pino@latest \
    pino-pretty@latest

# ---- Security Stage ----
FROM dependencies AS security
# Create non-root user
RUN groupadd -r terrafusion && \
    useradd -r -g terrafusion -G audio,video terrafusion && \
    mkdir -p /home/terrafusion && \
    mkdir -p /app/temp /app/storage /app/config && \
    chown -R terrafusion:terrafusion /home/terrafusion && \
    chown -R terrafusion:terrafusion /app

# ---- Health Check Stage ----
FROM security AS healthcheck
# Add health check script
COPY --chown=terrafusion:terrafusion scripts/agent-healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/agent-healthcheck.sh

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD /usr/local/bin/agent-healthcheck.sh || exit 1

# ---- Final Stage ----
FROM healthcheck AS final

# Copy agent framework code
COPY --chown=terrafusion:terrafusion server/mcp/agents/baseAgent.ts ./server/mcp/agents/
COPY --chown=terrafusion:terrafusion server/mcp/agents/customAgentBase.ts ./server/mcp/agents/
COPY --chown=terrafusion:terrafusion server/mcp/agents/eventBus.ts ./server/mcp/agents/
COPY --chown=terrafusion:terrafusion server/mcp/schemas ./server/mcp/schemas/
COPY --chown=terrafusion:terrafusion shared/schemas ./shared/schemas/

# Copy common utils
COPY --chown=terrafusion:terrafusion server/utils ./server/utils/
COPY --chown=terrafusion:terrafusion server/types ./server/types/

# Create required directories with proper permissions
RUN mkdir -p /app/logs /app/data /app/temp /app/models && \
    chown -R terrafusion:terrafusion /app

# Set working directory
WORKDIR /app

# Switch to non-root user
USER terrafusion

# Expose port
EXPOSE ${AGENT_PORT}

# Use tini as entrypoint to handle signals properly
ENTRYPOINT ["/usr/bin/tini", "--"]

# Set default command
CMD ["node", "server/agents/index.js"]

# Build args and labels
ARG BUILD_DATE
ARG VCS_REF
ARG BUILD_VERSION

# Add standardized labels
LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.authors="TerraFusion Team" \
      org.opencontainers.image.url="https://github.com/bentoncounty/terrafusion" \
      org.opencontainers.image.source="https://github.com/bentoncounty/terrafusion" \
      org.opencontainers.image.version="${BUILD_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Benton County" \
      org.opencontainers.image.title="TerraFusion Agent Base" \
      org.opencontainers.image.description="Base image for TerraFusion AI Agents" \
      org.opencontainers.image.licenses="Proprietary"