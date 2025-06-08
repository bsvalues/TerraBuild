# TerraFusion Production Dockerfile
# Multi-stage build for optimized production deployment

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy client source and build
COPY client/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ postgresql-client

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./server/
COPY shared/ ./shared/
COPY *.ts *.js ./

# Build TypeScript
RUN npm run build

# Stage 3: Production runtime
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash \
    tzdata \
    dumb-init

# Create non-root user
RUN addgroup -g 1001 -S terrafusion && \
    adduser -S terrafusion -u 1001

# Set working directory
WORKDIR /app

# Copy built backend
COPY --from=backend-builder --chown=terrafusion:terrafusion /app/node_modules ./node_modules
COPY --from=backend-builder --chown=terrafusion:terrafusion /app/dist ./dist
COPY --from=backend-builder --chown=terrafusion:terrafusion /app/server ./server
COPY --from=backend-builder --chown=terrafusion:terrafusion /app/shared ./shared
COPY --from=backend-builder --chown=terrafusion:terrafusion /app/package.json ./

# Copy built frontend
COPY --from=frontend-builder --chown=terrafusion:terrafusion /app/client/dist ./client/dist

# Copy additional production files
COPY --chown=terrafusion:terrafusion deployment/docker/entrypoint.sh ./entrypoint.sh
COPY --chown=terrafusion:terrafusion deployment/docker/healthcheck.sh ./healthcheck.sh

# Make scripts executable
RUN chmod +x ./entrypoint.sh ./healthcheck.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD ./healthcheck.sh

# Expose port
EXPOSE 3000

# Switch to non-root user
USER terrafusion

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["./entrypoint.sh"]