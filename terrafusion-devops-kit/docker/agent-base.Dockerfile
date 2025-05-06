# TerraFusion Agent Base Dockerfile
# This is the base image for all AI agents, containing common dependencies and code

# ---- Build Stage ----
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Build arguments
ARG BUILD_VERSION=dev

# Environment variables
ENV NODE_ENV=production
ENV BUILD_VERSION=${BUILD_VERSION}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production --no-audit

# Copy source code (only the necessary files)
COPY tsconfig.json ./
COPY shared/ ./shared/
COPY server/mcp/framework/ ./server/mcp/framework/
COPY server/services/common/ ./server/services/common/
COPY server/lib/ ./server/lib/
COPY data/common/ ./data/common/
COPY scripts/agent-runner.js ./scripts/

# Build the TypeScript code
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Build arguments
ARG BUILD_VERSION=dev

# Environment variables
ENV NODE_ENV=production
ENV BUILD_VERSION=${BUILD_VERSION}

# Install system dependencies
RUN apk --no-cache add curl bash ca-certificates \
    && update-ca-certificates \
    && apk --no-cache add --virtual builds-deps build-base python3

# Create non-root user
RUN addgroup -S terrafusion && adduser -S -G terrafusion terrafusion

# Copy built files from build stage
COPY --from=build --chown=terrafusion:terrafusion /app/node_modules ./node_modules
COPY --from=build --chown=terrafusion:terrafusion /app/dist ./dist
COPY --from=build --chown=terrafusion:terrafusion /app/shared ./shared
COPY --from=build --chown=terrafusion:terrafusion /app/server/mcp/framework ./server/mcp/framework
COPY --from=build --chown=terrafusion:terrafusion /app/server/services/common ./server/services/common
COPY --from=build --chown=terrafusion:terrafusion /app/server/lib ./server/lib
COPY --from=build --chown=terrafusion:terrafusion /app/data/common ./data/common
COPY --from=build --chown=terrafusion:terrafusion /app/scripts/agent-runner.js ./scripts/

# Create necessary directories
RUN mkdir -p /app/data/models /app/data/training /app/logs \
    && chown -R terrafusion:terrafusion /app/data /app/logs

# Setup healthcheck
COPY --chown=terrafusion:terrafusion terrafusion-devops-kit/docker/healthcheck.js /app/healthcheck.js
RUN chmod +x /app/healthcheck.js

# Set permissions
RUN chown -R terrafusion:terrafusion /app

# Switch to non-root user
USER terrafusion

# Expose ports
EXPOSE 4000
EXPOSE 9090

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD node /app/healthcheck.js

# Default command (will be overridden by specific agent images)
CMD ["node", "server/lib/agent-runner.js"]

# Add labels for better tracking
LABEL org.opencontainers.image.title="TerraFusion Agent Base"
LABEL org.opencontainers.image.description="Base image for TerraFusion AI agents"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.vendor="Benton County"
LABEL com.terrafusion.component="agent-base"
LABEL com.terrafusion.mcp.version="1.0"