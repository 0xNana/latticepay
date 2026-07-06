import type { Address, Hex } from "viem";
import { encodeFunctionData, keccak256, toHex } from "viem";
import { appConfig, hasExecutionConfig } from "./config";
import { ensureSepoliaNetwork, getActiveWalletAccount, publicClient, walletClient } from "./walletClient";
import { payrollExecutorAbi } from "./contracts/payrollExecutorAbi";

type ExecuteParams = {
  smartAccount: Address;
  recipients: Address[];
  encryptedAmounts: Hex[];
  inputProofs: Hex[];
  onLog?: (line: string) => void;
};

export async function executePayrollWithIntent(params: ExecuteParams) {
  const hexBytes = (value: Hex) => Math.max(0, (value.length - 2) / 2);
  const log = (...args: unknown[]) => {
    if (appConfig.walletDebug) console.debug("[payroll:execute]", ...args);
    if (params.onLog) {
      const line = args
        .map((arg) => (typeof arg === "string" ? arg : JSON.stringify(arg)))
        .join(" ");
      params.onLog(line);
    }
  };

  if (params.recipients.length === 0) throw new Error("No recipients to execute.");
  if (params.recipients.length !== params.encryptedAmounts.length || params.recipients.length !== params.inputProofs.length) {
    throw new Error("Array length mismatch: recipients, encryptedAmounts, inputProofs.");
  }
  if (params.inputProofs.some((p) => p === "0x")) throw new Error("All input proofs must be non-empty.");

  if (!hasExecutionConfig()) {
    return {
      mocked: true,
      runId: keccak256(toHex(`dryrun-${Date.now()}`)),
      txHash: null,
      note: "Set VITE_PAYROLL_EXECUTOR_ADDRESS and VITE_PAYROLL_TOKEN_ADDRESS to enable onchain execution."
    };
  }

  const payrollExecutor = appConfig.payrollExecutor!;
  const payrollToken = appConfig.payrollToken!;
  const proofBytesTotal = params.inputProofs.reduce((sum, proof) => sum + hexBytes(proof), 0);
  const proofBytesAvg = params.inputProofs.length ? Math.round(proofBytesTotal / params.inputProofs.length) : 0;
  const handleBytesTotal = params.encryptedAmounts.reduce((sum, handle) => sum + hexBytes(handle), 0);
  log("checking active wallet account...");
  const activeAccount = await getActiveWalletAccount();
  if (!activeAccount) {
    throw new Error("No active wallet account. Please connect your wallet again.");
  }
  if (activeAccount.toLowerCase() !== params.smartAccount.toLowerCase()) {
    throw new Error(
      `Account mismatch. Active wallet account is ${activeAccount}, but execution requested ${params.smartAccount}. Please reconnect your wallet from the execution panel.`
    );
  }

  log("start", {
    walletAccount: activeAccount,
    payrollExecutor,
    payrollToken,
    paymentCount: params.recipients.length,
    mode: "wallet_direct"
  });
  log("fhe_payload", {
    payments: params.recipients.length,
    handleBytesTotal,
    proofBytesTotal,
    proofBytesAvg
  });

  let txHash: Hex;
  let runId: Hex = keccak256(toHex(`${activeAccount}-${Date.now()}`));
  try {
    await ensureSepoliaNetwork();
    const nonce = (await publicClient.readContract({
      address: payrollExecutor,
      abi: payrollExecutorAbi,
      functionName: "nonces",
      args: [activeAccount]
    })) as bigint;
    const validUntil = Math.floor(Date.now() / 1000) + 600;
    runId = keccak256(toHex(`${activeAccount}-${nonce.toString()}-${Date.now()}`));
    const calldata = encodeFunctionData({
      abi: payrollExecutorAbi,
      functionName: "executePayroll",
      args: [
        runId,
        payrollToken,
        activeAccount,
        params.recipients,
        params.encryptedAmounts,
        params.inputProofs,
        validUntil,
        nonce
      ]
    });
    log("aa_payload", {
      calldataBytes: hexBytes(calldata),
      recipientCount: params.recipients.length
    });

    log("simulating direct submission...");
    await publicClient.simulateContract({
      account: activeAccount,
      address: payrollExecutor,
      abi: payrollExecutorAbi,
      functionName: "executePayroll",
      args: [
        runId,
        payrollToken,
        activeAccount,
        params.recipients,
        params.encryptedAmounts,
        params.inputProofs,
        validUntil,
        nonce
      ]
    });
    log("simulation ok");
    txHash = await walletClient.writeContract({
      account: activeAccount,
      chain: walletClient.chain,
      address: payrollExecutor,
      abi: payrollExecutorAbi,
      functionName: "executePayroll",
      args: [
        runId,
        payrollToken,
        activeAccount,
        params.recipients,
        params.encryptedAmounts,
        params.inputProofs,
        validUntil,
        nonce
      ]
    });
    log("submitted directly via wallet", { txHash, runId });
  } catch (error) {
    const err = error as { message?: string; cause?: unknown; details?: unknown };
    console.error("[payroll:execute] submission failed", {
      message: err?.message,
      details: err?.details,
      cause: err?.cause,
      raw: error
    });
    throw error;
  }

  return {
    mocked: false,
    runId,
    txHash,
    note: "Execution submitted directly from connected wallet."
  };
}
