FROM node:20-slim

RUN npm install -g pnpm
WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY src ./src

RUN pnpm install
RUN pnpm build

EXPOSE 3002
ENTRYPOINT ["pnpm", "start"] 