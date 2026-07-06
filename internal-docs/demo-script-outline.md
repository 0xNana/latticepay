# 3-Minute Demo Script Outline

Use `internal-docs/video-script.md` as the source of truth. This outline is only the screen-flow checklist.

## 0:00 - 0:20 | Problem
- Voiceover:
  - Payroll needs settlement and auditability, but public salary data is not acceptable.
  - Lattice Pay uses Zama Protocol to keep payroll amounts confidential.
- Screen:
  - Deployed Lattice Pay website.
  - Dashboard headline.

## 0:20 - 0:40 | Product
- Voiceover:
  - Lattice Pay is a confidential payroll dApp with smart contracts, frontend, and Sepolia deployment.
  - It uses FHEVM and ERC-7984 confidential tokens.
- Screen:
  - Navigation: Dashboard, Payroll, Audit, Portal.

## 0:40 - 1:00 | Funding Bridge
- Voiceover:
  - The faucet starts with ERC-20 because most treasury stablecoin flows do.
  - The demo wraps ERC-20 value into ERC-7984, then payroll runs on the confidential token rail.
- Screen:
  - Connect wallet.
  - Faucet claim.
  - Mention mint -> approve -> wrap.

## 1:00 - 1:30 | Upload + Validation
- Voiceover:
  - Payroll starts from ISO 20022 `pain.001`.
  - Lattice Pay parses and validates recipients, duplicates, positive amounts, totals, and batch size.
- Screen:
  - Download/upload 10 or 15 recipient sample.
  - Draft page with validation checks.

## 1:30 - 2:10 | Confidential Execution
- Voiceover:
  - The payer authorizes `PayrollExecutor` as an ERC-7984 operator.
  - Amounts are encrypted client-side and submitted with input proofs.
  - The Sepolia transaction executes confidential ERC-7984 transfers.
- Screen:
  - Confirm screen -> `Run Payroll`.
  - Processing console:
    - payout permission confirmed
    - confidential inputs encrypted
    - transaction submitted
    - confirmed in block
  - Show tx hash.

## 2:10 - 2:35 | Results + Receipt
- Voiceover:
  - Lattice Pay records per-payment outcomes and generates a `pain.002` status receipt.
- Screen:
  - Completed run page.
  - Tx link.
  - Download payroll receipt.

## 2:35 - 2:55 | Recipient Privacy
- Voiceover:
  - A recipient signs a user-decrypt request and reveals only their own confidential balance.
- Screen:
  - Portal decrypt action for a recipient wallet.

## 2:55 - 3:00 | Close
- Voiceover:
  - Lattice Pay brings private, auditable payroll to onchain finance with Zama Protocol.
- Screen:
  - Final dashboard or completed run.

## Demo Rules
- Real-person pitch only. No AI voice or AI-generated presenter.
- Use 5/10/15 payment samples only.
- Keep one continuous take with visible deployed URL and tx hash.
- Prepare one fallback tx hash screenshot in case explorer lag occurs.
