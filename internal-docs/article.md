# Lattice Pay: Confidential Payroll Built With Zama Protocol

Payroll is one of the most obvious privacy problems in onchain finance.

Public blockchains are transparent by default. That is useful for settlement and auditability, but it is a bad default for payroll. Individual compensation should not be visible to everyone watching a block explorer.

Lattice Pay is my submission for the Zama Developer Program Builder Track. It is a functioning confidential payroll dApp built with Zama Protocol, FHEVM, OpenZeppelin ERC-7984 confidential tokens, a Solidity smart contract codebase, and a deployed React frontend on Sepolia.

## What Lattice Pay Does

Lattice Pay lets an employer run a payroll batch without exposing salary amounts publicly.

The workflow is:

1. Connect a Sepolia browser wallet.
2. Fund the demo payroll token.
3. Upload an ISO 20022 `pain.001` payroll file.
4. Validate recipients, duplicates, totals, positive amounts, and batch size.
5. Authorize the payroll executor as an ERC-7984 operator.
6. Encrypt every salary amount in the browser through the Zama relayer flow.
7. Execute a confidential payroll batch onchain.
8. Download a `pain.002`-style payment status receipt.
9. Let recipients reveal only their own confidential balance from the portal.

The goal is not just to show that encrypted token transfers are possible. The goal is to show what a real payroll workflow around confidential transfers can look like.

## Why This Uses ERC-7984

Lattice Pay uses ERC-7984 because payroll is a value-transfer use case. We need confidential balances and confidential transfers, not just encrypted metadata.

ERC-7984 provides the private token rail. It gives the application encrypted token balances, confidential transfer semantics, operator approvals, and wallet-authorized balance reveal flows.

But ERC-7984 by itself is not a payroll product. It does not parse payroll files. It does not validate business rules. It does not create payroll receipts. It does not guide an operator through a batch run.

That is where Lattice Pay fits.

Lattice Pay adds the application layer around ERC-7984:

- ISO 20022 `pain.001` import.
- Payroll draft review.
- Recipient and amount validation.
- Operator authorization.
- Browser-side FHE encryption.
- Batch execution through `PayrollExecutor`.
- Per-payment result tracking.
- `pain.002` receipt generation.
- Recipient self-service decryption.

The simplest framing is this:

ERC-7984 is the private token rail. Lattice Pay is the payroll workflow built on top.

## Why The Demo Faucet Starts With ERC-20

One part of the demo can look surprising at first: the faucet starts with ERC-20.

That is intentional.

Most treasury stablecoin flows today are ERC-20 flows. A team does not usually start with confidential payroll tokens sitting in a wallet. It starts with familiar treasury assets, approvals, funding flows, and accounting expectations.

The Lattice Pay demo models that bridge:

1. Mint a mock ERC-20 stable token for the demo.
2. Approve the ERC-7984 wrapper.
3. Wrap into the confidential payroll token.
4. Run payroll with ERC-7984 confidential transfers.

The ERC-20 faucet is not the product. It is a demo bridge from today's stablecoin treasury model into the confidential payroll layer.

Once the funds are wrapped, the payroll flow is ERC-7984 based.

## How FHE Is Used

The sensitive data in payroll is the salary amount.

In Lattice Pay, those payment amounts are encrypted in the browser before the transaction is submitted. The contract receives encrypted amount handles and input proofs, then executes the payroll batch through confidential ERC-7984 transfers.

The recipient portal uses wallet-signed user decryption. A recipient can reveal their own confidential balance, but not everyone else's.

That is the practical value of FHE here: selective disclosure. Settlement can happen onchain, while salary data remains private unless the authorized wallet chooses to decrypt its own balance.

## What The Smart Contracts Do

The Solidity side is intentionally focused.

`ConfidentialPayrollToken` is the ERC-7984 payroll token wrapper used for confidential balances and transfers.

`PayrollExecutor` handles the payroll run. It validates the batch shape, checks authorization, prevents replay, enforces expiry and nonce checks, calls ERC-7984 confidential transfers, and emits per-payment results.

The frontend uses those events to show completion state and generate the local `pain.002`-style receipt.

## Why This Is A Real-World Use Case

Payroll has a clear privacy need:

- Employers need to pay many people.
- Employees do not want compensation data public.
- Finance teams need receipts and status reports.
- Auditors need traceability.
- Recipients need a way to confirm their own balance.

Lattice Pay brings those requirements together in one dApp.

It is not a privacy-themed mockup. It includes a smart contract codebase, a frontend codebase, a deployed website, encrypted payroll inputs, Sepolia transaction submission, payment status tracking, receipt generation, and wallet-authorized recipient decryption.

## Closing

Zama Protocol makes it possible to build dApps where computation and settlement can happen without exposing sensitive values.

Lattice Pay applies that to payroll: a familiar finance workflow powered by confidential onchain infrastructure.

The result is payroll that is private, auditable, and usable from a web app.

Links:

- Live demo: `<paste-url>`
- Repository: `<paste-url>`
- Example Sepolia transaction: `<paste-tx-url>`
