import type { Address } from "viem";

const asAddress = (value: string | undefined): Address | undefined => {
  if (!value || !value.startsWith("0x") || value.length !== 42) return undefined;
  return value as Address;
};

export const appConfig = {
  chainId: 11155111,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
  decryptUrl: import.meta.env.VITE_DECRYPT_URL as string | undefined,
  decryptMode: (import.meta.env.VITE_DECRYPT_MODE as string | undefined) || "hybrid",
  executeUrl: import.meta.env.VITE_EXECUTE_URL as string | undefined,
  executionMode: (import.meta.env.VITE_EXECUTION_MODE as string | undefined) || "backend",
  faucetMode: (import.meta.env.VITE_FAUCET_MODE as string | undefined) || "backend",
  observerAddress: asAddress(import.meta.env.VITE_OBSERVER_ADDRESS as string | undefined),
  payrollUnderlying: asAddress(import.meta.env.VITE_PAYROLL_UNDERLYING_ADDRESS as string | undefined),
  payrollExecutor: asAddress(import.meta.env.VITE_PAYROLL_EXECUTOR_ADDRESS as string | undefined),
  payrollToken: asAddress(import.meta.env.VITE_PAYROLL_TOKEN_ADDRESS as string | undefined),
  rpcUrl: (import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined) || "https://ethereum-sepolia-rpc.publicnode.com",
  faucetUrl: import.meta.env.VITE_FAUCET_URL as string | undefined,
  relayerSdkCdn:
    (import.meta.env.VITE_RELAYER_SDK_CDN as string | undefined) ||
    "https://cdn.zama.org/relayer-sdk-js/0.4.1/relayer-sdk-js.umd.cjs",
  walletDebug: (import.meta.env.VITE_WALLET_DEBUG as string | undefined) === "true"
};


if (!appConfig.faucetUrl && appConfig.apiBaseUrl) {
  appConfig.faucetUrl = `${appConfig.apiBaseUrl.replace(/\/$/, "")}/faucet/claim`;
}

if (!appConfig.decryptUrl && appConfig.apiBaseUrl) {
  appConfig.decryptUrl = `${appConfig.apiBaseUrl.replace(/\/$/, "")}/decrypt/balance`;
}

if (!appConfig.executeUrl && appConfig.apiBaseUrl) {
  appConfig.executeUrl = `${appConfig.apiBaseUrl.replace(/\/$/, "")}/payroll/execute`;
}

export function hasExecutionConfig() {
  return Boolean(appConfig.payrollExecutor && appConfig.payrollToken);
}
