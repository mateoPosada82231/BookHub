# ============================
# Multi-stage build for Next.js
# ============================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Stage 2: Build
FROM node:20-alpine AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://localhost:8082

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Run
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
