FROM oven/bun:1-alpine AS base

# --- Dependencies (full, for build) ---
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# --- Production deps (for ws-server runtime) ---
FROM base AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build:next
RUN bun run build:ws

# --- Runner ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV WS_PORT=3001
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/dist-server ./dist-server
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Overlay production node_modules with full transitive trees for ws-server deps.
# Standalone output already provides Next's own deps; this adds fastify/socket.io/etc
# with all their transitive dependencies (which selective COPY cannot do because
# bun installs them hoisted to the flat node_modules root).
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs
EXPOSE 3000 3001

CMD ["node", "scripts/start-prod.js"]
