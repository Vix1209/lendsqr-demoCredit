# Lendsqr Wallet Service (MVP)

This project implements the wallet-service MVP for the Lendsqr backend engineering assessment using NodeJS, TypeScript, KnexJS, and MySQL.

## Assessment Requirements (Summary)

- Users can create an account
- Users can fund wallets
- Users can transfer funds to other users
- Users can withdraw funds
- Users on Lendsqr Adjutor Karma blacklist cannot be onboarded
- Provide a design document and ER diagram
- Provide unit tests
- Provide deployment URL and documentation

## Architecture Overview

- Framework: NestJS
- Database Access: KnexJS with MySQL
- Modules: users, wallets, transactions, transfers, funding, withdrawals, blacklist
- Database Connection: ConfigModule + Knex provider
- Migrations: Knex CLI using a shared config in `src/db/knex.migration.ts`

## ER Diagram - https://www.mermaidonline.live/

```mermaid
erDiagram
  USERS ||--|| WALLETS : owns
  USERS ||--o{ BLACKLIST_CHECKS : checked

  WALLETS ||--o{ TRANSACTIONS : posts
  WALLETS ||--o{ TRANSFERS : sends
  WALLETS ||--o{ TRANSFERS : receives
  WALLETS ||--o{ FUNDINGS : funds
  WALLETS ||--o{ WITHDRAWALS : withdraws

  TRANSACTIONS ||--o{ TRANSFERS : relates
  TRANSACTIONS ||--o{ FUNDINGS : relates
  TRANSACTIONS ||--o{ WITHDRAWALS : relates

  USERS {
    string id PK
    string email
    string first_name
    string last_name
    string phone_number
    string status
    datetime created_at
    datetime updated_at
  }

  WALLETS {
    string id PK
    string user_id FK
    decimal balance
    string currency
    string status
    datetime created_at
    datetime updated_at
  }

  TRANSACTIONS {
    string id PK
    string wallet_id FK
    string type
    string direction
    decimal amount
    string status
    string reference
    json metadata
    datetime created_at
    datetime updated_at
  }

  TRANSFERS {
    string id PK
    string sender_wallet_id FK
    string receiver_wallet_id FK
    decimal amount
    string status
    string reference
    string transaction_id FK
    datetime created_at
    datetime updated_at
  }

  FUNDINGS {
    string id PK
    string wallet_id FK
    decimal amount
    string status
    string reference
    string provider
    string transaction_id FK
    datetime created_at
    datetime updated_at
  }

  WITHDRAWALS {
    string id PK
    string wallet_id FK
    decimal amount
    string status
    string reference
    string destination
    string transaction_id FK
    datetime created_at
    datetime updated_at
  }

  BLACKLIST_CHECKS {
    string id PK
    string user_id FK
    string provider
    string status
    json response_payload
    datetime created_at
    datetime updated_at
  }

```

## Project Setup

```bash
pnpm install
```

## Environment Variables

Create a `.env` file at the project root:

```
DATABASE_URL=mysql://user:password@localhost:3306/lendsqr_wallet
DB_POOL_MIN=2
DB_POOL_MAX=10
```

## Database Migrations

```bash
pnpm migrate:make <name>
pnpm migrate:latest
pnpm migrate:rollback
```

## Run the API

```bash
pnpm run start:dev
```

## Testing

```bash
pnpm test
pnpm test:e2e
pnpm test:cov
```

## Deployment

Deploy to a public URL using the required format:

```
https://<candidate-name>-lendsqr-be-test.<cloud-platform-domain>
```

## Submission Checklist

- Public GitHub repository link
- Deployed API URL
- Design/documentation page with rationale
- Loom video (≤ 3 minutes, face visible)
- Google Form submission
- Email confirmation to careers@lendsqr.com
