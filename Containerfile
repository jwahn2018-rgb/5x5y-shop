# Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Production
FROM node:20-alpine
WORKDIR /app

# Copy backend
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ .

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./public

# Express serves static files from /public
ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "src/server.js"]

