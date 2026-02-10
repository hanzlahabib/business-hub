# Dockerfile for Express Backend
# Using a lightweight Node image

FROM node:20-alpine AS base

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (including dev deps for Prisma generation)
RUN npm install -g pnpm && pnpm install

# Copy application code
COPY server/ ./server/
COPY src/config/ ./src/config/

# Generate Prisma Client
# Note: Path to schema may vary based on setup
RUN pnpm prisma generate --schema=server/prisma/schema.prisma

EXPOSE 3002

CMD ["node", "server/index.js"]
