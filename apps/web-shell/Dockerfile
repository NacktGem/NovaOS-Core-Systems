# build stage
FROM node:22 AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps apps
COPY packages packages
RUN corepack enable && pnpm -v && pnpm -w install --frozen-lockfile && pnpm --filter web-shell build

# runtime stage
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/web-shell/.next/standalone ./
COPY --from=builder /app/apps/web-shell/public ./public
COPY --from=builder /app/apps/web-shell/.next/static ./.next/static
EXPOSE 3002
CMD ["node", "server.js"]
