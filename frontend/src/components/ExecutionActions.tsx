import { useState } from "react";
import type { Address } from "viem";
import { decodeEventLog } from "viem";
import { appConfig } from "../lib/config";
import { getTxExplorerUrl, shortHash } from "../lib/explorer";
import {
  connectWallet,
  getSavedWalletAccount,
  isExecutorOperator,
  saveWalletAccount,
  setExecutorOperator,
  waitForTxConfirmation
} from "../lib/walletClient";
import { encryptPayrollAmounts } from "../lib/fheClient";
import { executePayrollWithIntent } from "../lib/payrollExecution";
import { payrollExecutorAbi } from "../lib/contracts/payrollExecutorAbi";
import { getActivePayrollRun, markPaymentsStatus, setPaymentResults, updateExecutionState } from "../lib/payrollRunStore";

export function ExecutionActions() {
  const run = getActivePayrollRun();
  const [account, setAccount] = useState<Address | null>(() => getSavedWalletAccount());
  const [status, setStatus] = useState<string>("Idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [terminalLines, setTerminalLines] = useState<string[]>(["Private DAO Payroll - Processing"]);
  const [techLines, setTechLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const writeLine = (line: string) => {
    const stamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setTerminalLines((prev) => [...prev.slice(-20), `[${stamp}] ${line}`]);
  };
  const writeTech = (line: string) => {
    const stamp = new Date().toLocaleTimeString("en-US", { hour12: false });
    setTechLines((prev) => [...prev.slice(-40), `[${stamp}] ${line}`]);
  };
  const short = (value: string) => (value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value);
  const formatTokenAmount = (raw: bigint, decimals = 6, symbol = "cUSDC") => {
    const base = 10n ** BigInt(decimals);
    const whole = raw / base;
    const fraction = (raw % base).toString().padStart(decimals, "0").replace(/0+$/, "");
    return `${whole.toString()}${fraction ? `.${fraction}` : ""} ${symbol}`;
  };

  const onConnect = async () => {
    setBusy(true);
    setStatus("Connecting wallet...");
    writeLine("> connecting wallet...");
    try {
      const address = await connectWallet();
      if (!address) throw new Error("No wallet account returned.");
      setAccount(address as Address);
      saveWalletAccount(address as Address);
      setStatus(`Connected: ${address}`);
      writeLine(`ok connected ${address}`);
    } catch (error) {
      setStatus(`Connect failed: ${(error as Error).message}`);
      writeLine(`err ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const onExecute = async () => {
    if (!account) {
      setStatus("Connect account first.");
      writeLine("err connect account first");
      return;
    }
    setBusy(true);
    setTxHash(null);
    setTechLines([]);
    updateExecutionState({ status: "idle", error: undefined });
    markPaymentsStatus("Pending");
    setStatus("Initializing DAO payroll file...");
    const total = [...run.execution.clearAmounts].reduce((acc, n) => acc + BigInt(n), 0n);
    writeLine("Initializing DAO payroll file (ISO 20022)...");
    writeLine("Payroll payload prepared");
    writeLine("Verifying payer account...");
    writeLine(`Account verified (${short(account)})`);
    writeLine("Private payroll summary");
    writeLine(`- Contributors: ${run.execution.recipients.length}`);
    writeLine(`- Total amount: ${formatTokenAmount(total)}`);
    writeLine("Network");
    writeLine(`- Environment: Sepolia (${appConfig.chainId})`);
    writeTech(`account=${account}`);
    writeTech(`executor=${appConfig.payrollExecutor || "unset"}`);
    writeTech(`token=${appConfig.payrollToken || "unset"}`);
    writeTech(`totalRaw=${total.toString()}`);
    setStatus("Preparing execution environment...");
    writeLine("Preparing execution environment...");
    writeLine(`Executor configured (${short(appConfig.payrollExecutor || "unset")})`);
    writeLine(`Settlement token configured (${short(appConfig.payrollToken || "unset")})`);
    try {
      if (!appConfig.payrollExecutor) throw new Error("Missing VITE_PAYROLL_EXECUTOR_ADDRESS.");
      const alreadyOperator = await isExecutorOperator(account, appConfig.payrollExecutor);
      if (!alreadyOperator) {
        const until = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
        writeLine("Authorizing payout permissions...");
        const opTx = await setExecutorOperator(account, appConfig.payrollExecutor, until);
        writeLine(`Operator authorization submitted (${short(opTx)})`);
        writeTech(`operatorTx=${opTx}`);
        await waitForTxConfirmation(opTx);
        writeLine("Payout permission confirmed");
      } else {
        writeLine("Payout permission already active");
      }
    } catch (error) {
      setStatus("Payroll run failed");
      writeLine("Payroll run failed");
      writeLine("The run could not be completed.");
      writeLine(`Reason: ${(error as Error).message}`);
      writeLine("Review the draft and retry.");
      setBusy(false);
      return;
    }
    setStatus("Encrypting payroll data...");
    writeLine("Encrypting payroll data...");
    try {
      const encrypted = await encryptPayrollAmounts(account, [...run.execution.clearAmounts]);
      writeLine("Confidential inputs encrypted");
      writeLine(`Secure proofs generated (${encrypted.inputProofs.length})`);
      writeTech(`encryptedHandles=${encrypted.encryptedAmounts.length}`);
      writeTech(`firstHandle=${encrypted.encryptedAmounts[0] || "none"}`);
      writeTech(`firstProofSize=${encrypted.inputProofs[0]?.length || 0}`);
      setStatus("Submitting payroll run...");
      writeLine("Submitting payroll run...");
      writeLine("Contributor payments batched");
      writeLine("Submitting transaction to network...");
      const result = await executePayrollWithIntent({
        smartAccount: account,
        recipients: [...run.execution.recipients] as Address[],
        encryptedAmounts: encrypted.encryptedAmounts,
        inputProofs: encrypted.inputProofs,
        onLog: (line) => writeTech(line)
      });
      setStatus(result.note);
      writeLine("Transaction submitted");
      writeTech(`runId=${result.runId}`);
      if (result.txHash) {
        setTxHash(result.txHash);
        writeTech(`txHash=${result.txHash}`);
        updateExecutionState({
          status: "submitted",
          runId: result.runId,
          txHash: result.txHash,
          submittedAt: new Date().toISOString(),
          error: undefined
        });
        markPaymentsStatus("Processing");
        writeLine("Awaiting network confirmation...");
        writeLine(`Transaction hash: ${result.txHash}`);
        const receipt = await waitForTxConfirmation(result.txHash);
        writeLine(`Confirmed in block ${receipt.blockNumber.toString()}`);
        writeTech(`block=${receipt.blockNumber.toString()}`);
        writeTech(`receiptStatus=${receipt.status}`);
        const outcomes: boolean[] = Array(run.execution.recipients.length).fill(false);
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: payrollExecutorAbi,
              data: log.data,
              topics: log.topics
            });
            if (decoded.eventName !== "PayrollPaymentProcessed") continue;
            const args = decoded.args as { runId: string; index: bigint; success: boolean };
            if (args.runId.toLowerCase() !== result.runId.toLowerCase()) continue;
            outcomes[Number(args.index)] = Boolean(args.success);
          } catch {
            // Ignore non-executor logs.
          }
        }
        setPaymentResults(outcomes);
        const okCount = outcomes.filter(Boolean).length;
        writeLine("Private payroll run completed");
        writeLine(`- Run ID: ${result.runId}`);
        writeLine(`- Successful contributor payments: ${okCount}`);
        writeLine(`- Failed payments: ${outcomes.length - okCount}`);
        updateExecutionState({
          status: "confirmed",
          runId: result.runId,
          txHash: result.txHash,
          blockNumber: receipt.blockNumber.toString(),
          confirmedAt: new Date().toISOString(),
          error: undefined
        });
        markPaymentsStatus("Completed");
        if (receipt.effectiveGasPrice) {
          const gwei = Number(receipt.effectiveGasPrice) / 1e9;
          writeLine(`- Gas price: ${gwei.toFixed(2)} Gwei`);
          writeTech(`effectiveGasPriceWei=${receipt.effectiveGasPrice.toString()}`);
        }
      }
    } catch (error) {
      setStatus("Payroll run failed");
      writeLine("Payroll run failed");
      writeLine("The payroll run could not be completed.");
      writeLine(`Reason: ${(error as Error).message}`);
      writeLine("You may review the draft and retry the run.");
      writeTech(`error=${(error as Error).message}`);
      updateExecutionState({
        status: "failed",
        error: (error as Error).message
      });
      markPaymentsStatus("Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="terminal-panel">
      <div className="terminal-head">Private Payroll Execution</div>
      <div className="terminal-meta">
        <p><strong>Account:</strong> {account || "not connected"}</p>
        <p><strong>Status:</strong> {status}</p>
        {txHash ? (
          <p>
            <strong>Tx:</strong>{" "}
            <a href={getTxExplorerUrl(txHash)} target="_blank" rel="noreferrer">
              {shortHash(txHash)}
            </a>
          </p>
        ) : null}
      </div>
      <pre className="terminal-body">{terminalLines.join("\n")}</pre>
      <details>
        <summary>Technical details</summary>
        <pre className="terminal-body" style={{ marginTop: 8, minHeight: 100 }}>
          {techLines.length ? techLines.join("\n") : "No technical details captured yet."}
        </pre>
      </details>
      <div className="cta-row">
        {!account ? <button className="button ghost" onClick={onConnect} disabled={busy}>Connect wallet</button> : null}
        <button className="button button-run-payroll" onClick={onExecute} disabled={busy || !account}>Run Private Payroll</button>
      </div>
    </div>
  );
}
