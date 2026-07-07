import type { Address } from "viem";

const asAddress = (value: string | undefined): Address | undefined => {
  if (!value || !value.startsWith("0x") || value.length !== 42) return undefined;
  return value as Address;
};

export const appConfig = {
  chainId: 11155111,
  payrollUnderlying: asAddress(import.meta.env.VITE_PAYROLL_UNDERLYING_ADDRESS as string | undefined),
  payrollExecutor: asAddress(import.meta.env.VITE_PAYROLL_EXECUTOR_ADDRESS as string | undefined),
  payrollToken: asAddress(import.meta.env.VITE_PAYROLL_TOKEN_ADDRESS as string | undefined),
  rpcUrl: (import.meta.env.VITE_SEPOLIA_RPC_URL as string | undefined) || "https://ethereum-sepolia-rpc.publicnode.com",
  relayerSdkUrl:
    (import.meta.env.VITE_RELAYER_SDK_URL as string | undefined) ||
    (import.meta.env.VITE_RELAYER_SDK_CDN as string | undefined) ||
    "/relayer-sdk-js/relayer-sdk-js.umd.cjs",
  walletDebug: (import.meta.env.VITE_WALLET_DEBUG as string | undefined) === "true"
};

export function hasExecutionConfig() {
  return Boolean(appConfig.payrollExecutor && appConfig.payrollToken);
}

export function hasFaucetConfig() {
  return Boolean(appConfig.payrollUnderlying && appConfig.payrollToken);
}
