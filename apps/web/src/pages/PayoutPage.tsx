import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Section } from "../components/Cards";
import { getDecryptedPayrollBalance } from "../lib/fheClient";
import { connectWallet, getActiveWalletAccount, getSavedWalletAccount } from "../lib/walletClient";

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
  if (/not allowed|ACL|user is not authorized/i.test(message)) return "Balance is not shared with this wallet.";
  return "Decrypt failed.";
}

export function PayoutPage() {
  const [account, setAccount] = useState<Address | null>(null);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [status, setStatus] = useState("Connect wallet to view balance.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const activeWallet = await getActiveWalletAccount();
      const saved = getSavedWalletAccount();
      if (!active) return;
      const nextAccount = activeWallet || saved;
      setAccount(nextAccount);
      setStatus(nextAccount ? "Ready." : "Connect wallet to view balance.");
    })();
    return () => {
      active = false;
    };
  }, []);

  const resolveConnectedWallet = async () => {
    const activeWallet = await getActiveWalletAccount();
    if (!activeWallet) {
      setAccount(null);
      setDecryptedBalance(null);
      setStatus("Connect wallet to view balance.");
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
      setAccount(wallet);
      setDecryptedBalance(null);
      setStatus("Ready.");
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

      setStatus("Confirm signature.");
      const value = await getDecryptedPayrollBalance(wallet);
      setDecryptedBalance(formatUsd(value));
      setStatus("Balance revealed.");
    } catch (error) {
      setStatus(getDecryptErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const actionLabel = !account ? "Connect wallet" : busy ? "Working..." : decryptedBalance ? "Reveal again" : "Reveal balance";
  const statusLabel = account ? status : "Connect wallet to view balance.";
  const primaryAction = account ? onDecrypt : onConnect;
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

  return (
    <Section title="Recipient portal">
      <div className="card portal-balance-card">
        <h3>Confidential balance</h3>
        <div className="detail-list">
          <div className="detail-row">
            <span className="detail-label">Wallet</span>
            <strong title={account || undefined}>{formatAddress(account)}</strong>
          </div>
          <div className="detail-row">
            <span className="detail-label">Balance</span>
            <strong>{decryptedBalance || "-"}</strong>
          </div>
        </div>
        <div className="cta-row">
          <span className={statusClassName}>{statusLabel}</span>
          <button className="button" onClick={primaryAction} disabled={busy}>
            {actionLabel}
          </button>
        </div>
      </div>
    </Section>
  );
}
