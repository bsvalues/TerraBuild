# TerraFusion Backend Dockerfile
# Multi-stage build for optimized production container

# ---- Build Stage ----
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Build arguments
ARG NODE_ENV=production
ARG BUILD_VERSION=dev

# Set build-time environment variables
ENV NODE_ENV=${NODE_ENV}
ENV BUILD_VERSION=${BUILD_VERSION}

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:server

# Prune dev dependencies
RUN npm prune --production

# ---- Production Stage ----
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Build arguments
ARG NODE_ENV=production
ARG BUILD_VERSION=dev

# Set runtime environment variables
ENV NODE_ENV=${NODE_ENV}
ENV PORT=5000
ENV BUILD_VERSION=${BUILD_VERSION}
ENV ENABLE_MCP=true

# Install system dependencies
RUN apk --no-cache add curl bash ca-certificates \
    && update-ca-certificates

# Create non-root user
RUN addgroup -S terrafusion && adduser -S -G terrafusion terrafusion

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/uploads /app/data \
    && chown -R terrafusion:terrafusion /app

# Copy built app from build stage
COPY --from=build --chown=terrafusion:terrafusion /app/node_modules ./node_modules
COPY --from=build --chown=terrafusion:terrafusion /app/dist ./dist
COPY --from=build --chown=terrafusion:terrafusion /app/shared ./shared
COPY --from=build --chown=terrafusion:terrafusion /app/server ./server
COPY --from=build --chown=terrafusion:terrafusion /app/data ./data
COPY --from=build --chown=terrafusion:terrafusion /app/package.json ./package.json

# Copy initialization and healthcheck scripts
COPY --chown=terrafusion:terrafusion terrafusion-devops-kit/docker/scripts/init-server.sh ./scripts/init-server.sh
COPY --chown=terrafusion:terrafusion terrafusion-devops-kit/docker/scripts/healthcheck.js ./scripts/healthcheck.js
RUN chmod +x ./scripts/init-server.sh ./scripts/healthcheck.js

# Switch to non-root user
USER terrafusion

# Expose port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=3 \
    CMD ["node", "scripts/healthcheck.js"]

# Start the server
CMD ["./scripts/init-server.sh"]

# Add labels for better tracking
LABEL org.opencontainers.image.title="TerraFusion Backend"
LABEL org.opencontainers.image.description="Backend server for TerraFusion platform"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.vendor="Benton County"
LABEL org.opencontainers.image.url="https://terrafusion.example.com"
LABEL com.terrafusion.component="backend"
LABEL com.terrafusion.mcp.enabled="true"