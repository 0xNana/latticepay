# Deployment & Runbook

## Prerequisites
- Node.js >= 20
- npm >= 9
- Sepolia RPC URL
- Sepolia ETH for connected wallets that claim faucet tokens

## Install
```bash
npm install
npm --prefix contracts install
```

## Contracts
```bash
npm run contracts:compile
npm run contracts:test
```

Deploy contracts from `contracts` and capture:
- underlying token address
- confidential payroll token (ERC-7984 wrapper) address
- payroll executor address

## Frontend Env (`frontend/.env.local`)
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
