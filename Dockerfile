# syntax=docker/dockerfile:1.7

# ─── Stage 1: builder ───
FROM node:22-alpine AS builder
WORKDIR /repo
# Copy everything in one shot so workspace symlinks resolve correctly during
# `npm ci`. Multi-stage deps caching has been known to drop transitive files
# (e.g. semver/functions/*) with npm workspaces — single-stage installs are
# more reliable.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci --include=dev
RUN npm run build:studio

# ─── Stage 2: runner ───
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

# Standalone output already contains a minimal node_modules + server.js
COPY --from=builder --chown=nextjs:nodejs /repo/apps/studio/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/studio/.next/static ./apps/studio/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/studio/public ./apps/studio/public
# Ship the sites/ folder so the running container can resolve tenants out of
# the box. Edits at runtime get committed back to GitHub; the next rebuild
# bakes them into a fresh image.
COPY --from=builder --chown=nextjs:nodejs /repo/sites ./sites

USER nextjs
EXPOSE 3000

CMD ["node", "apps/studio/server.js"]
