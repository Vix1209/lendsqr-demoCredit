FROM node:lts-bookworm AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

# Production stage
FROM node:lts-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations
COPY --from=builder /app/src/database/knex.migration.ts ./src/database/knex.migration.ts

EXPOSE 5000

CMD ["sh", "-c", "pnpm run migrate:latest && pnpm run start:prod"]