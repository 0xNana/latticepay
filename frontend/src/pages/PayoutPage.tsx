import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Section } from "../components/Cards";
import { getDecryptedPayrollBalance } from "../lib/fheClient";
import { getAuditPayrollRun, type PayrollPaymentDraft } from "../lib/payrollRunStore";
import { connectWallet, getActiveWalletAccount, getSavedWalletAccount, onSavedWalletAccountChange } from "../lib/walletClient";

const TOKEN_DECIMALS = 6n;

function formatUsd(raw: bigint) {
  const base = 10n ** TOKEN_DECIMALS;
  const whole = raw / base;
  const frac = (raw % base).toString().padStart(Number(TOKEN_DECIMALS), "0").slice(0, 2);
  return `$${Number(whole).toLocaleString()}.${frac}`;
}

function formatAddress(address: Address | null) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getDecryptErrorMessage(error: unknown) {
  const message = String((error as Error)?.message || error);
  if (/user rejected|rejected|denied|4001/i.test(message)) return "Request cancelled.";
  if (/no browser wallet|install metamask/i.test(message)) return "Wallet not found.";
  if (/failed to fetch|networkerror|load failed|temporarily disabled|cdn unavailable/i.test(message)) return "Decryption unavailable.";
  if (/missing .*token|missing vite_payroll/i.test(message)) return "Token not configured.";
  if (/not allowed|ACL|not authorized|unauthorized|persistAllowed|user decrypt/i.test(message)) {
    return "Balance is not shared with this wallet.";
  }
  return "Decrypt failed.";
}

function findRecipientPayment(account: Address | null, payments: PayrollPaymentDraft[]) {
  if (!account) return null;
  const normalized = account.toLowerCase();
  return payments.find((payment) => payment.recipient.toLowerCase() === normalized) || null;
}

export function PayoutPage() {
  const run = getAuditPayrollRun();
  const [account, setAccount] = useState<Address | null>(null);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [status, setStatus] = useState("Connect wallet.");
  const [busy, setBusy] = useState(false);
  const recipientPayment = findRecipientPayment(account, run.payments);
  const hasLoadedRun = run.payments.length > 0;
  const isRunRecipient = Boolean(recipientPayment);
  const confirmedRun = run.executionState?.status === "confirmed";

  const syncAccount = (nextAccount: Address | null) => {
    setAccount(nextAccount);
    setDecryptedBalance(null);
    const payment = findRecipientPayment(nextAccount, run.payments);
    setStatus(
      nextAccount
        ? hasLoadedRun && !payment
          ? "Not a recipient."
          : "Ready."
        : "Connect wallet."
    );
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const activeWallet = await getActiveWalletAccount();
      const saved = getSavedWalletAccount();
      if (!active) return;
      syncAccount(activeWallet || saved);
    })();
    const unsubscribe = onSavedWalletAccountChange(syncAccount);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const resolveConnectedWallet = async () => {
    const activeWallet = await getActiveWalletAccount();
    if (!activeWallet) {
      setAccount(null);
      setDecryptedBalance(null);
      setStatus("Connect wallet.");
      return null;
    }

    if (!account || activeWallet.toLowerCase() !== account.toLowerCase()) {
      setAccount(activeWallet);
      setDecryptedBalance(null);
    }

    return activeWallet;
  };

  const onConnect = async () => {
    setBusy(true);
    try {
      const wallet = await connectWallet();
      syncAccount(wallet);
    } catch (error) {
      setStatus(getDecryptErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const onDecrypt = async () => {
    setBusy(true);
    setDecryptedBalance(null);
    try {
      const wallet = await resolveConnectedWallet();
      if (!wallet) return;
      const payment = findRecipientPayment(wallet, run.payments);
      if (hasLoadedRun && !payment) {
        setStatus("Not a recipient.");
        return;
      }

      setStatus("Sign request.");
      const value = await getDecryptedPayrollBalance(wallet);
      setDecryptedBalance(formatUsd(value));
      setStatus("Revealed.");
    } catch (error) {
      setStatus(getDecryptErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const canReveal = !hasLoadedRun || isRunRecipient;
  const actionLabel = !account ? "Connect" : busy ? "Working..." : decryptedBalance ? "Reveal again" : "Reveal";
  const statusLabel = account
    ? status
    : "Connect wallet.";
  const primaryAction = account ? onDecrypt : onConnect;
  const normalizedStatus = statusLabel.toLowerCase();
  const statusClassName = decryptedBalance
    ? "status-text status-text-good"
    : normalizedStatus.includes("failed") ||
        normalizedStatus.includes("unavailable") ||
        normalizedStatus.includes("cancelled") ||
        normalizedStatus.includes("not configured") ||
        normalizedStatus.includes("not found") ||
        normalizedStatus.includes("not a recipient")
      ? "status-text status-text-warn"
      : "status-text";

  return (
    <Section title="Portal">
      <div className="card portal-balance-card">
        <h3>Balance</h3>
        <div className="detail-list">
          <div className="detail-row">
            <span className="detail-label">Wallet</span>
            <strong title={account || undefined}>{formatAddress(account)}</strong>
          </div>
          <div className="detail-row">
            <span className="detail-label">Recipient</span>
            <strong>{recipientPayment?.name || (hasLoadedRun ? "No match" : "Any holder")}</strong>
          </div>
          <div className="detail-row">
            <span className="detail-label">Run</span>
            <strong>{hasLoadedRun ? (confirmedRun ? "Confirmed" : "Pending") : "None"}</strong>
          </div>
          <div className="detail-row">
            <span className="detail-label">Balance</span>
            <strong>{decryptedBalance || "Hidden"}</strong>
          </div>
        </div>
        <div className="cta-row">
          <span className={statusClassName}>{statusLabel}</span>
          <button className="button" onClick={primaryAction} disabled={busy || (Boolean(account) && !canReveal)}>
            {actionLabel}
          </button>
        </div>
      </div>
    </Section>
  );
}
