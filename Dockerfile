FROM node:lts-bookworm

WORKDIR /app

RUN corepack enable

RUN pnpm config set store-dir /root/.pnpm-store

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 5000

CMD ["sh", "-c", "pnpm run migrate:latest && pnpm run start:dev"]
