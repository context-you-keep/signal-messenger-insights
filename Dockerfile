# Multi-stage Dockerfile for Signal Archive Viewer
# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY frontend/package.json frontend/pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN pnpm run build

# Stage 2: Python backend with built frontend
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for SQLCipher and keychain access
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libsqlcipher-dev \
    libsecret-tools \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/pyproject.toml ./backend/

# Install Python dependencies
RUN pip install --no-cache-dir -e ./backend

# Copy backend application
COPY backend/ ./backend/

# Copy built frontend from previous stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create directory for temporary files
RUN mkdir -p /tmp/signal_archive && chmod 1777 /tmp/signal_archive

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Set working directory to backend for proper imports
WORKDIR /app/backend

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
