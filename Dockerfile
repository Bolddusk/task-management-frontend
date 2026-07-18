# ---- Task Management Frontend (React + Vite) ----

# Stage 1: build the static bundle
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies (cached unless lockfile changes)
COPY package.json package-lock.json ./
RUN npm ci

# Vite reads VITE_* at build time, so the API URL is baked into the bundle.
# Override with --build-arg VITE_API_BASE_URL=... at build time.
ARG VITE_API_BASE_URL=https://task-msx-api.malgary.com/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
