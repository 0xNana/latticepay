# Zama Builder Track Submission

## Project
Lattice Pay is a confidential payroll dApp for teams that need onchain settlement without exposing individual compensation.

## Demo Surface
- Frontend: Vite React app in `apps/web`.
- Contracts: Sepolia deployment of `ConfidentialPayrollToken` and `PayrollExecutor`.
- Workflow: import ISO 20022 `pain.001`, validate recipients, encrypt amounts with Zama FHEVM, execute ERC-7984 confidential transfers, export `pain.002`, and let recipients decrypt only their own balance.

## Builder Track Compliance
- Functioning dApp demo using Zama Protocol: Lattice Pay confidential payroll.
- Real-world FHE use case: private salary amounts with onchain settlement and selective recipient reveal.
- Smart contract codebase: `packages/contracts`.
- Frontend codebase: `apps/web`.
- Deployed website: `<paste-url>`.
- Deployment network: Sepolia.
- 3-minute real-person video pitch: use `internal-docs/video-script.md`.
- X thread or article: use `internal-docs/xpost.md` or `internal-docs/article.md`.
- Submission deadline from program brief: July 7, 23:59 AOE.

## 3-Minute Video Outline
1. Problem, 20 seconds: payroll is sensitive, but public ledgers expose transaction amounts by default.
2. Product, 20 seconds: show Lattice Pay as a deployed Sepolia dApp with frontend and smart contracts.
3. Funding bridge, 20 seconds: explain ERC-20 faucet -> ERC-7984 wrapper as a demo bridge from existing treasury flows.
4. Import and validation, 30 seconds: upload sample `pain.001`, show recipients, totals, and checks.
5. FHE execution, 40 seconds: authorize executor, encrypt amounts in browser, submit Sepolia transaction, show execution log.
6. Audit trail, 25 seconds: open completed run, show tx link and `pain.002` receipt export.
7. Recipient privacy, 20 seconds: open portal, connect recipient wallet, sign decrypt request, reveal only that wallet's confidential balance.
8. Close, 5 seconds: Lattice Pay makes payroll private, auditable, and usable with Zama Protocol.

## X Thread Draft
1. Introducing Lattice Pay: confidential onchain payroll powered by Zama FHEVM.
2. Payroll is one of the clearest real-world privacy problems in crypto. Teams need settlement, receipts, and auditability without broadcasting every salary.
3. Lattice Pay imports ISO 20022 `pain.001` payroll files, validates recipients, encrypts amounts in the browser, and executes confidential ERC-7984 transfers on Sepolia.
4. The smart contract layer uses Zama FHEVM and OpenZeppelin Confidential Contracts so payroll amounts stay encrypted while settlement still happens onchain.
5. The frontend gives operators a practical workflow: import, review, encrypt, execute, and export a `pain.002` receipt.
6. Recipients get a portal where they can decrypt only their own confidential balance with a wallet-signed request.
7. This is not a privacy-themed mockup. It includes a smart contract codebase, frontend codebase, deployed demo flow, encrypted inputs, and real Sepolia transaction submission.
8. Built for the Zama Developer Program Builder Track.

## Verification Commands
```bash
npm run contracts:test
npm --workspace apps/web run build
```

## Demo Checklist
- Wallet has Sepolia ETH.
- `apps/web/.env.local` contains deployed Sepolia addresses and RPC URL.
- Use a 5, 10, or 15 recipient sample for the live run.
- Claim wrapped payroll tokens before executing if the operator balance is empty.
- Keep the browser console closed during recording unless showing technical proof logs intentionally.
