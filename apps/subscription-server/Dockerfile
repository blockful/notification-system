FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/subscription-server/package.json apps/subscription-server/
COPY tsconfig.json ./

RUN pnpm install

COPY apps/subscription-server apps/subscription-server

RUN pnpm --filter @notification-system/subscription-server build

EXPOSE 3001

WORKDIR /app/apps/subscription-server
ENTRYPOINT ["pnpm", "start"] 