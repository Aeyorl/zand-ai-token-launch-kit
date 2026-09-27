# syntax=docker/dockerfile:1
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev && npm install -g tsx

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY src ./src

# Create volume mount point for persistent data
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3001

CMD ["tsx", "server/index.ts"]
