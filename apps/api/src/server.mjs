import { createServer } from "node:http";
import { createPublicClient, createWalletClient, http, keccak256, toHex } from "viem";
import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/node";

const PORT = Number(process.env.PORT || 8787);
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
const OBSERVER_PRIVATE_KEY = process.env.OBSERVER_PRIVATE_KEY || FAUCET_PRIVATE_KEY;
const FAUCET_MNEMONIC = process.env.FAUCET_MNEMONIC;
const FAUCET_ACCOUNT_INDEX = Number(process.env.FAUCET_ACCOUNT_INDEX || 0);
const PAYROLL_EXECUTOR_ADDRESS = process.env.PAYROLL_EXECUTOR_ADDRESS;
const PAYROLL_TOKEN_ADDRESS = process.env.PAYROLL_TOKEN_ADDRESS;
const SEPOLIA_RPC_URL =
  process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
const MAX_PAYMENT_COUNT = Number(process.env.MAX_PAYMENT_COUNT || 15);
const MAX_FAUCET_CLAIM = BigInt(process.env.MAX_FAUCET_CLAIM || "1000000000000");

const normalizeOrigin = (value) => {
  if (!value) return value;
  const trimmed = value.trim();
  if (trimmed === "*") return "*";
  return trimmed.replace(/\/+$/, "");
};

if (!PAYROLL_EXECUTOR_ADDRESS || !PAYROLL_TOKEN_ADDRESS) {
  throw new Error("Missing required env vars: PAYROLL_EXECUTOR_ADDRESS, PAYROLL_TOKEN_ADDRESS");
}
if (!FAUCET_PRIVATE_KEY && !FAUCET_MNEMONIC) {
  throw new Error(
    "Missing faucet signer credentials. Set FAUCET_MNEMONIC or FAUCET_PRIVATE_KEY."
  );
}
if (!OBSERVER_PRIVATE_KEY) {
  throw new Error("Missing required env var: OBSERVER_PRIVATE_KEY");
}

const payrollExecutorAbi = [
  {
    type: "function",
    name: "executePayroll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "runId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "recipients", type: "address[]" },
      { name: "encryptedAmounts", type: "bytes32[]" },
      { name: "inputProofs", type: "bytes[]" },
      { name: "validUntil", type: "uint48" },
      { name: "nonce", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "nonces",
    stateMutability: "view",
    inputs: [{ name: "smartAccount", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
];

const wrapperAbi = [
  {
    type: "function",
    name: "underlying",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "wrap",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  }
];
const observerAbi = [
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
];

const erc20Abi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
];

const faucetSigner = FAUCET_MNEMONIC
  ? mnemonicToAccount(FAUCET_MNEMONIC, {
      addressIndex: FAUCET_ACCOUNT_INDEX
    })
  : privateKeyToAccount(FAUCET_PRIVATE_KEY);
const observerSigner = privateKeyToAccount(OBSERVER_PRIVATE_KEY);
const faucetClient = createWalletClient({
  account: faucetSigner,
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL)
});
const observerClient = createWalletClient({
  account: observerSigner,
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL)
});
const readClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL)
});
let relayerInstancePromise = null;

const getRelayerInstance = () => {
  if (!relayerInstancePromise) {
    relayerInstancePromise = createInstance({
      ...SepoliaConfig,
      network: SEPOLIA_RPC_URL
    });
  }
  return relayerInstancePromise;
};

const allowedOrigins =
  CORS_ORIGIN === "*"
    ? ["*"]
    : [...new Set([normalizeOrigin(CORS_ORIGIN), ...CORS_ORIGINS.map(normalizeOrigin)].filter(Boolean))];

const resolveCorsOrigin = (req) => {
  if (allowedOrigins.includes("*")) return "*";
  const requestOrigin = normalizeOrigin(req.headers.origin);
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return allowedOrigins[0] || "null";
};

const writeCors = (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", resolveCorsOrigin(req));
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");
};

createServer(async (req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    writeCors(req, res);
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "cpay-api" }));
    return;
  }
  if (req.url === "/health" && req.method === "OPTIONS") {
    writeCors(req, res);
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.url === "/faucet/claim" && req.method === "POST") {
    try {
      writeCors(req, res);
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw) : {};
      const address = body?.address;
      const amount = BigInt(body?.amount || "100000");

      if (!address || typeof address !== "string" || !address.startsWith("0x")) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid address" }));
        return;
      }
      if (amount <= 0n) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Amount must be greater than 0" }));
        return;
      }
      if (amount > MAX_FAUCET_CLAIM) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            error: `Amount exceeds max faucet claim (${MAX_FAUCET_CLAIM.toString()})`
          })
        );
        return;
      }

      let underlying;
      try {
        underlying = await readClient.readContract({
          address: PAYROLL_TOKEN_ADDRESS,
          abi: wrapperAbi,
          functionName: "underlying"
        });
      } catch (error) {
        throw new Error(
          `PAYROLL_TOKEN_ADDRESS (${PAYROLL_TOKEN_ADDRESS}) is not an ERC7984ERC20Wrapper deployment. Redeploy ConfidentialPayrollToken and update env. ${error?.shortMessage || error?.message || ""}`.trim()
        );
      }

      const mintTxHash = await faucetClient.writeContract({
        address: underlying,
        abi: erc20Abi,
        functionName: "mint",
        args: [faucetSigner.address, amount]
      });
      await readClient.waitForTransactionReceipt({ hash: mintTxHash, confirmations: 1 });

      const approveTxHash = await faucetClient.writeContract({
        address: underlying,
        abi: erc20Abi,
        functionName: "approve",
        args: [PAYROLL_TOKEN_ADDRESS, amount]
      });
      await readClient.waitForTransactionReceipt({ hash: approveTxHash, confirmations: 1 });

      const txHash = await faucetClient.writeContract({
        address: PAYROLL_TOKEN_ADDRESS,
        abi: wrapperAbi,
        functionName: "wrap",
        args: [address, amount]
      });

      console.log("[faucet] wrapped confidential tokens", {
        address,
        amount: amount.toString(),
        signer: faucetSigner.address,
        underlying,
        txHash
      });
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, txHash }));
      return;
    } catch (error) {
      writeCors(req, res);
      console.error("[faucet] claim failed", error);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Faucet claim failed",
          message: error?.shortMessage || error?.message || String(error)
        })
      );
      return;
    }
  }
  if (req.url === "/faucet/claim" && req.method === "OPTIONS") {
    writeCors(req, res);
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.url === "/decrypt/balance" && req.method === "POST") {
    try {
      writeCors(req, res);
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw) : {};
      const address = body?.address;
      if (!address || typeof address !== "string" || !address.startsWith("0x")) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid address" }));
        return;
      }

      const handle = await readClient.readContract({
        address: PAYROLL_TOKEN_ADDRESS,
        abi: observerAbi,
        functionName: "confidentialBalanceOf",
        args: [address]
      });

      const instance = await getRelayerInstance();
      const keypair = instance.generateKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 1;
      const eip712 = instance.createEIP712(keypair.publicKey, [PAYROLL_TOKEN_ADDRESS], startTimestamp, durationDays);
      const signature = await observerSigner.signTypedData({
        domain: eip712.domain,
        primaryType: eip712.primaryType,
        types: {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification
        },
        message: eip712.message
      });

      const decrypted = await instance.userDecrypt(
        [{ handle, contractAddress: PAYROLL_TOKEN_ADDRESS }],
        keypair.privateKey,
        keypair.publicKey,
        signature,
        [PAYROLL_TOKEN_ADDRESS],
        observerSigner.address,
        startTimestamp,
        durationDays
      );

      const value = decrypted[handle];
      const balance = typeof value === "bigint" ? value.toString() : "0";
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, balance, handle }));
      return;
    } catch (error) {
      writeCors(req, res);
      console.error("[decrypt] failed", error);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Balance decrypt failed",
          message: error?.shortMessage || error?.message || String(error)
        })
      );
      return;
    }
  }
  if (req.url === "/payroll/execute" && req.method === "POST") {
    try {
      writeCors(req, res);
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = raw ? JSON.parse(raw) : {};
      const smartAccount = body?.smartAccount;
      const recipients = body?.recipients;
      const encryptedAmounts = body?.encryptedAmounts;
      const inputProofs = body?.inputProofs;

      if (!smartAccount || typeof smartAccount !== "string" || !smartAccount.startsWith("0x")) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid smartAccount" }));
        return;
      }
      if (!Array.isArray(recipients) || recipients.length === 0) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Recipients required" }));
        return;
      }
      if (recipients.length > MAX_PAYMENT_COUNT) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: `Payment count exceeds max (${MAX_PAYMENT_COUNT})` }));
        return;
      }
      if (!Array.isArray(encryptedAmounts) || encryptedAmounts.length !== recipients.length) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "encryptedAmounts length mismatch" }));
        return;
      }
      if (!Array.isArray(inputProofs) || inputProofs.length !== recipients.length || inputProofs.some((p) => !p || p === "0x")) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "inputProofs length mismatch or empty proof" }));
        return;
      }

      const isOperator = await readClient.readContract({
        address: PAYROLL_TOKEN_ADDRESS,
        abi: observerAbi,
        functionName: "isOperator",
        args: [smartAccount, PAYROLL_EXECUTOR_ADDRESS]
      });
      if (!isOperator) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Executor is not operator for payroll account. Call setOperator(executor, until) on cUSDC first."
          })
        );
        return;
      }

      const nonce = await readClient.readContract({
        address: PAYROLL_EXECUTOR_ADDRESS,
        abi: payrollExecutorAbi,
        functionName: "nonces",
        args: [smartAccount]
      });
      const validUntil = BigInt(Math.floor(Date.now() / 1000) + 600);
      const runId = keccak256(toHex(`${smartAccount}-${nonce.toString()}-${Date.now()}`));

      const txHash = await observerClient.writeContract({
        address: PAYROLL_EXECUTOR_ADDRESS,
        abi: payrollExecutorAbi,
        functionName: "executePayroll",
        args: [
          runId,
          PAYROLL_TOKEN_ADDRESS,
          smartAccount,
          recipients,
          encryptedAmounts,
          inputProofs,
          validUntil,
          nonce
        ]
      });

      console.log("[payroll] submitted", {
        signer: observerSigner.address,
        smartAccount,
        runId,
        nonce: nonce.toString(),
        paymentCount: recipients.length,
        txHash
      });

      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, txHash, runId, nonce: nonce.toString(), validUntil: validUntil.toString() }));
      return;
    } catch (error) {
      writeCors(req, res);
      console.error("[payroll] execute failed", error);
      res.writeHead(500, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Payroll execute failed",
          message: error?.shortMessage || error?.message || String(error)
        })
      );
      return;
    }
  }
  if (req.url === "/payroll/execute" && req.method === "OPTIONS") {
    writeCors(req, res);
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.url === "/decrypt/balance" && req.method === "OPTIONS") {
    writeCors(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  writeCors(req, res);
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
}).listen(PORT, "0.0.0.0", () => {
  console.log(`cPay API listening on 0.0.0.0:${PORT}`);
  console.log(`Faucet route: /faucet/claim`);
  console.log(`Decrypt route: /decrypt/balance`);
  console.log(`Execute route: /payroll/execute`);
  console.log(`Faucet signer: ${faucetSigner.address}`);
  console.log(`Observer signer: ${observerSigner.address}`);
});
