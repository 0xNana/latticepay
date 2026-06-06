# cPay — Confidential Payroll

cPay is a confidential onchain payroll app built with Zama FHEVM, ERC-7984, and standard browser wallets.

It supports a practical payroll workflow:
- ingest ISO 20022 `pain.001`
- execute confidential payroll onchain
- export `pain.002` status receipts

## Why cPay
- Payroll data should not be publicly readable onchain.
- cPay keeps salary amounts confidential while preserving settlement and audit trails.

## Monorepo Structure
- `apps/web` — frontend (Vite + React)
- `apps/api` — backend API (faucet, decrypt, execute, health)
- `packages/contracts` — Solidity contracts and tests
- `docs` — public docs

## Quick Start
```bash
npm install
npm --workspace apps/web run dev
npm --workspace apps/api run dev
```

Frontend runs on `5173` by default.  
API runs on `8787` by default.

## Build & Test
```bash
npm run contracts:compile
npm run contracts:test
npm --workspace apps/web run build
```

## Contracts
```bash
npm run contracts:compile
npm run contracts:test
```

## Core Capabilities
- Upload payroll instructions via ISO 20022 `pain.001`.
- Validate payroll batches before execution.
- Encrypt payroll amounts before onchain submission.
- Execute payroll through ERC-7984 confidential transfers.
- Download local payroll receipt as `pain.002`.
- Decrypt confidential balances from the connected account.

## Runtime Modes (MVP)
- Execution: `backend` by default, `wallet_direct` for connected-wallet submission
- Decrypt: `observer`
- Faucet: `backend`

Configured via frontend env vars:
- `VITE_EXECUTION_MODE`
- `VITE_DECRYPT_MODE`
- `VITE_FAUCET_MODE`

## Current MVP Constraints
- Operational batch limit: **15 payments/run** (current stable range: 5/10/15).
- Contract-level hard cap remains `MAX_BATCH_SIZE = 100`.
- Decryption currently uses observer mode for stability.

## Deployment
- Web target: Vercel
- API target: Fly.io
- Deployment runbook: `docs/deployment.md`

## Public Documentation
- `docs/overview.md`
- `docs/architecture.md`
- `docs/how-it-works.md`
- `docs/deployment.md`
- `docs/limitations.md`
- `docs/contributing.md`

## License
- Root project: ISC (see root `package.json`)
- Contracts package: MIT (`packages/contracts/LICENSE`)
