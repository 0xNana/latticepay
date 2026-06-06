# How It Works

## 1. Onboard
- User connects a standard browser wallet.
- Wallet session is reused across draft/confirmation/execution flow.

## 2. Fund
- User opens Faucet panel and requests test payroll tokens.
- Backend faucet mints underlying token, approves wrapper, wraps into confidential token for the target account.

## 3. Upload & Validate
- User uploads a `pain.001` file.
- Frontend parses a practical payroll subset and builds a draft.
- Validation checks:
  - payments present
  - valid recipient addresses
  - no duplicate recipients
  - positive amounts
  - declared total consistency

## 4. Authorize Payout Permission
- Before execution, user sets the `PayrollExecutor` as operator via ERC-7984 `setOperator`.
- This is signed by the payroll account itself.

## 5. Encrypt Payroll Inputs
- For each payment amount, frontend creates encrypted input + input proof.
- Encrypted handles and proofs are assembled into the batch payload.

## 6. Execute Payroll
- `executePayroll(runId, token, from, recipients, encryptedAmounts, inputProofs, validUntil, nonce)` is submitted.
- In `wallet_direct`, the connected wallet submits the payroll transaction.
- In backend mode, the server-side observer signer can submit after operator precheck.
- Note for MVP: larger payroll batches carry encrypted handle + input proof payloads. Current operational cap is 15 payments per run.

## 7. Confirm & Report
- UI watches transaction confirmation.
- Processing/History views show run status and tx hash.
- `pain.002` report generation/summary path is available from completed runs.

## 8. Decrypt Balance
- User can enable observer and request decrypt from UI.
- Backend decrypt endpoint signs relayer EIP-712 payload using observer signer and returns decrypted balance.
