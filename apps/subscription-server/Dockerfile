FROM node:20-slim

RUN npm install -g pnpm
WORKDIR /app

COPY . .

RUN pnpm install
RUN pnpm build

EXPOSE 3001
ENTRYPOINT ["pnpm", "subscription-server", "start:with-migrate"] 