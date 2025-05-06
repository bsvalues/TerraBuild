# TerraFusion Application Dockerfile
# Multi-stage build for optimized production container

# ---- Base Node Stage ----
FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# ---- Dependencies Stage ----
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Build Stage ----
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Final Stage ----
FROM base AS final

# Install production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/package*.json ./
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/migrations ./migrations

# Add PostgreSQL client for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r terrafusion && \
    useradd -r -g terrafusion terrafusion && \
    mkdir -p /home/terrafusion && \
    chown -R terrafusion:terrafusion /home/terrafusion

# Set permissions
RUN chown -R terrafusion:terrafusion /app

# Switch to non-root user
USER terrafusion

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Expose port
EXPOSE ${PORT}

# Start application
CMD ["node", "server/index.js"]