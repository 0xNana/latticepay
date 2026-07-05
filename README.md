# Lattice Pay — Confidential Payroll

Lattice Pay is a confidential onchain payroll app built with Zama FHEVM, ERC-7984, and standard browser wallets.

It supports a practical payroll workflow:
- ingest ISO 20022 `pain.001`
- execute confidential payroll onchain
- export `pain.002` status receipts

## Why Lattice Pay
- Payroll data should not be publicly readable onchain.
- Lattice Pay keeps salary amounts confidential while preserving settlement and audit trails.

## Monorepo Structure
- `apps/web` — frontend (Vite + React)
- `packages/contracts` — Solidity contracts and tests
- `docs` — public docs

## Quick Start
```bash
npm install
npm --workspace apps/web run dev
```

Frontend runs on `5173` by default.

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
- Execution: connected wallet direct
- Faucet: connected wallet direct

## Current MVP Constraints
- Operational batch limit: **15 payments/run** (current stable range: 5/10/15).
- Contract-level hard cap remains `MAX_BATCH_SIZE = 100`.
- Decryption uses wallet-signed user decrypt in the browser.

## Deployment
- Web target: Vercel
- Deployment runbook: `docs/deployment.md`

## Public Documentation
- `docs/overview.md`
- `docs/architecture.md`
- `docs/how-it-works.md`
- `docs/deployment.md`
- `docs/limitations.md`
- `docs/contributing.md`

## Submission Materials
- `internal-docs/submission.md`

## License
- Root project: ISC (see root `package.json`)
- Contracts package: MIT (`packages/contracts/LICENSE`)
