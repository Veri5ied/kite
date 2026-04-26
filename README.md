# Kite

Kite is a prototype multi-currency wallet built for the Grey full-stack assessment.

It supports:
- email/password authentication
- wallet balances in `USD`, `GBP`, `EUR`, `NGN`, and `KES`
- simulated inbound deposits
- FX quote creation from a live rate provider with spread and expiry
- FX conversion execution between a user’s own balances
- simulated payouts for `NGN` and `KES`
- unified transaction history across deposits, conversions, and payouts
- an append-only double-entry ledger as the source of truth

## Hosted Links

- Frontend: `https://kite-web-iota.vercel.app`
- Backend: `https://kite-l6s2.onrender.com`
- Swagger: `https://kite-l6s2.onrender.com/api/docs` 
- Loom walkthrough: 

## Stack

- `NestJS`
- `React`
- `TanStack Query`
- `Prisma`
- `PostgreSQL`
- `pnpm` workspace monorepo

The requirement suggested `Go + React`, but also allowed a different stack if justified. I chose `NestJS + React` because it let me move quickly while still showing clear module boundaries, DTO validation, auth guards, transaction-heavy service logic, and a maintainable full-stack TypeScript workflow. The focus of the submission remains correctness around money movement and ledger modeling rather than framework choice.

## Run

Requirements:
- Node.js 22+
- `pnpm`
- PostgreSQL

1. Install dependencies

```bash
pnpm install
```

2. Configure environment variables

Create `apps/api/.env` from `apps/api/.env.example`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kite?schema=public"
JWT_SECRET="a-random-secret"
FX_API_BASE_URL="https://api.frankfurter.dev"
FX_RATE_CACHE_TTL_MS="300000"
```

Create `apps/web/.env` from `apps/web/.env.example`

```env
VITE_API_BASE_URL="http://localhost:3000/api"
```

3. Apply Prisma migrations

```bash
cd kite/apps/api
pnpm prisma:migrate --name init_payments_schema
pnpm prisma:generate
```

4. Start the app

```bash
cd kite
pnpm dev
```

This starts both:
- the API on `http://localhost:3000`
- the frontend on Vite’s local development server

If needed, they can be started separately:

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

Local API docs:
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

## Deployment Notes

- The frontend is deployed on Vercel.
- The backend is deployed on Render.
- Because the backend is on Render’s free tier, the first request after inactivity may take a few seconds while the service wakes up.
- Production migrations should be applied during deploy with:

```bash
pnpm --filter api exec prisma migrate deploy
```

## Core Endpoints

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`

Wallets:
- `GET /api/wallets/balances`

Deposits:
- `POST /api/deposits`

Conversions:
- `POST /api/conversions/quote`
- `POST /api/conversions/execute`

Payouts:
- `POST /api/payouts`
- `GET /api/payouts/:id`

Transactions:
- `GET /api/transactions`

## Architecture

The backend is organized by domain module:
- `auth`
- `wallets`
- `deposits`
- `conversions`
- `payouts`
- `transactions`
- `prisma`

The ledger is the source of truth for all money movement. Deposits, conversions, and payouts create `LedgerTransaction` records plus append-only `LedgerEntry` rows. Wallet balances are derived from ledger entries instead of being updated as mutable totals.

Key implementation choices:
- money is stored in minor units as `BigInt`
- deposits use an `Idempotency-Key` header to prevent duplicate credits
- FX quotes are stored separately from executed conversions
- quoted rate and booked rate are distinct from the upstream base rate
- payout failures are reversed by posting a new ledger transaction, not mutating prior entries
- wallet summaries derive balances from the ledger and compute a USD-equivalent total using cached FX rates

## Data Model

Main entities:
- `User`
- `Wallet`
- `LedgerAccount`
- `LedgerTransaction`
- `LedgerEntry`
- `Deposit`
- `FxQuote`
- `Conversion`
- `Payout`

High-level schema:

```mermaid
erDiagram
  User ||--|| Wallet : owns
  Wallet ||--o{ LedgerAccount : has
  User ||--o{ Deposit : makes
  User ||--o{ FxQuote : requests
  User ||--o{ Conversion : executes
  User ||--o{ Payout : creates
  User ||--o{ LedgerTransaction : triggers
  LedgerTransaction ||--o{ LedgerEntry : contains
  LedgerAccount ||--o{ LedgerEntry : receives
  Wallet ||--o{ Deposit : contains
  Wallet ||--o{ FxQuote : contains
  Wallet ||--o{ Conversion : contains
  Wallet ||--o{ Payout : contains
  FxQuote ||--|| Conversion : becomes
```

## Product Flows

### Auth

- Signup creates the user, wallet, and one user asset account per supported currency.
- Signin returns a bearer token.
- The frontend stores the access token in session storage and uses `/auth/me` to hydrate session state.

### Deposits

- Deposits are simulated inbound credits into a selected wallet currency.
- The request requires an `Idempotency-Key`.
- A successful deposit creates:
  - a `Deposit`
  - a `LedgerTransaction`
  - two `LedgerEntry` rows

### FX Quotes and Conversions

- Rates are pulled from Frankfurter.
- The app caches fetched rates in memory for a TTL instead of hitting the provider for every quote.
- Each quote stores:
  - source/target currency
  - source/target amount
  - base rate
  - quoted rate
  - spread in basis points
  - expiry
- Execution consumes the quote, posts the ledger movement, and records the booked conversion.

### Payouts

- Payouts are limited to `NGN` and `KES`.
- They move through:
  - `PENDING`
  - `PROCESSING`
  - `SUCCESSFUL` or `FAILED`
- Failed payouts create a compensating `PAYOUT_REVERSAL` ledger transaction.
- In the sandbox implementation, account numbers ending in `0` fail so reversal behavior can be demonstrated.

### Transaction History

- The transaction feed is unified across:
  - deposits
  - conversions
  - payouts
- It is returned reverse-chronologically from a single endpoint.

## FX Provider and Caching

Rates are fetched from Frankfurter:
- base URL: `https://api.frankfurter.dev`
- pair endpoint: `/v2/rate/{base}/{quote}`

Caching notes:
- rates are cached in-memory with a TTL
- this keeps quote creation from calling the upstream provider every time
- if FX lookup fails during wallet summary conversion, the app currently falls back to `0` for that currency’s USD-equivalent contribution rather than breaking the entire dashboard

## Testing

Current automated coverage focuses on the most important backend service behavior:
- deposit idempotency replay
- FX quote creation
- expired quote rejection
- payout reversal behavior
- unified transaction history ordering

The tests live in:
- `apps/api/src/deposits/deposits.service.spec.ts`
- `apps/api/src/conversions/conversions.service.spec.ts`
- `apps/api/src/payouts/payouts.service.spec.ts`
- `a`pps/api/src/transactions/transactions.service.spec.ts`

Run them with:

```bash
pnpm --filter api test
```

## Trade-Offs

- FX rate caching is in-memory. In production, this should move to Redis or another shared cache.
- Payout lifecycle simulation uses in-process timers. In production, this should be handled by a real job queue/worker.
- Wallet balances are derived from ledger entries on demand. This is correct and auditable, but not the most efficient read path at scale.
- JWT auth is used for simplicity. In production, I would add refresh token rotation, device/session tracking, and explicit revocation.
- The frontend currently relies on session storage for the access token because it keeps the take-home flow simple and self-contained.

## Scaling to 1M Users

The first pressure points would likely be:
- deriving balances from raw ledger entry scans on every request
- in-memory FX cache across multiple API instances
- in-process payout timers
- increasingly expensive transaction-history reads

The first scaling steps I would take:
- introduce projected/materialized account balances for fast reads
- move FX caching into Redis
- move payout orchestration into a queue-backed worker system
- add stronger indexing and read models for transaction history
- separate write-heavy ledger flows from read-heavy dashboard/history access patterns

## What I Would Improve Next

- add a dedicated transaction detail endpoint
- add stronger observability with request IDs and structured logs
- move wallet summary FX conversion into a more explicit status model so the UI can distinguish “FX unavailable” from “actual zero”
- improve conversion UX around stale/expired quotes

## Loom
