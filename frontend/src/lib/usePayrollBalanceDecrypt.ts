import { useConfidentialBalance, useGrantPermit, useHasPermit } from "@zama-fhe/react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Address, Hex } from "viem";
import { zeroAddress } from "viem";
import { appConfig } from "./config";
import { getActiveWalletAccount, ensureSepoliaNetwork, publicClient } from "./walletClient";

const confidentialTokenAbi = [
  {
    type: "function",
    name: "confidentialBalanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }]
  }
] as const;

function isZeroHandle(value: Hex) {
  return /^0x0{64}$/i.test(value);
}

function formatShortAddress(value: Address) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

async function getConfidentialBalanceHandle(tokenAddress: Address, account: Address) {
  return publicClient.readContract({
    address: tokenAddress,
    abi: confidentialTokenAbi,
    functionName: "confidentialBalanceOf",
    args: [account]
  }) as Promise<Hex>;
}

function getDecryptErrorMessage(error: unknown) {
  const message = String((error as Error)?.message || error);
  if (/user rejected|rejected|denied|4001/i.test(message)) return "Request cancelled.";
  if (/no browser wallet|install metamask/i.test(message)) return "Wallet not found.";
  if (/failed to fetch|networkerror|load failed|temporarily disabled|sdk unavailable/i.test(message)) return "Decryption unavailable.";
  if (/missing .*token|missing vite_payroll/i.test(message)) return "Token not configured.";
  if (/permit|signature|signer|wallet client|account/i.test(message)) return "Authorize decryption failed.";
  if (/not allowed|ACL|not authorized|unauthorized|user decrypt/i.test(message)) return "Balance is not shared with this wallet.";
  return "Could not decrypt balance.";
}

type PayrollBalanceDecryptState = {
  rawBalance: bigint | null;
  status: string;
  busy: boolean;
  decrypt: () => Promise<bigint | null>;
};

export function usePayrollBalanceDecrypt(account: Address | null): PayrollBalanceDecryptState {
  const tokenAddress = appConfig.payrollToken;
  const [requested, setRequested] = useState(false);
  const [rawBalance, setRawBalance] = useState<bigint | null>(null);
  const [status, setStatus] = useState(account ? "Ready." : "Connect wallet.");
  const [manualBusy, setManualBusy] = useState(false);
  const [permitGranted, setPermitGranted] = useState(false);
  const contractAddresses = useMemo(() => (tokenAddress ? [tokenAddress] : []), [tokenAddress]);

  const permitQuery = useHasPermit({ contractAddresses });
  const hasPermit = Boolean(permitGranted || permitQuery.data);
  const grantPermit = useGrantPermit();
  const balanceQuery = useConfidentialBalance(
    {
      address: tokenAddress || zeroAddress,
      account: account || zeroAddress
    },
    {
      enabled: Boolean(requested && account && tokenAddress && hasPermit)
    }
  );

  const reset = useCallback(() => {
    setRequested(false);
    setRawBalance(null);
    setManualBusy(false);
    setStatus(account ? "Ready." : "Connect wallet.");
    setPermitGranted(false);
  }, [account]);

  useEffect(() => {
    reset();
  }, [account, reset]);

  useEffect(() => {
    if (typeof balanceQuery.data !== "bigint") return;
    setRawBalance(balanceQuery.data);
    setStatus("Revealed.");
    setManualBusy(false);
  }, [balanceQuery.data]);

  const decrypt = useCallback(async () => {
    if (!account) {
      setStatus("Connect wallet.");
      return null;
    }
    if (!tokenAddress) {
      setStatus("Token not configured.");
      return null;
    }

    setRawBalance(null);
    setManualBusy(true);
    setStatus(hasPermit ? "Decrypting." : "Authorize decryption.");

    try {
      await ensureSepoliaNetwork();

      const activeAccount = await getActiveWalletAccount();
      if (!activeAccount) {
        setStatus("Connect wallet.");
        return null;
      }
      if (activeAccount.toLowerCase() !== account.toLowerCase()) {
        setStatus(`Switch wallet to ${formatShortAddress(account)}.`);
        return null;
      }

      const handle = await getConfidentialBalanceHandle(tokenAddress, account);
      if (isZeroHandle(handle)) {
        setRawBalance(0n);
        setStatus("Revealed.");
        return 0n;
      }

      if (!hasPermit) {
        await grantPermit.mutateAsync(contractAddresses);
        setPermitGranted(true);
      }
      setRequested(true);
      setStatus("Decrypting.");
      const result = await balanceQuery.refetch({ throwOnError: true });
      const value = typeof result.data === "bigint" ? result.data : null;
      if (value !== null) {
        setRawBalance(value);
        setStatus("Revealed.");
      }
      return value;
    } catch (error) {
      setStatus(getDecryptErrorMessage(error));
      return null;
    } finally {
      setManualBusy(false);
    }
  }, [account, balanceQuery, contractAddresses, grantPermit, hasPermit, tokenAddress]);

  return {
    rawBalance,
    status,
    busy: manualBusy || grantPermit.isPending || balanceQuery.isLoading || balanceQuery.isFetching,
    decrypt
  };
}
