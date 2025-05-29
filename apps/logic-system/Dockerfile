FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm

COPY tsconfig.json ../tsconfig.json
COPY apps/logic-system ./

RUN pnpm install
RUN pnpm build

EXPOSE 3003
ENTRYPOINT ["pnpm", "start"] 