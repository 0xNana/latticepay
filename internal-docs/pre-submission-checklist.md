# Pre-Submission Checklist

Legend:
- `[x]` verified now
- `[ ]` pending verification
- `(auto)` can be verified from code/config
- `(manual)` requires live run evidence/screenshots

## 1. End-to-End Functionality
- [ ] Upload `pain.001` file and parse payments successfully. (manual)
- [ ] Validate draft (no duplicates, valid addresses, positive amounts, consistent totals). (manual)
- [ ] Enable payout permission from payer account (`setOperator`) through UI. (manual)
- [ ] Execute payroll onchain from connected wallet and confirm transaction success. (manual)
- [ ] Verify per-payment outcomes from `PayrollPaymentProcessed` events. (manual)
- [ ] Confirm payer confidential balance decreases after successful run. (manual)
- [ ] Confirm recipient balances increase (decrypt for at least 2 recipients). (manual)

## 2. Confidentiality Controls
- [x] Salary amounts are encrypted before submission. (auto)
- [x] No plaintext salary amounts are exposed onchain. (auto)
- [ ] Decrypt path works for authorized users only. (manual)
- [x] Wallet-signed user-decrypt mode is documented. (auto)

## 3. Smart Contract Quality
- [ ] Contract compiles cleanly. (manual command)
- [ ] Unit tests pass (`PayrollExecutor` suite). (manual command)
- [x] Batch size guard enforced onchain (`MAX_BATCH_SIZE=100`). (auto)
- [x] Nonce, expiry, and input-proof checks enforced. (auto)

## 4. Frontend / UX
- [x] Empty states are clear (Dashboard and Draft). (auto)
- [x] Processing console shows finance-friendly copy. (auto)
- [x] Technical details panel available for diagnostics. (auto)
- [ ] Status transitions are accurate (Pending/Processing/Completed/Failed). (manual)

## 5. Documentation
- [x] Public docs in `/docs` are clear for judges.
- [x] Internal implementation notes retained in `/internal-docs`.
- [x] Current wallet-direct runtime documented.
- [x] Known limitations and fallback behavior documented.

## 6. Demo Readiness (3-minute real-person video)
- [ ] Show problem statement and why confidentiality matters.
- [ ] Show deployed website and Sepolia network context.
- [ ] Explain ERC-20 faucet as funding bridge into ERC-7984, not the core product.
- [ ] Show upload -> validate -> run payroll flow.
- [ ] Show onchain tx confirmation and confidential balances.
- [ ] Show employee decryption proof.
- [ ] Confirm video uses real person voice/presenter, not AI-generated video or voice.
- [ ] End with real-world viability + next steps.

## 7. X Publication
- [ ] Publish either an X thread or X article introducing Lattice Pay.
- [ ] Include live demo, repo, and Sepolia tx links.
- [ ] Use `internal-docs/xpost.md` or `internal-docs/article.md` as the source draft.

## Verification Commands (run before final submission)
```bash
npm run contracts:compile
npm run contracts:test
npm --workspace apps/web run build
```

## Post-MVP Backlog (Batch Scaling)
- Current MVP operational cap: 15 payments/run for demo reliability.
- [ ] Profile encrypted proof size per payment and total calldata size by batch (10/20/50/100).
- [ ] Introduce automatic chunking for large `pain.001` uploads.
