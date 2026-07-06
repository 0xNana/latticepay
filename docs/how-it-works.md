# How It Works

## 1. Onboard
- User connects a standard browser wallet.
- Wallet session is reused across draft/confirmation/execution flow.

## 2. Fund
- User opens Faucet panel and requests test payroll tokens.
- Connected wallet mints a test ERC-20 stable token, approves the ERC-7984 wrapper, and wraps into confidential payroll tokens.
- The faucet is a demo bridge from a familiar stablecoin treasury model into ERC-7984; payroll execution after funding uses confidential token transfers.

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
- Connected wallet submits the payroll transaction.
- Note for MVP: larger payroll batches carry encrypted handle + input proof payloads. Current operational cap is 15 payments per run.

## 7. Confirm & Report
- UI watches transaction confirmation.
- Processing/History views show run status and tx hash.
- `pain.002` report generation/summary path is available from completed runs.

## 8. Decrypt Balance
- User requests decrypt from the connected wallet.
- Browser relayer flow asks the wallet for an EIP-712 user-decrypt signature and returns the user balance.
