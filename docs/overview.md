# Lattice Pay - Confidential Payroll on Zama

## Objective
Lattice Pay is a confidential payroll dApp that lets companies run payroll onchain without exposing individual salary amounts in public transaction data.

It uses:
- Zama FHEVM primitives for encrypted inputs/decryption flows
- OpenZeppelin ERC-7984 confidential token standard
- Standard browser wallet connection for signing and submission
- ISO 20022 `pain.001` input and `pain.002` reporting model

## What Works Today
- Upload and parse payroll batches from `pain.001` XML.
- Validate payroll before execution (address validity, duplicates, totals, non-zero amounts).
- Encrypt each payroll amount client-side through relayer SDK flow.
- Execute payroll in a single batch via `PayrollExecutor`.
- Read processing/completion states and download status artifacts.
- Decrypt confidential balances with wallet-signed user decrypt.

## Scope of This Submission
- Network: Sepolia testnet.
- Token model: ERC-7984 wrapper over a mock underlying stable token, showing how an existing ERC-20 treasury can enter the confidential payroll flow.
- Batch guard: max 100 payments per run onchain.
- Focus: confidential payroll execution UX with real onchain settlement behavior.
