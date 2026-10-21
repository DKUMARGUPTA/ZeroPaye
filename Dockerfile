# ZeroPaye — Dockerfile
# Production-ready Docker image for self-hosting ZeroPaye

FROM oven/bun:1.3.14 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY . .

# Generate Prisma Client
RUN bunx prisma generate

# Build
RUN bun run build

# Production image
FROM oven/bun:1.3.14-slim AS production
WORKDIR /app

# Copy built app
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package.json ./package.json

# Environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/zeropaye/health || exit 1

# Start
CMD ["bun", "run", "start"]
