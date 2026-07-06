# Architecture

## Components
- `frontend` (frontend): upload/validate payroll file, encrypt amounts, collect user signatures, submit payroll runs, display status.
- `contracts` (smart contracts): `PayrollExecutor` + confidential token wrapper + test/deploy scripts.

## Contract Layer
- `PayrollExecutor`:
  - Validates batch shape and expiry.
  - Enforces replay/nonce checks.
  - Enforces `MAX_BATCH_SIZE = 100`.
  - Calls ERC-7984 `confidentialTransferFrom(from, to, encryptedAmount, inputProof)` per payment.
  - Emits run and per-payment events.
- Confidential token:
  - ERC-7984-compatible wrapper contract.
  - Must run with Zama coprocessor config (`ZamaEthereumConfig` inheritance path in contracts).

## Runtime Modes (current)
- Execution path: connected-wallet direct submission.
- Decrypt path: wallet-signed user decrypt in the browser.
- Faucet path: connected-wallet direct mint/approve/wrap.
- Large-batch note: although onchain max is 100, practical batch size depends on encrypted proof payload size and transaction limits (current MVP operational cap: 15).

## Trust Boundaries
- Employer signs payroll actions from the connected wallet.
- Relayer is required for encryption/decryption operations.
