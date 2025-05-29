FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY tsconfig.json ../tsconfig.json
COPY apps/consumers ./

RUN pnpm install
RUN pnpm build

EXPOSE 3000
ENTRYPOINT ["pnpm", "start"] 