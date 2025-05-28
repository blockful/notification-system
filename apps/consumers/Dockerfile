FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/consumers/package.json apps/consumers/
COPY tsconfig.json ./

RUN pnpm install

COPY apps/consumers apps/consumers

RUN pnpm --filter @notification-system/consumer build

EXPOSE 3000

WORKDIR /app/apps/consumers
ENTRYPOINT ["pnpm", "start"] 