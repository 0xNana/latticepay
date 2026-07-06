# X Thread Draft - Zama Builder Track

## Main Thread

1. Introducing **Lattice Pay**: confidential onchain payroll built with **Zama Protocol**, FHEVM, and ERC-7984.

Payroll is a real-world privacy problem. Public chains are transparent by default, but individual salaries should not be public data.

2. Lattice Pay is my submission for the **Zama Developer Program - Builder Track**.

It includes:
- Solidity smart contracts
- React frontend
- deployed website
- Sepolia demo flow
- encrypted payroll execution
- recipient-only balance reveal

3. The workflow starts like a real payroll process:

Connect wallet -> fund demo payroll token -> upload ISO 20022 `pain.001` -> validate recipients and totals -> execute payroll -> download `pain.002` receipt -> recipient decrypts their own balance.

4. One detail: the demo faucet starts with ERC-20 on purpose.

Most treasury stablecoin flows today start as ERC-20. Lattice Pay mints mock ERC-20, approves the ERC-7984 wrapper, and wraps into the confidential payroll token.

That is the bridge from today's treasury model into confidential payroll.

5. After that funding bridge, payroll execution is ERC-7984 based.

The frontend encrypts salary amounts through the Zama relayer flow, then `PayrollExecutor` submits confidential transfers using encrypted amounts and input proofs.

Plaintext salary amounts do not need to be public onchain.

6. ERC-7984 gives the private token rail.

Lattice Pay adds the payroll operating layer:
- `pain.001` import
- validation
- operator authorization
- encrypted batch execution
- per-payment status
- `pain.002` receipt
- recipient portal

7. The recipient portal is where the FHE value becomes obvious.

A recipient connects their wallet and signs a user-decrypt request. They reveal only their own confidential payroll balance.

Other recipients' balances remain private.

8. This is not a privacy-themed mockup.

It is a working confidential dApp demo on Sepolia with smart contract + frontend code, encrypted inputs, ERC-7984 confidential transfers, payment receipts, and wallet-authorized decryption.

9. Lattice Pay shows how Zama Protocol can support real finance workflows: private where sensitive, auditable where required, and usable from a deployed web app.

Links in reply.

## Short Post

Built **Lattice Pay** for the Zama Developer Program Builder Track.

It is confidential payroll on Sepolia using Zama Protocol + ERC-7984:

`pain.001` upload -> validation -> encrypted batch execution -> `pain.002` receipt -> recipient-only balance reveal.

The ERC-20 faucet is just the treasury bridge into ERC-7984. The payroll rail is confidential.

## Conversational Version

I built **Lattice Pay**, a confidential payroll dApp with Zama Protocol.

The idea is simple: payroll should be auditable, but salaries should not be public.

The app lets an operator upload a `pain.001` payroll file, validate it, encrypt salary amounts, run a confidential ERC-7984 payroll batch, download a `pain.002` receipt, and let each recipient reveal only their own balance.

The demo starts with an ERC-20 faucet because that is how most treasury stablecoin flows work today. It wraps into ERC-7984, then payroll runs on the confidential token rail.

Built for the Zama Developer Program Builder Track.

## Reply Template

- Live demo: `<paste-url>`
- Repo: `<paste-url>`
- Article: `<paste-url>`
- Example Sepolia tx: `https://sepolia.etherscan.io/tx/<tx-hash>`
