# -------- Base builder image --------
FROM node:22 AS base
WORKDIR /app
RUN corepack enable

# -------- Dependencies stage --------
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages packages
# Install all workspace deps (no dev pruning yet)
RUN pnpm -v && pnpm -w install --frozen-lockfile --prod=false

# -------- Build stage --------
FROM deps AS builder
COPY apps apps
# Build workspace first to ensure all dependencies are available
RUN pnpm --filter novaos install --prod=false \
  && pnpm --filter novaos build

# -------- Production deps stage --------
FROM base AS prod-deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages packages
RUN pnpm -w install --frozen-lockfile --prod --ignore-scripts

# -------- Runtime stage --------
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production node_modules first (better layer caching)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/packages ./packages

# Copy built app
COPY --from=builder /app/apps/novaos/.next/standalone ./
COPY --from=builder /app/apps/novaos/.next/static ./.next/static

EXPOSE 3001
CMD ["node", "server.js"]