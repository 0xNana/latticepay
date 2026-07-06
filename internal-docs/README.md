# Lattice Pay — Confidential Payroll

Lattice Pay is a confidential payroll dApp built on **Zama FHEVM** + **ERC-7984 confidential token**.
It supports a traditional payroll workflow (ISO 20022 `pain.001` in, `pain.002` out) with **confidential onchain settlement**.

## MVP Execution Flow
1. Connect a browser wallet on Sepolia.
2. Upload ISO 20022 `pain.001` payroll instruction file
3. Validate + review payments in **Payroll** tab
4. Authorize `PayrollExecutor` as token operator when needed
5. Encrypt payroll amounts in the browser
6. Execute payroll as a single confidential batch
7. Generate `pain.002` status report for download
8. View transaction on Sepolia explorer
9. Let recipients reveal only their own confidential balance from the portal

## Key Docs
- `internal-docs/submission.md`
- `internal-docs/srs.md`
- `internal-docs/iso20022.md`
- `internal-docs/state-machine.md`
- `internal-docs/contract-spec.md`
- `internal-docs/security.md`
- `internal-docs/codex-agent-guide.md`
- `internal-docs/deps.md`
- `internal-docs/video-script.md`
- `internal-docs/xpost.md`
- `internal-docs/article.md`
