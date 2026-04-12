FROM oven/bun:1-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

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

# ws-server runtime deps (standalone tracing doesn't see src-server/)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/fastify ./node_modules/fastify
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@fastify ./node_modules/@fastify
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io ./node_modules/socket.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io ./node_modules/engine.io
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-adapter ./node_modules/socket.io-adapter
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/socket.io-parser ./node_modules/socket.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/engine.io-parser ./node_modules/engine.io-parser
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/ws ./node_modules/ws
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/nanoid ./node_modules/nanoid
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pino ./node_modules/pino
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pino-std-serializers ./node_modules/pino-std-serializers
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/gray-matter ./node_modules/gray-matter
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/concurrently ./node_modules/concurrently

USER nextjs
EXPOSE 3000 3001

CMD ["node", "node_modules/concurrently/dist/bin/concurrently.js", "--kill-others-on-fail", \
     "node server.js", \
     "node dist-server/src-server/ws-server.js"]
