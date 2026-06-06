import { createPublicClient, createWalletClient, custom, http, type Address } from "viem";
import { sepolia } from "viem/chains";
import { appConfig } from "./config";

type WalletRequest = {
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

type BrowserWalletProvider = {
  request: (request: WalletRequest) => Promise<unknown>;
  providers?: BrowserWalletProvider[];
  isMetaMask?: boolean;
};

declare global {
  interface Window {
    ethereum?: BrowserWalletProvider;
  }
}

const WALLET_SESSION_KEY = "cpay_wallet_account";
const SEPOLIA_CHAIN_ID_HEX = `0x${sepolia.id.toString(16)}`;

function getBrowserWallet(): BrowserWalletProvider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No browser wallet found. Install MetaMask or another EIP-1193 wallet.");
  }

  if (Array.isArray(window.ethereum.providers) && window.ethereum.providers.length > 0) {
    return window.ethereum.providers.find((provider) => provider.isMetaMask) || window.ethereum.providers[0];
  }

  return window.ethereum;
}

const walletRpc = {
  request: (request: WalletRequest) => getBrowserWallet().request(request)
};

export const walletProvider = walletRpc;

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: custom(walletRpc)
});

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(appConfig.rpcUrl)
});

const observerAbi = [
  {
    type: "function",
    name: "observer",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "setObserver",
    stateMutability: "nonpayable",
    inputs: [
      { name: "account", type: "address" },
      { name: "newObserver", type: "address" }
    ],
    outputs: []
  }
] as const;

const operatorAbi = [
  {
    type: "function",
    name: "isOperator",
    stateMutability: "view",
    inputs: [
      { name: "holder", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "setOperator",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "until", type: "uint48" }
    ],
    outputs: []
  }
] as const;

const faucetErc20Abi = [
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
] as const;

const wrapperAbi = [
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
] as const;

function asWalletAddress(value: unknown): Address | null {
  if (typeof value !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(value)) return null;
  return value as Address;
}

function firstWalletAddress(value: unknown): Address | null {
  if (!Array.isArray(value)) return null;
  return asWalletAddress(value[0]);
}

function providerErrorCode(error: unknown) {
  const code = (error as { code?: unknown })?.code;
  return typeof code === "number" || typeof code === "string" ? String(code) : "";
}

export async function ensureSepoliaNetwork() {
  const currentChainId = await walletProvider.request({ method: "eth_chainId" }).catch(() => null);
  if (typeof currentChainId === "string" && currentChainId.toLowerCase() === SEPOLIA_CHAIN_ID_HEX) return;

  try {
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }]
    });
  } catch (error) {
    if (providerErrorCode(error) !== "4902") throw error;
    await walletProvider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: SEPOLIA_CHAIN_ID_HEX,
          chainName: "Sepolia",
          nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
          rpcUrls: [appConfig.rpcUrl],
          blockExplorerUrls: ["https://sepolia.etherscan.io"]
        }
      ]
    });
  }
}

export async function connectWallet() {
  const accounts = await walletProvider.request({ method: "eth_requestAccounts" });
  const address = firstWalletAddress(accounts);
  if (!address) throw new Error("No wallet account returned.");
  await ensureSepoliaNetwork();
  saveWalletAccount(address);
  return address;
}

export const loginUser = connectWallet;

export async function getActiveWalletAccount(): Promise<Address | null> {
  const accounts = await walletProvider.request({ method: "eth_accounts" }).catch(() => []);
  return firstWalletAddress(accounts);
}

export function getSavedWalletAccount(): Address | null {
  try {
    const value = window.localStorage.getItem(WALLET_SESSION_KEY);
    return asWalletAddress(value);
  } catch {
    return null;
  }
}

export function saveWalletAccount(address: Address | null) {
  try {
    if (address) window.localStorage.setItem(WALLET_SESSION_KEY, address);
    else window.localStorage.removeItem(WALLET_SESSION_KEY);
  } catch {}
}

async function claimViaBackend(address: Address, amount: string) {
  const faucetUrl = appConfig.faucetUrl;
  if (!faucetUrl) {
    throw new Error("Missing faucet endpoint. Set VITE_FAUCET_URL or VITE_API_BASE_URL.");
  }

  const response = await fetch(faucetUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ address, amount })
  });
  if (!response.ok) {
    let message = "Faucet claim failed.";
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.message || payload.error || message;
    } catch {}
    throw new Error(message);
  }
  const payload = (await response.json()) as { txHash?: string };
  if (!payload.txHash) throw new Error("Faucet claim submitted but no transaction hash returned.");
  return payload.txHash as `0x${string}`;
}

async function claimViaWalletDirect(address: Address, amount: bigint) {
  if (!appConfig.payrollUnderlying) throw new Error("Missing VITE_PAYROLL_UNDERLYING_ADDRESS.");
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  await ensureSepoliaNetwork();

  const mintTx = await walletClient.writeContract({
    address: appConfig.payrollUnderlying,
    abi: faucetErc20Abi,
    functionName: "mint",
    args: [address, amount],
    chain: sepolia,
    account: address
  });
  await waitForTxConfirmation(mintTx);

  const approveTx = await walletClient.writeContract({
    address: appConfig.payrollUnderlying,
    abi: faucetErc20Abi,
    functionName: "approve",
    args: [appConfig.payrollToken, amount],
    chain: sepolia,
    account: address
  });
  await waitForTxConfirmation(approveTx);

  return walletClient.writeContract({
    address: appConfig.payrollToken,
    abi: wrapperAbi,
    functionName: "wrap",
    args: [address, amount],
    chain: sepolia,
    account: address
  });
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export async function claimPayrollTokens(address: Address, amount = "1000000") {
  const amountRaw = BigInt(amount);
  if (appConfig.faucetMode === "backend") {
    return claimViaBackend(address, amount);
  }
  if (appConfig.faucetMode === "wallet_direct") {
    return claimViaWalletDirect(address, amountRaw);
  }

  try {
    return await claimViaWalletDirect(address, amountRaw);
  } catch (directError) {
    const message = String((directError as Error)?.message || directError);
    const invalidNonce = /invalid nonce|invalid transaction nonce/i.test(message);
    if (invalidNonce) {
      await sleep(1200);
      try {
        return await claimViaWalletDirect(address, amountRaw);
      } catch (retryError) {
        if (appConfig.walletDebug) {
          console.debug("[faucet] wallet direct retry failed, fallback backend", {
            error: String((retryError as Error)?.message || retryError)
          });
        }
        return claimViaBackend(address, amount);
      }
    }
    if (appConfig.walletDebug) {
      console.debug("[faucet] wallet direct failed, fallback backend", {
        error: message
      });
    }
    return claimViaBackend(address, amount);
  }
}

export async function waitForTxConfirmation(txHash: `0x${string}`) {
  return publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1
  });
}

export async function setTokenObserver(account: Address, observer: Address) {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  await ensureSepoliaNetwork();
  return walletClient.writeContract({
    address: appConfig.payrollToken,
    abi: observerAbi,
    functionName: "setObserver",
    args: [account, observer],
    chain: sepolia,
    account
  });
}

export async function getTokenObserver(account: Address): Promise<Address> {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  return publicClient.readContract({
    address: appConfig.payrollToken,
    abi: observerAbi,
    functionName: "observer",
    args: [account]
  }) as Promise<Address>;
}

export async function isExecutorOperator(account: Address, executor: Address): Promise<boolean> {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  return publicClient.readContract({
    address: appConfig.payrollToken,
    abi: operatorAbi,
    functionName: "isOperator",
    args: [account, executor]
  }) as Promise<boolean>;
}

export async function setExecutorOperator(account: Address, executor: Address, until: number) {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  await ensureSepoliaNetwork();
  return walletClient.writeContract({
    address: appConfig.payrollToken,
    abi: operatorAbi,
    functionName: "setOperator",
    args: [executor, until],
    chain: sepolia,
    account
  });
}
