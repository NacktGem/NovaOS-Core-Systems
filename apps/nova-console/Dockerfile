# build stage
FROM node:22 AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps apps
COPY packages packages
RUN corepack enable && pnpm -v && pnpm -w install --frozen-lockfile && pnpm --filter nova-console build

# runtime stage
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/nova-console/.next/standalone ./
COPY --from=builder /app/apps/nova-console/public ./public
COPY --from=builder /app/apps/nova-console/.next/static ./.next/static
EXPOSE 3001
CMD ["node", "server.js"]
