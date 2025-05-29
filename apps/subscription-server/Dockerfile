FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY tsconfig.json ../tsconfig.json
COPY apps/subscription-server ./

RUN pnpm install
RUN pnpm build

EXPOSE 3001
ENTRYPOINT ["pnpm", "start"] 