# Dockerfile for Express Backend
# Using host node_modules to avoid slow Docker networking on WSL

FROM node:20-alpine

# Install dependencies needed for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files and host node_modules
COPY package.json ./
COPY node_modules/ ./node_modules/

# Copy application code
COPY server/ ./server/
COPY src/config/ ./src/config/
COPY docs/ ./docs/
COPY prisma.config.ts ./

# Generate Prisma Client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate --schema=server/prisma/schema.prisma

EXPOSE 3002

CMD ["node", "server/index.js"]
