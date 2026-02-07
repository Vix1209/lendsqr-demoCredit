# Demo Credit Wallet Service (MVP)

This service implements a wallet and transaction-intent workflow for the Demo Credit Wallet backend assessment using NestJS, KnexJS, and MySQL. The core model is a transaction_intent that is created for funding, transfer, and withdrawal requests, then executed to generate ledger entries and update balances.

## Tech Stack

- Framework: NestJS
- Database: MySQL
- Query Layer: KnexJS
- Validation and Docs: class-validator + Swagger decorators

## Project Navigation

- Entry point: src/main.ts
- Root module wiring: src/app.module.ts
- Database and migration config: src/database/knex.module.ts, src/database/knex.migration.ts
- Tables and schema builders: src/tables/\*.table.ts
- Feature modules: src/resources/\*
  - users: onboarding, listing, and retrieval
  - balances: read-only balance views
  - funding, transfers, withdrawals: create transaction intents
  - transaction: execute a pending intent and settle it
  - ledger-entries: ledger history and filters
  - audit-logs: system event history
  - execution-attempts: list provider execution attempts by intent
  - idempotency-keys: generate keys for safe retries
  - blacklist: Adjutor karma lookup used during onboarding

## Request Lifecycle (High-Level)

1. HTTP request enters a controller in src/resources/\*.
2. DTO validation runs before service logic.
3. If the route is idempotent, an idempotency key is injected and guarded.
4. Service logic performs reads and writes through DatabaseService (Knex).
5. Writes happen inside a transaction for multi-step operations.
6. Audit logs are written for intent creation, ledger creation, and balance changes.
7. Response returns a normalized summary payload.

## Core Flows

### User Onboarding

1. POST /users validates email and basic profile data.
2. Adjutor karma lookup is performed using the provided BVN.
3. A blacklist_checks row is recorded for the user.
4. If clear, a wallet and balance record are created in the same transaction.
5. If blacklisted, the user is created but onboarding is blocked.

### Funding Intent Creation

1. POST /funding validates amount and wallet ownership.
2. A transaction_intent is created with type=funding and direction=credit.
3. A fundings record is created with status=pending.
4. An audit log is written for the new intent.

### Transfer Intent Creation

1. POST /transfers validates sender/receiver wallet IDs and currency match.
2. A transaction_intent is created with type=transfer and direction=internal.
3. A transfers record is created with status=pending.
4. An audit log is written with sender and receiver metadata.

### Withdrawal Intent Creation

1. POST /withdrawals validates amount and wallet eligibility.
2. Destination defaults to wallet account_details when omitted.
3. A transaction_intent is created with type=withdrawal and direction=debit.
4. A withdrawals record is created with status=pending.
5. An audit log is written for the new intent.

### Intent Execution

1. POST /transaction/execute validates the execution type and intent ID.
2. The intent is locked into processing status.
3. Funding, transfer, or withdrawal execution runs in a single DB transaction.
4. Ledger entries are inserted for debit/credit effects.
5. Balances are updated using the ledger entry values.
6. The intent and request table (fundings/transfers/withdrawals) are marked settled.
7. Audit logs are written for ledger creation, balance updates, and settlement.

### Ledger and Audit Visibility

- GET /ledger-entries supports filters by wallet, user, or transaction intent.
- GET /audit-logs supports filters by entity type, action, and actor metadata.
- GET /execution-attempts/:txn_id lists attempts for a transaction intent.

### Idempotency

- GET /idempotency-keys/new provides a unique idempotency key.
- Idempotent routes store request hashes and responses in idempotency_keys.
- Duplicate requests return the first response without reprocessing.

## API Routes

- POST /users
- GET /users
- GET /users/:id
- GET /balances/:userId
- POST /funding
- GET /funding
- POST /transfers
- GET /transfers
- POST /withdrawals
- GET /withdrawals
- POST /transaction/execute
- GET /ledger-entries
- GET /ledger-entries/:ledger_id
- GET /audit-logs
- GET /audit-logs/:id
- GET /execution-attempts/:txn_id
- GET /idempotency-keys/new

## ER Diagram - https://www.mermaidonline.live/

```mermaid
erDiagram
  USERS ||--o{ WALLETS : owns
  USERS ||--o{ BLACKLIST_CHECKS : checked
  WALLETS ||--|| BALANCES : balance
  WALLETS ||--o{ TRANSACTION_INTENTS : creates
  WALLETS ||--o{ FUNDINGS : funds
  WALLETS ||--o{ WITHDRAWALS : withdraws
  WALLETS ||--o{ TRANSFERS : sends
  WALLETS ||--o{ TRANSFERS : receives
  TRANSACTION_INTENTS ||--o{ LEDGER_ENTRIES : posts
  TRANSACTION_INTENTS ||--o{ FUNDINGS : relates
  TRANSACTION_INTENTS ||--o{ TRANSFERS : relates
  TRANSACTION_INTENTS ||--o{ WITHDRAWALS : relates
  TRANSACTION_INTENTS ||--o{ EXECUTION_ATTEMPTS : attempts

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
    string currency
    json account_details
    string status
    datetime created_at
    datetime updated_at
  }

  BALANCES {
    string id PK
    string wallet_id FK
    decimal available_balance
    decimal pending_balance
    datetime created_at
    datetime updated_at
  }

  TRANSACTION_INTENTS {
    string id PK
    string wallet_id FK
    string type
    string direction
    decimal amount
    string status
    string reference
    string idempotency_key
    json metadata
    datetime created_at
    datetime updated_at
  }

  LEDGER_ENTRIES {
    string id PK
    string wallet_id FK
    string transaction_intent_id FK
    string entry_type
    decimal amount
    decimal balance_before
    decimal balance_after
    datetime created_at
  }

  FUNDINGS {
    string id PK
    string wallet_id FK
    decimal amount
    string status
    string reference
    string provider
    string transaction_intent_id FK
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
    string transaction_intent_id FK
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
    string transaction_intent_id FK
    datetime created_at
    datetime updated_at
  }

  EXECUTION_ATTEMPTS {
    string id PK
    string transaction_intent_id FK
    string status
    int attempt_number
    string provider
    string provider_reference
    json response_payload
    datetime attempted_at
  }

  BLACKLIST_CHECKS {
    string id PK
    string user_id FK
    string provider
    string status
    json response_payload
    datetime created_at
  }

  IDEMPOTENCY_KEYS {
    string id PK
    string idempotency_key
    string request_hash
    string response_payload
    string status
    datetime created_at
    datetime updated_at
  }

  AUDIT_LOGS {
    string id PK
    string entity_type
    string entity_id
    string action
    string actor_type
    string actor_id
    json metadata
    string remark
    datetime created_at
  }
```

## Project Setup

```bash
pnpm install
```

## Docker Setup (Recommended)

1. Create a .env file at the project root using .env.example as a template.
2. Start the stack:

```bash
docker compose up --build
```

3. The API will be available at http://localhost:5000 once the mysql service is healthy.
4. Migrations run automatically on container start via pnpm run migrate:latest.

## Environment Variables

Create a .env file at the project root. Use .env.example as a template:

```
NODE_ENV=development
PORT=5000
DATABASE_URL=mysql://user:password@localhost:3306/lendsqr_wallet
DB_POOL_MIN=2
DB_POOL_MAX=10
ADJUTOR_API_KEY=sk_live_your-lendsqr-api-key
ADJUTOR_BASE_URL=https://adjutor.lendsqr.com/v2
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
