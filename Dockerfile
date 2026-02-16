# Dockerfile for Vite Frontend
# Stage 1: Build the frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first for layer caching
COPY package.json pnpm-lock.yaml* ./

# Install pnpm and dependencies with extended network timeout
RUN npm install -g pnpm && \
    pnpm install --shamefully-hoist --config.fetch-timeout=300000

COPY . .
RUN pnpm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config and build output
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
