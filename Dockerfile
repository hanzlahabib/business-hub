# Dockerfile for Vite Frontend
# Stage 1: Build the frontend using host node_modules
FROM node:20-alpine AS build

WORKDIR /app

# Copy package and host node_modules (flat layout from npm install)
COPY package.json ./
COPY node_modules/ ./node_modules/

# Rebuild all native bindings for Alpine/musl (host has glibc variants)
RUN npm rebuild 2>/dev/null; \
    npm install --no-save --force \
    @rollup/rollup-linux-x64-musl \
    lightningcss-linux-x64-musl \
    @tailwindcss/oxide-linux-x64-musl \
    2>/dev/null || true

COPY . .
RUN npx vite build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config and build output
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
