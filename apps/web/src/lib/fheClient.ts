import { recoverTypedDataAddress, type Address, type Hex } from "viem";
import { toHex } from "viem";
import { appConfig } from "./config";
import { publicClient, walletClient, walletProvider } from "./walletClient";

const confidentialTokenAbi = [
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }]
  }
] as const;

const mockFaucetAbi = [
  {
    type: "function",
    name: "faucetBalances",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

type RelayerInstance = {
  createEncryptedInput: (
    contractAddress: Address,
    userAddress: Address
  ) => {
    add64: (value: bigint | number) => void;
    encrypt: () => Promise<{ handles: Hex[]; inputProof: Hex }>;
  };
  generateKeypair: () => { publicKey: Hex; privateKey: Hex };
  createEIP712: (publicKey: string, contractAddresses: string[], startTimestamp: number, durationDays: number) => {
    domain: unknown;
    types: unknown;
    primaryType: string;
    message: unknown;
  };
  userDecrypt: (
    handlePairs: Array<{ handle: Hex; contractAddress: Address }>,
    privateKey: string,
    publicKey: string,
    signature: Hex,
    contractAddresses: string[],
    userAddress: string,
    startTimestamp: number,
    durationDays: number
  ) => Promise<Record<Hex, bigint | boolean | Hex>>;
};

type RelayerSdkGlobal = {
  initSDK: () => Promise<boolean>;
  createInstance: (config: Record<string, unknown>) => Promise<RelayerInstance>;
  SepoliaConfig: Record<string, unknown>;
};

declare global {
  interface Window {
    relayerSDK?: RelayerSdkGlobal;
  }
}

let relayerScriptPromise: Promise<void> | null = null;
let relayerInstancePromise: Promise<RelayerInstance> | null = null;
let relayerCdnHealthy: boolean | null = null;
const relayerDebug = appConfig.walletDebug;

export async function checkRelayerCdnHealth(): Promise<boolean> {
  if (relayerCdnHealthy !== null) return relayerCdnHealthy;
  try {
    const response = await fetch(appConfig.relayerSdkCdn, {
      method: "HEAD",
      mode: "cors"
    });
    relayerCdnHealthy = response.ok;
    if (relayerDebug) console.debug("[relayer] cdn health", { url: appConfig.relayerSdkCdn, ok: response.ok, status: response.status });
  } catch {
    relayerCdnHealthy = false;
    if (relayerDebug) console.debug("[relayer] cdn health failed", { url: appConfig.relayerSdkCdn });
  }
  return relayerCdnHealthy;
}

async function loadRelayerSdkFromCdn() {
  if (window.relayerSDK) return;
  if (!relayerScriptPromise) {
    if (relayerDebug) console.debug("[relayer] loading sdk script", { url: appConfig.relayerSdkCdn });
    relayerScriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(`script[data-relayer-sdk="true"]`) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Failed to load relayer SDK script.")), {
          once: true
        });
        return;
      }

      const script = document.createElement("script");
      script.src = appConfig.relayerSdkCdn;
      script.async = true;
      script.type = "text/javascript";
      script.dataset.relayerSdk = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load relayer SDK from CDN."));
      document.head.appendChild(script);
    });
  }
  await relayerScriptPromise;
  if (!window.relayerSDK) throw new Error("Relayer SDK global not available after CDN load.");
  if (relayerDebug) console.debug("[relayer] sdk script loaded");
}

async function getRelayerInstance() {
  if (!relayerInstancePromise) {
    relayerInstancePromise = (async () => {
      if (relayerDebug) console.debug("[relayer] init start");
      await loadRelayerSdkFromCdn();
      const sdk = window.relayerSDK!;
      if (relayerDebug) console.debug("[relayer] initSDK()");
      await sdk.initSDK();
      if (relayerDebug) console.debug("[relayer] createInstance()", { rpcUrl: appConfig.rpcUrl });
      const instance = await sdk.createInstance({
        ...sdk.SepoliaConfig,
        network: appConfig.rpcUrl
      });
      if (relayerDebug) console.debug("[relayer] instance ready");
      return instance;
    })();
  }
  return relayerInstancePromise;
}

function normalizeTypedDataTypes(types: Record<string, unknown>) {
  const next = { ...(types as Record<string, unknown>) };
  delete next.EIP712Domain;
  return next;
}

async function signUserDecryptTypedData(address: Address, eip712: {
  domain: unknown;
  types: unknown;
  primaryType: string;
  message: unknown;
}) {
  const types = normalizeTypedDataTypes(eip712.types as Record<string, unknown>);
  const signPayload = {
    account: address,
    domain: eip712.domain as any,
    types: types as any,
    primaryType: eip712.primaryType as any,
    message: eip712.message as any
  } as any;

  let signature: Hex;
  const v4Payload = {
    domain: eip712.domain,
    types: { ...(eip712.types as Record<string, unknown>) },
    primaryType: eip712.primaryType,
    message: eip712.message
  };
  try {
    signature = (await walletProvider.request({
      method: "eth_signTypedData_v4",
      params: [address, JSON.stringify(v4Payload)]
    })) as Hex;
  } catch (firstError) {
    try {
      signature = await walletClient.signTypedData(signPayload);
    } catch (secondError) {
      throw new Error(
        `Typed-data signature failed. ${String((firstError as Error)?.message || firstError)} | fallback: ${String((secondError as Error)?.message || secondError)}`
      );
    }
  }

  try {
    if (relayerDebug) {
      const accounts = (await walletProvider.request({ method: "eth_accounts" })) as Address[];
      console.debug("[relayer] wallet accounts", { accounts, signingAs: address });
    }
    const recovered = await recoverTypedDataAddress({
      account: address,
      domain: eip712.domain as any,
      types: types as any,
      primaryType: eip712.primaryType as any,
      message: eip712.message as any,
      signature
    } as any);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      const mismatchError = new Error(
        `Signer mismatch for decrypt auth. signedBy=${recovered} expected=${address}. The relayer user-decrypt flow requires the connected wallet to sign for this address.`
      );
      if (relayerDebug) {
        console.debug("[relayer] typed data signer mismatch", {
          expected: address,
          recovered
        });
      }
      throw mismatchError;
    }
  } catch (error) {
    if ((error as Error)?.message?.startsWith("Signer mismatch for decrypt auth.")) {
      throw error;
    }
    if (relayerDebug) {
      console.debug("[relayer] typed data recovery check failed", {
        expected: address,
        error: String((error as Error)?.message || error)
      });
    }
  }

  return signature;
}

async function getConfidentialBalanceHandle(address: Address): Promise<Hex> {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  return publicClient.readContract({
    address: appConfig.payrollToken,
    abi: confidentialTokenAbi,
    functionName: "confidentialBalanceOf",
    args: [address]
  }) as Promise<Hex>;
}

async function getMockFaucetBalance(address: Address): Promise<bigint | null> {
  if (!appConfig.payrollToken) return null;
  try {
    const value = await publicClient.readContract({
      address: appConfig.payrollToken,
      abi: mockFaucetAbi,
      functionName: "faucetBalances",
      args: [address]
    });
    return value as bigint;
  } catch {
    return null;
  }
}

function isZeroHandle(value: Hex) {
  return /^0x0{64}$/i.test(value);
}

export async function getDecryptedPayrollBalance(address: Address): Promise<bigint | null> {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  const payrollToken = appConfig.payrollToken;
  const backendDecrypt = async (): Promise<bigint | null> => {
    if (!appConfig.decryptUrl) throw new Error("Missing decrypt endpoint URL.");
    const response = await fetch(appConfig.decryptUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address })
    });
    if (response.ok) {
      const payload = (await response.json()) as { balance?: string };
      if (payload.balance !== undefined) return BigInt(payload.balance);
      return null;
    }
    let message = "Observer decrypt endpoint failed.";
    try {
      const payload = (await response.json()) as { error?: string; message?: string };
      message = payload.message || payload.error || message;
    } catch {}
    throw new Error(message);
  };

  const clientDecrypt = async (): Promise<bigint | null> => {
    if (!(await checkRelayerCdnHealth())) {
      throw new Error("Relayer CDN unavailable. Decryption is temporarily disabled.");
    }

    const instance = await getRelayerInstance();
    const handle = await getConfidentialBalanceHandle(address);
    if (relayerDebug) console.debug("[relayer] confidentialBalanceOf handle", { address, token: payrollToken, handle });
    if (isZeroHandle(handle)) {
      if (relayerDebug) console.debug("[relayer] zero handle detected, using mock fallback");
      return getMockFaucetBalance(address);
    }
    const keypair = instance.generateKeypair();
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 1;

    const eip712 = instance.createEIP712(keypair.publicKey, [payrollToken], startTimestamp, durationDays);
    if (relayerDebug) {
      console.debug("[relayer] eip712 created", {
        address,
        startTimestamp,
        durationDays,
        primaryType: eip712.primaryType
      });
    }
    const signature = await signUserDecryptTypedData(address, eip712);
    const normalizedSignature = signature.startsWith("0x") ? signature.slice(2) : signature;
    if (relayerDebug) console.debug("[relayer] typed data signed", { address });

    let decrypted: Record<Hex, bigint | boolean | Hex>;
    try {
      if (relayerDebug) console.debug("[relayer] userDecrypt submit", { address });
      decrypted = await instance.userDecrypt(
        [{ handle, contractAddress: payrollToken }],
        keypair.privateKey,
        keypair.publicKey,
        normalizedSignature as Hex,
        [payrollToken],
        address,
        startTimestamp,
        durationDays
      );
      if (relayerDebug) console.debug("[relayer] userDecrypt success", { address });
    } catch (error) {
      if (relayerDebug) console.debug("[relayer] userDecrypt failed", { address, error: String((error as Error)?.message || error) });
      const fallback = await getMockFaucetBalance(address);
      if (fallback !== null) return fallback;
      throw new Error(`Balance decryption submission failed: ${String((error as Error)?.message || error)}`);
    }

    const value = decrypted[handle];
    if (typeof value === "bigint") return value;
    return null;
  };

  const mode = appConfig.decryptMode;
  if (relayerDebug) console.debug("[relayer] decrypt mode", { mode });

  if (mode === "observer") return backendDecrypt();
  if (mode === "client") return clientDecrypt();

  try {
    return await clientDecrypt();
  } catch (clientError) {
    if (relayerDebug) console.debug("[relayer] client decrypt failed, fallback observer", { error: String((clientError as Error)?.message || clientError) });
    if (!appConfig.decryptUrl) throw clientError;
    try {
      return await backendDecrypt();
    } catch (backendError) {
      throw new Error(
        `Decrypt failed (client + observer). client=${String((clientError as Error)?.message || clientError)} observer=${String((backendError as Error)?.message || backendError)}`
      );
    }
  }
}

export async function encryptPayrollAmounts(
  userAddress: Address,
  clearAmounts: Array<number | bigint>
): Promise<{ encryptedAmounts: Hex[]; inputProofs: Hex[] }> {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  if (!appConfig.payrollExecutor) throw new Error("Missing VITE_PAYROLL_EXECUTOR_ADDRESS.");
  if (clearAmounts.length === 0) throw new Error("No amounts provided for encryption.");
  if (!(await checkRelayerCdnHealth())) {
    throw new Error("Relayer CDN unavailable. Encryption is temporarily disabled.");
  }

  const instance = await getRelayerInstance();
  const encryptedAmounts: Hex[] = [];
  const inputProofs: Hex[] = [];
  const asHex = (value: unknown): Hex => {
    if (typeof value === "string") return value as Hex;
    if (value instanceof Uint8Array) return toHex(value) as Hex;
    throw new Error("Relayer returned non-hex encryption payload.");
  };

  for (const amount of clearAmounts) {
    const value = typeof amount === "bigint" ? amount : BigInt(amount);
    if (value <= 0n) throw new Error("Encrypted amount inputs must be > 0.");
    // Executor forwards external inputs to token.confidentialTransfer(externalEuint64,inputProof),
    // so proof context must match token contract + executor caller.
    const input = instance.createEncryptedInput(appConfig.payrollToken, appConfig.payrollExecutor);
    input.add64(value);
    const encrypted = await input.encrypt();
    const handle = asHex(encrypted.handles[0]);
    if (!handle) throw new Error("Relayer encryption did not return a handle.");
    encryptedAmounts.push(handle);
    inputProofs.push(asHex(encrypted.inputProof));
  }

  if (relayerDebug) {
    console.debug("[relayer] payroll encryption complete", {
      count: encryptedAmounts.length,
      context: { contract: appConfig.payrollToken, user: appConfig.payrollExecutor, requestedBy: userAddress }
    });
  }

  return { encryptedAmounts, inputProofs };
}
