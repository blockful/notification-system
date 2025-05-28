FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/dispatcher/package.json apps/dispatcher/
COPY tsconfig.json ./

RUN pnpm install

COPY apps/dispatcher apps/dispatcher

RUN pnpm --filter @notification-system/dispatcher build

EXPOSE 3002

WORKDIR /app/apps/dispatcher
ENTRYPOINT ["pnpm", "start"] 