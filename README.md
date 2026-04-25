# Kite

Kite is a prototype multi-currency wallet backend built for the Grey full-stack take-home.

It supports:
- user signup and signin
- wallet account bootstrap for `USD`, `GBP`, `EUR`, `NGN`, and `KES`
- simulated inbound deposits
- FX quote creation from a real rate provider
- FX conversion execution with spread
- simulated payouts for `NGN` and `KES`
- unified transaction history across deposits, conversions, and payouts

## Stack

- `NestJS`
- `Prisma`
- `PostgreSQL`
- `pnpm` workspace monorepo

The original requirement suggested `Go + React` while giving room to choose a different stack if justified, so I chose `NestJS` for the backend because it let me move quickly while still keeping clear module boundaries, DTO validation, auth guards, and transaction-oriented service code. The focus of the submission remains correctness around money movement and data modeling rather than framework choice.

## Run

Requirements:
- Node.js 22+
- `pnpm`
- PostgreSQL

1. Install dependencies

```bash
pnpm install
```

2. Configure the API environment

Create `apps/api/.env` from `apps/api/.env.example` and set:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kite?schema=public"
JWT_SECRET="a-random-secret"
FX_API_BASE_URL="https://api.frankfurter.dev/v1 or v2"
FX_RATE_CACHE_TTL_MS="300000"
```

3. Run Prisma migration

```bash
cd apps/api
pnpm prisma:migrate --name init_payments_schema
pnpm prisma:generate
```

4. Start the API

```bash
cd /Users/veri5ied/Desktop/kite
pnpm --filter api start:dev
```

The API runs on `http://localhost:3000`.

Swagger UI is available at:

`http://localhost:3000/api/docs`

Raw OpenAPI JSON is also available at:

`http://localhost:3000/api/openapi.json`

## Deployment Note

- the backend is deployed on Render's free tier, so the API may sleep after inactivity and take a few seconds to wake up on the first request
- the frontend is deployed on Vercel

## Core Endpoints

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`

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
- `deposits`
- `conversions`
- `payouts`
- `transactions`
- `prisma`

The ledger is the source of truth for money movement. Deposits, conversions, and payouts create ledger transactions plus append-only ledger entries. Balances are derived from ledger entries instead of being updated directly as mutable totals.

Important implementation choices:
- money is stored in minor units as `BigInt`
- deposits use an `Idempotency-Key` header to prevent duplicate credits
- FX quotes are time-bound and stored separately from executed conversions
- a spread is applied between provider rate and quoted/booked rate
- payout failures generate reversal ledger entries instead of mutating old entries

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

## FX Rates

Rates are pulled from Frankfurter:
- base URL: `https://api.frankfurter.dev`
- pair endpoint: `/v2/rate/{base}/{quote}`

Rates are cached in memory with a TTL so the upstream provider is not hit for every quote.

Quotes store:
- source and target currency
- source and target amounts
- base rate
- quoted rate
- spread in basis points
- expiry time

## Payout Simulation

Payouts are intentionally simulated rather than sent to a real rail.

Lifecycle:
- `PENDING`
- `PROCESSING`
- `SUCCESSFUL` or `FAILED`

Current simulation rule:
- recipient account numbers ending in `0` fail
- failed payouts are reversed by posting a new `PAYOUT_REVERSAL` ledger transaction

## Trade-Offs

- No Docker setup yet. The requirement preferred a one-command run, but I prioritized implementing the core money flows first.
- FX rate caching is in-memory. In production, this should move to Redis which is way better or another shared cache.
- JWT auth is used for simplicity. In production, I would add refresh token rotation, device/session tracking, and revocation.
- Balance reads are derived from ledger entries directly. That is correct but not the most efficient approach at large scale (according to my discussion with my former CTO at Oystrfinance, had to ask him series of questions and some guidance cause I needed to work on this).
- API documentation is exposed through Nest Swagger UI for quick manual testing and schema inspection.

## What I Would Improve Next

- add a cached balance projection table for faster reads
- add a background job runner instead of in-process payout timers
- add refresh tokens and stronger auth session management
- add structured logs and request IDs
- add a dedicated transaction detail endpoint

## Scaling Notes (Thanks to my former CTO who I had a great discussion with on this)

At 1M users, the first things likely to break are:
- deriving balances from raw ledger entry scans on every request
- in-memory FX cache across multiple API instances
- in-process payout lifecycle timers

The first scaling moves would be:
- introduce balance projections/materialized account balances
- move FX cache into Redis
- move payout orchestration into a real job queue
- add stronger indexing and read models for transaction history
- split hot write paths from read-heavy history queries
