# 3-Minute Video Script - Zama Builder Track

## Recording Rules
- Real-person pitch only. Do not use AI voice or AI-generated presenter video.
- Keep the screen recording on the deployed website and Sepolia transaction evidence.
- Say "Zama Protocol", "FHEVM", and "ERC-7984" clearly.
- Do not claim mainnet deployment unless the demo is actually on mainnet. Current target: Sepolia.
- Keep the ERC-20 faucet explanation short: it is a funding bridge, not the product.

## Core Pitch
Lattice Pay is a confidential payroll dApp built with Zama Protocol. It uses FHE to keep salary amounts encrypted while still giving finance teams a real payroll workflow: ISO 20022 import, validation, confidential ERC-7984 batch settlement, payment receipts, and recipient-only balance reveal.

ERC-7984 is the private token rail. Lattice Pay is the payroll application layer around it.

## Timed Script

### 0:00 - 0:20 | Problem
Hi, I am presenting Lattice Pay for the Zama Developer Program Builder Track.

Payroll is one of the clearest real-world privacy problems for onchain finance. Public blockchains are transparent by default, but salaries should not be public data. Teams still need settlement, receipts, and auditability, but they should not broadcast individual compensation.

### 0:20 - 0:40 | Product
Lattice Pay solves this with a confidential payroll workflow built on Zama Protocol, FHEVM, and OpenZeppelin ERC-7984 confidential tokens.

The dApp has both a frontend and smart contract codebase. The deployed demo runs on Sepolia and lets an operator import payroll, validate it, execute confidential payments, and let recipients decrypt only their own balance.

### 0:40 - 1:00 | Funding Bridge
First, I connect a Sepolia wallet and fund the demo payroll token.

You will see an ERC-20 faucet step here on purpose. Most treasury stablecoin flows today start as ERC-20. For the demo, we mint a mock ERC-20 stable token, approve the ERC-7984 wrapper, and wrap into the confidential payroll token.

After that bridge, payroll execution itself uses ERC-7984 confidential transfers.

### 1:00 - 1:30 | Import And Validate
Next, I open Payroll and import an ISO 20022 `pain.001` file.

Lattice Pay parses the payroll file into recipients, names, amounts, and payment IDs. Before anything goes onchain, the app validates address format, duplicate recipients, positive amounts, totals, and the current demo batch limit.

This is the first reason Lattice Pay matters beyond the token standard: payroll teams need a workflow, not only a transfer primitive.

### 1:30 - 2:10 | FHE Execution
Now I continue to execution.

Before the batch runs, the payroll wallet authorizes `PayrollExecutor` as an ERC-7984 operator. Then the frontend encrypts every salary amount in the browser using the Zama relayer flow.

The transaction submits a payroll run to Sepolia with encrypted amounts and input proofs. The smart contract executes the batch through ERC-7984 confidential transfers, emits per-payment results, and prevents replay with run IDs and nonces.

At no point do plaintext salary amounts need to be stored onchain.

### 2:10 - 2:35 | Receipts And Audit Trail
After confirmation, Lattice Pay shows the transaction hash and payment results.

The operator can download a `pain.002`-style payment status receipt. This matters because real payroll is not just a token transfer. Finance teams need import files, status reports, and an audit trail they can reconcile.

### 2:35 - 2:55 | Recipient Privacy
Finally, I open the recipient portal.

A recipient connects their wallet and signs a user-decrypt request. The portal reveals only that wallet's confidential payroll balance. Other recipients' balances remain private.

This is the FHE value: onchain settlement with selective disclosure.

### 2:55 - 3:00 | Close
Lattice Pay shows how Zama Protocol can power a real confidential finance use case: payroll that is private, auditable, and usable from a deployed web app.

## Must Show On Screen
- Deployed website URL.
- Wallet connected on Sepolia.
- Faucet bridge: ERC-20 mint/approve/wrap into ERC-7984.
- `pain.001` sample upload.
- Validation checks.
- `Run Payroll` flow.
- Sepolia transaction hash or explorer page.
- `pain.002` receipt download.
- Recipient portal decrypt flow.

## One-Sentence Backup
Lattice Pay turns ERC-7984 confidential transfers into a complete payroll workflow: file import, validation, encrypted batch execution, receipts, and recipient-only balance reveal.
