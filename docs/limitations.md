# Known Limitations

## Current Constraints
- Decryption is currently stable in observer mode.
- Faucet is currently backend-driven for reliability.
- Sepolia testnet only for this submission.
- Contract batch size is capped at 100 payments, but current practical execution size is lower when FHE input proofs are large.
- For MVP UX, sample flows are focused on smaller payroll batches (5-15 payments).

## Security/Trust Notes
- Observer signer is a trusted backend key in current decrypt/observer flows.
- Relayer availability is required for encryption/decryption.

## Planned Improvements
- Reduce observer dependency as wallet-native decrypt flows stabilize.
- Harden policy/rate-limiting for production-grade abuse controls.
- Expand ISO 20022 coverage beyond MVP subset.
- Add dynamic chunking for large payrolls (split one payroll file into multiple onchain runs) based on measured proof payload size and transaction limits.
