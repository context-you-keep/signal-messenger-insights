# Dockerfile for Signal Archive Viewer - Next.js Monolith
# Single service architecture following Vercel pattern
# Using Debian slim - matches host environment (Debian 12 Bookworm)

FROM node:22-slim

WORKDIR /app

# Install build dependencies for native modules (SQLCipher)
# @journeyapps/sqlcipher requires libssl1.1 (OpenSSL 1.1) which is from Debian 11
# Add bullseye repository temporarily to install libssl1.1
RUN echo "deb http://deb.debian.org/debian bullseye main" > /etc/apt/sources.list.d/bullseye.list \
    && apt-get update \
    && apt-get install -y \
        python3 \
        make \
        g++ \
        libsqlite3-dev \
        libssl-dev \
        libssl1.1 \
    && rm /etc/apt/sources.list.d/bullseye.list \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies (use legacy-peer-deps due to React 19 compatibility)
RUN npm ci --legacy-peer-deps

# Copy frontend source
COPY frontend/ ./

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start Next.js in production mode
CMD ["npm", "start"]
