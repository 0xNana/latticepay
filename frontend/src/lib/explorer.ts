import { appConfig } from "./config";

export function getTxExplorerUrl(txHash: string) {
  if (appConfig.chainId === 11155111) return `https://sepolia.etherscan.io/tx/${txHash}`;
  return `https://etherscan.io/tx/${txHash}`;
}

export function shortHash(value: string, left = 6, right = 4) {
  if (!value || value.length <= left + right) return value;
  return `${value.slice(0, left)}...${value.slice(-right)}`;
}
