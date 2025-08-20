# build stage
FROM node:22 AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps apps
COPY packages packages
RUN corepack enable && pnpm -v && pnpm -w install --frozen-lockfile && pnpm --filter gypsy-cove build

# runtime stage
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/gypsy-cove/.next/standalone ./
COPY --from=builder /app/apps/gypsy-cove/public ./public
COPY --from=builder /app/apps/gypsy-cove/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
