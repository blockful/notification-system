FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/logic-system/package.json apps/logic-system/
COPY tsconfig.json ./

RUN pnpm install

COPY apps/logic-system apps/logic-system

RUN pnpm --filter @notification-system/logic-system build

EXPOSE 3003

WORKDIR /app/apps/logic-system
ENTRYPOINT ["pnpm", "start"] 