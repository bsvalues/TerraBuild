# TerraFusion AI Agent Dockerfile
# Lightweight container for running specific AI tasks

FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY docker/agent/requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY shared ./shared
COPY server/ai ./server/ai
COPY server/utils ./server/utils
COPY server/types ./server/types
COPY docker/agent/entrypoint.sh ./

# Make entrypoint script executable
RUN chmod +x entrypoint.sh

# Create non-root user
RUN groupadd -r terrafusion && \
    useradd -r -g terrafusion terrafusion && \
    chown -R terrafusion:terrafusion /app

# Switch to non-root user
USER terrafusion

# Expose port for health checks
EXPOSE 8080

# Set entry point
ENTRYPOINT ["./entrypoint.sh"]