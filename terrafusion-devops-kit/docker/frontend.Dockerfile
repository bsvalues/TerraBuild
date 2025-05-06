# TerraFusion Frontend Dockerfile
# Multi-stage build for optimized production container

# ---- Build Stage ----
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Set build arguments with defaults
ARG NODE_ENV=production
ARG API_URL=https://api.terrafusion.example.com
ARG VITE_APP_VERSION=latest

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV VITE_API_URL=${API_URL}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend application
RUN npm run build

# ---- Production Stage ----
FROM nginx:stable-alpine AS production

# Copy custom nginx config
COPY ./terrafusion-devops-kit/docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add security headers
RUN echo "add_header X-Frame-Options \"DENY\";" >> /etc/nginx/conf.d/security-headers.conf && \
    echo "add_header X-Content-Type-Options \"nosniff\";" >> /etc/nginx/conf.d/security-headers.conf && \
    echo "add_header X-XSS-Protection \"1; mode=block\";" >> /etc/nginx/conf.d/security-headers.conf && \
    echo "add_header Referrer-Policy \"strict-origin-when-cross-origin\";" >> /etc/nginx/conf.d/security-headers.conf && \
    echo "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' ${API_URL}\";" >> /etc/nginx/conf.d/security-headers.conf && \
    echo "include /etc/nginx/conf.d/security-headers.conf;" >> /etc/nginx/conf.d/default.conf

# Copy health check script
COPY ./terrafusion-devops-kit/docker/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

# Switch to non-root user
RUN addgroup -g 1000 -S nginx-user && \
    adduser -u 1000 -S nginx-user -G nginx-user && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid

USER nginx-user

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD /usr/local/bin/healthcheck.sh

# Command to run
CMD ["nginx", "-g", "daemon off;"]

# Add labels for better tracking
LABEL org.opencontainers.image.title="TerraFusion Frontend"
LABEL org.opencontainers.image.description="Frontend application for TerraFusion platform"
LABEL org.opencontainers.image.version="${VITE_APP_VERSION}"
LABEL org.opencontainers.image.vendor="Benton County"
LABEL org.opencontainers.image.url="https://terrafusion.example.com"
LABEL com.terrafusion.component="frontend"
LABEL com.terrafusion.api.url="${API_URL}"