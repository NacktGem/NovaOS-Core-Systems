# Next.js 15 production Dockerfile for NovaOS
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml ./

# Copy packages directory (shared dependencies)
COPY packages ./packages

# Copy the NovaOS app
COPY apps/novaos ./apps/novaos

# Install dependencies
RUN pnpm install

# Build the application
WORKDIR /app/apps/novaos
RUN pnpm build

# Expose port
EXPOSE 3001

# Start Next.js in production mode
CMD ["pnpm", "start", "-p", "3001"]
