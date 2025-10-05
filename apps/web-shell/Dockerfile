FROM node:22-alpine
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./
COPY packages ./packages/
COPY apps/shared ./apps/shared/
COPY apps/web-shell ./apps/web-shell/
RUN pnpm install
WORKDIR /app/apps/web-shell
RUN pnpm build
EXPOSE 3002
CMD ["pnpm", "start", "-p", "3002"]
