FROM node:20-slim

RUN npm install -g pnpm
WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./
COPY knex.config.ts ./
COPY src ./src
COPY db ./db

RUN pnpm install
RUN pnpm build

EXPOSE 3001
CMD ["sh", "-c", "pnpm migrate && pnpm start"] 