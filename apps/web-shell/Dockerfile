# Next.js 15 production Dockerfile for Web-Shell# Next.js 15 production Dockerfile for Web-Shell

FROM node:22-alpineFROM node:22-alpine



WORKDIR /appWORKDIR /app



# Install pnpm# Install pnpm

RUN corepack enable pnpmRUN corepack enable pnpm



# Copy package files first for better caching# Copy package files first for better caching

COPY package.json pnpm-lock.yaml* ./COPY package.json pnpm-lock.yaml* ./

COPY pnpm-workspace.yaml ./COPY pnpm-workspace.yaml ./



# Copy packages directory (shared dependencies)# Copy packages directory (shared dependencies)

COPY packages ./packagesCOPY packages ./packages



# Copy the Web-Shell app# Copy the Web-Shell app

COPY apps/web-shell ./apps/web-shellCOPY apps/web-shell ./apps/web-shell



# Install dependencies# Install dependencies

RUN pnpm installRUN pnpm install



# Build the application# Build the application

WORKDIR /app/apps/web-shellWORKDIR /app/apps/web-shell

RUN pnpm buildRUN pnpm build



# Expose port# Expose port

EXPOSE 3002EXPOSE 3002



# Start Next.js in production mode# Start Next.js in production mode

CMD ["pnpm", "start", "-p", "3002"]CMD ["pnpm", "start", "-p", "3002"]
