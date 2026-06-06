# Deployment & Runbook

## Prerequisites
- Node.js >= 20
- npm >= 9
- Sepolia RPC URL
- Funded Sepolia accounts for observer/faucet

## Install
```bash
npm install
npm --workspace apps/web install
npm --workspace apps/api install
npm --prefix packages/contracts install
```

## Contracts
```bash
npm run contracts:compile
npm run contracts:test
```

Deploy contracts from `packages/contracts` and capture:
- underlying token address
- confidential payroll token (ERC-7984 wrapper) address
- payroll executor address

## Backend Env (`apps/api/.env.local`)
Required:
- `PAYROLL_EXECUTOR_ADDRESS`
- `PAYROLL_TOKEN_ADDRESS`
- `SEPOLIA_RPC_URL`
- `OBSERVER_PRIVATE_KEY`

Recommended:
- `FAUCET_MNEMONIC` (or `FAUCET_PRIVATE_KEY`)
- `CORS_ORIGIN` and/or `CORS_ORIGINS`
- `MAX_PAYMENT_COUNT=100`

Run:
```bash
npm --workspace apps/api run dev
```

## Frontend Env (`apps/web/.env.local`)
Required:
- `VITE_APP_URL`
- `VITE_API_BASE_URL`
- `VITE_SEPOLIA_RPC_URL`
- `VITE_PAYROLL_TOKEN_ADDRESS`
- `VITE_PAYROLL_EXECUTOR_ADDRESS`
- `VITE_PAYROLL_UNDERLYING_ADDRESS`
- `VITE_OBSERVER_ADDRESS`

Runtime mode flags:
- `VITE_EXECUTION_MODE=backend` (or `wallet_direct`)
- `VITE_DECRYPT_MODE=observer`
- `VITE_FAUCET_MODE=backend`

Run:
```bash
npm run dev
```

## CORS and Tunnels
If frontend/backend are on different origins (Cloudflare/ngrok/tailscale), update API CORS env to include the active frontend URL, then restart API.
