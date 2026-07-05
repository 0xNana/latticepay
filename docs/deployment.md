# Deployment & Runbook

## Prerequisites
- Node.js >= 20
- npm >= 9
- Sepolia RPC URL
- Sepolia ETH for connected wallets that claim faucet tokens

## Install
```bash
npm install
npm --workspace apps/web install
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

## Frontend Env (`apps/web/.env.local`)
Required:
- `VITE_APP_URL`
- `VITE_SEPOLIA_RPC_URL`
- `VITE_PAYROLL_TOKEN_ADDRESS`
- `VITE_PAYROLL_EXECUTOR_ADDRESS`
- `VITE_PAYROLL_UNDERLYING_ADDRESS`

Run:
```bash
npm run dev
```
