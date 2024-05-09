# Use the official Node.js 20 image.
# https://hub.docker.com/_/node
FROM node:20-alpine

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Create and change to the app directory.
WORKDIR /app

# Install dependencies based on the preferred package manager.
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Install PM2.
RUN npm install -g pm2

# Install production dependencies.
RUN npm ci

# Set the user to non-root and create necessary directories.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Change the ownership of the app directory to the nodejs user.
RUN chown nextjs:nodejs /app

# Copy local code to the container image.
COPY . .

# Set environment variables for production.
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000

# Expose the port the app runs on.
EXPOSE 3000

# Build the application for production.
RUN npm run build

# Run the web service on container startup.
CMD ["pm2-runtime", "start", "npm", "--", "start"]
