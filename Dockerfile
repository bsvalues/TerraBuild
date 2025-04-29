# Multi-stage build for TerraBuild application

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build application
COPY . .
RUN npm run build

# Final stage
FROM node:20-alpine

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create a non-root user to run the application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/node_modules && chown -R appuser:appgroup /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build --chown=appuser:appgroup /app/dist /app/dist
COPY --from=build --chown=appuser:appgroup /app/server /app/server
COPY --from=build --chown=appuser:appgroup /app/shared /app/shared

# Copy additional files needed at runtime
COPY --chown=appuser:appgroup ./scripts/start-container.sh /app/start-container.sh
RUN chmod +x /app/start-container.sh

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Expose port
EXPOSE 5000

# Start application
CMD ["/app/start-container.sh"]