import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Stat } from "../components/Cards";
import { usePayrollBalanceDecrypt } from "../lib/usePayrollBalanceDecrypt";
import {
  findRecipientPayment,
  getAuditPayrollRun,
  getWalletUserProfile
} from "../lib/payrollRunStore";
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

function getConnectErrorMessage(error: unknown) {
  const message = String((error as Error)?.message || error);
  if (/user rejected|rejected|denied|4001/i.test(message)) return "Request cancelled.";
  if (/no browser wallet|install metamask/i.test(message)) return "Wallet not found.";
  return "Connect failed.";
}

export function PayoutPage() {
  const run = getAuditPayrollRun();
  const [account, setAccount] = useState<Address | null>(null);
  const [status, setStatus] = useState("Connect wallet.");
  const [busy, setBusy] = useState(false);
  const balanceDecrypt = usePayrollBalanceDecrypt(account);
  const profile = getWalletUserProfile(account);
  const recipientPayment = findRecipientPayment(account, run.payments);
  const hasLoadedRun = run.payments.length > 0;
  const confirmedRun = run.executionState?.status === "confirmed";

  const syncAccount = (nextAccount: Address | null) => {
    setAccount(nextAccount);
    setStatus(nextAccount ? "Ready." : "Connect wallet.");
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
      setStatus("Connect wallet.");
      return null;
    }

    if (!account || activeWallet.toLowerCase() !== account.toLowerCase()) {
      setAccount(activeWallet);
    }

    return activeWallet;
  };

  const onConnect = async () => {
    setBusy(true);
    try {
      const wallet = await connectWallet();
      syncAccount(wallet);
    } catch (error) {
      setStatus(getConnectErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const onDecrypt = async () => {
    setBusy(true);
    try {
      const wallet = await resolveConnectedWallet();
      if (!wallet) return;
      if (!account || wallet.toLowerCase() !== account.toLowerCase()) {
        setStatus("Ready.");
        return;
      }
      await balanceDecrypt.decrypt();
    } finally {
      setBusy(false);
    }
  };

  const decryptedBalance = balanceDecrypt.rawBalance !== null ? formatUsd(balanceDecrypt.rawBalance) : null;
  const actionLabel = !account ? "Connect wallet" : busy || balanceDecrypt.busy ? "Working..." : decryptedBalance ? "Reveal again" : "Reveal balance";
  const statusLabel = account ? balanceDecrypt.status : status;
  const primaryAction = account ? onDecrypt : onConnect;
  const primaryBusy = busy || balanceDecrypt.busy;
  const normalizedStatus = statusLabel.toLowerCase();
  const statusClassName = decryptedBalance
    ? "status-text status-text-good"
    : normalizedStatus.includes("failed") ||
        normalizedStatus.includes("unavailable") ||
        normalizedStatus.includes("cancelled") ||
        normalizedStatus.includes("not configured") ||
        normalizedStatus.includes("not found")
      ? "status-text status-text-warn"
      : "status-text";

  const runStatus = !hasLoadedRun ? "None" : confirmedRun ? "Confirmed" : "Pending";
  const paymentStatus = recipientPayment?.status || (hasLoadedRun ? "Not in run" : "—");
  const heroPill = recipientPayment ? recipientPayment.role : account ? "Connected" : "Sepolia portal";

  return (
    <div className="landing-stack portal-dashboard">
      <section className="landing-hero portal-hero" aria-labelledby="portal-title">
        <div className="hero-content">
          <span className="hero-pill">{heroPill}</span>
          <h1 id="portal-title">{profile.name || "Recipient portal"}</h1>
          <p>{profile.description}</p>
          <div className="hero-actions portal-hero-actions">
            <button className="button hero-button" onClick={primaryAction} disabled={primaryBusy}>
              {actionLabel}
            </button>
            <span className={statusClassName}>{statusLabel}</span>
          </div>
        </div>

        <div className="hero-status-panel" aria-label="Portal status">
          <div className="hero-status-head">
            <span>Balance</span>
            <strong>{decryptedBalance || "Hidden"}</strong>
          </div>
          <div className="hero-metrics" aria-label="Portal summary">
            <div>
              <span>Wallet</span>
              <strong title={account || undefined}>{formatAddress(account)}</strong>
            </div>
            <div>
              <span>Run</span>
              <strong>{runStatus}</strong>
            </div>
            <div>
              <span>Payment</span>
              <strong>{recipientPayment?.amountDisplay || "—"}</strong>
            </div>
          </div>
          <div className="hero-status-list" aria-label="Payroll context">
            <div>
              <span>Company</span>
              <strong>{run.companyName || "—"}</strong>
            </div>
            <div>
              <span>Cycle</span>
              <strong>{run.cycleName || "—"}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{paymentStatus}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="grid-3 portal-stats" aria-label="Portal details">
        <Stat label="Recipient ID" value={recipientPayment?.id || "—"} />
        <Stat label="Network" value={run.network || "Sepolia"} />
        <Stat label="Currency" value={run.currency || "USDC"} />
      </section>
    </div>
  );
}
