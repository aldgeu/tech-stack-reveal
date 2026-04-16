# Multi-stage build: compile the static SPA, then serve via Nginx.
# Used by docker-compose.yml. See HOSTING.md for details.

FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci

# Build the static bundle
COPY . .
RUN npx vite build --config vite.config.static.ts

# Runtime image: tiny Nginx serving /dist with SPA fallback
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
