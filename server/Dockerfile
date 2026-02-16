# Dockerfile for Express Backend
# Using a lightweight Node image

FROM node:20-alpine AS base

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (including dev deps for Prisma generation)
RUN npm install -g pnpm && pnpm install --config.fetch-timeout=300000

# Copy application code
COPY server/ ./server/
COPY src/config/ ./src/config/
COPY docs/ ./docs/
COPY prisma.config.ts ./

# Generate Prisma Client (dummy DATABASE_URL needed at build time for prisma.config.ts)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" pnpm prisma generate --schema=server/prisma/schema.prisma

EXPOSE 3002

CMD ["node", "server/index.js"]
