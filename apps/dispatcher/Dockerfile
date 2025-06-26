FROM node:20-slim

RUN npm install -g pnpm
WORKDIR /app

COPY . .

RUN pnpm install
RUN pnpm build

ENTRYPOINT ["pnpm", "dispatcher", "start"]