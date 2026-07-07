import { toHex, type Address, type Hex } from "viem";
import { appConfig } from "./config";

type RelayerInstance = {
  createEncryptedInput: (
    contractAddress: Address,
    userAddress: Address
  ) => {
    add64: (value: bigint | number) => void;
    encrypt: () => Promise<{ handles: Hex[]; inputProof: Hex }>;
  };
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
let relayerSdkHealthy: boolean | null = null;
const relayerDebug = appConfig.walletDebug;

async function checkRelayerSdkHealth(): Promise<boolean> {
  if (relayerSdkHealthy !== null) return relayerSdkHealthy;
  try {
    const response = await fetch(appConfig.relayerSdkUrl, {
      method: "HEAD",
      mode: "cors"
    });
    relayerSdkHealthy = response.ok;
    if (relayerDebug) console.debug("[relayer] sdk health", { url: appConfig.relayerSdkUrl, ok: response.ok, status: response.status });
  } catch {
    relayerSdkHealthy = false;
    if (relayerDebug) console.debug("[relayer] sdk health failed", { url: appConfig.relayerSdkUrl });
  }
  return relayerSdkHealthy;
}

async function loadRelayerSdk() {
  if (window.relayerSDK) return;
  if (!relayerScriptPromise) {
    if (relayerDebug) console.debug("[relayer] loading sdk script", { url: appConfig.relayerSdkUrl });
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
      script.src = appConfig.relayerSdkUrl;
      script.async = true;
      script.type = "text/javascript";
      script.crossOrigin = "anonymous";
      script.dataset.relayerSdk = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load relayer SDK."));
      document.head.appendChild(script);
    });
  }
  await relayerScriptPromise;
  if (!window.relayerSDK) throw new Error("Relayer SDK global not available after script load.");
  if (relayerDebug) console.debug("[relayer] sdk script loaded");
}

async function getRelayerInstance() {
  if (!relayerInstancePromise) {
    relayerInstancePromise = (async () => {
      if (relayerDebug) console.debug("[relayer] init start");
      await loadRelayerSdk();
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

export async function encryptPayrollAmounts(
  userAddress: Address,
  clearAmounts: Array<number | bigint>
): Promise<{ encryptedAmounts: Hex[]; inputProofs: Hex[] }> {
  if (!appConfig.payrollToken) throw new Error("Missing VITE_PAYROLL_TOKEN_ADDRESS.");
  if (!appConfig.payrollExecutor) throw new Error("Missing VITE_PAYROLL_EXECUTOR_ADDRESS.");
  if (clearAmounts.length === 0) throw new Error("No amounts provided for encryption.");
  if (!(await checkRelayerSdkHealth())) {
    throw new Error("Relayer SDK unavailable. Encryption is temporarily disabled.");
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
