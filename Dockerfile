FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl su-exec

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
# Dummy DATABASE_URL for build — Next.js prerendering needs a valid URL format
# The real connection is provided at runtime via .env
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets (recipe images will be mounted as volume)
COPY --from=builder /app/public ./public

# Ensure the recipe images directory is writable by nextjs user
RUN mkdir -p /app/public/images/recipes && chown -R nextjs:nodejs /app/public/images/recipes

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + migrations + all node_modules for runtime migrate deploy
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY scripts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
