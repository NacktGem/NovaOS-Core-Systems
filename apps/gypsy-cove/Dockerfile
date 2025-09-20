# Next.js 15 production Dockerfile for Gypsy-Cove
FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml* ./
COPY pnpm-workspace.yaml ./

# Copy packages directory (shared dependencies)
COPY packages ./packages

# Copy the Gypsy-Cove app
COPY apps/gypsy-cove ./apps/gypsy-cove

# Install dependencies
RUN pnpm install

# Build the application
WORKDIR /app/apps/gypsy-cove
RUN pnpm build

# Expose port
EXPOSE 3000

# Start Next.js in production mode
CMD ["pnpm", "start", "-p", "3000"]
