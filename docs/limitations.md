# Known Limitations

## Current Constraints
- Decryption uses wallet-signed user decrypt in the browser.
- Faucet claims are connected-wallet transactions, so users need Sepolia ETH and mint access on the test underlying token.
- Sepolia testnet only for this submission.
- Contract batch size is capped at 100 payments, but current practical execution size is lower when FHE input proofs are large.
- For MVP UX, sample flows are focused on smaller payroll batches (5-15 payments).

## Security/Trust Notes
- Relayer availability is required for encryption/decryption.

## Planned Improvements
- Harden policy/rate-limiting for production-grade abuse controls.
- Expand ISO 20022 coverage beyond MVP subset.
- Add dynamic chunking for large payrolls (split one payroll file into multiple onchain runs) based on measured proof payload size and transaction limits.
