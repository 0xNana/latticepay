import { useEffect, useState } from "react";
import type { Address } from "viem";
import { Section } from "../components/Cards";
import { appConfig } from "../lib/config";
import { getDecryptedPayrollBalance } from "../lib/fheClient";
import { getSavedWalletAccount, getTokenObserver, setTokenObserver, waitForTxConfirmation } from "../lib/walletClient";

const TOKEN_DECIMALS = 6n;

function formatUsd(raw: bigint) {
  const base = 10n ** TOKEN_DECIMALS;
  const whole = raw / base;
  const frac = (raw % base).toString().padStart(Number(TOKEN_DECIMALS), "0").slice(0, 2);
  return `$${Number(whole).toLocaleString()}.${frac}`;
}

export function PayoutPage() {
  const [account, setAccount] = useState<Address | null>(null);
  const [observerEnabled, setObserverEnabled] = useState(false);
  const [decryptedBalance, setDecryptedBalance] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = getSavedWalletAccount();
    if (saved) setAccount(saved);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!account) {
        if (active) setObserverEnabled(false);
        return;
      }
      try {
        const observer = await getTokenObserver(account);
        if (!active) return;
        if (!appConfig.observerAddress) {
          setObserverEnabled(observer !== "0x0000000000000000000000000000000000000000");
        } else {
          setObserverEnabled(observer.toLowerCase() === appConfig.observerAddress.toLowerCase());
        }
      } catch {
        if (active) setObserverEnabled(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [account]);

  const onDecrypt = async () => {
    if (!account) {
      setStatus("No wallet session found. Log in first.");
      return;
    }
    if (!appConfig.observerAddress) {
      setStatus("Missing observer configuration.");
      return;
    }
    setBusy(true);
    setStatus(observerEnabled ? "Decrypting balance..." : "Enabling decrypt access...");
    try {
      if (!observerEnabled) {
        const txHash = await setTokenObserver(account, appConfig.observerAddress);
        await waitForTxConfirmation(txHash);
        setObserverEnabled(true);
      }
      const value = await getDecryptedPayrollBalance(account);
      if (value === null) {
        setDecryptedBalance("$0.00");
        setStatus("Decryption complete.");
      } else {
        setDecryptedBalance(formatUsd(value));
        setStatus("Decryption complete.");
      }
    } catch (error) {
      setStatus(`Decrypt failed: ${(error as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title="Portal" subtitle="Decrypt recipient balance.">
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Balance</h3>
          <p><strong>Wallet:</strong> {account || "Not connected"}</p>
          <p><strong>Encrypted balance:</strong> *****</p>
          <p><strong>Decrypted balance:</strong> {decryptedBalance || "-"}</p>
          {decryptedBalance ? <p><strong>Session:</strong> Decrypted for this session</p> : null}
          <div className="cta-row">
            <span>{status}</span>
            <button className="button" onClick={onDecrypt} disabled={busy || !account}>
              {busy ? "Working..." : "Decrypt"}
            </button>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Decrypt</h3>
          <ul className="list compact-list">
            <li>Wallet verified</li>
            <li>Hidden until approval</li>
            <li>Connected wallet only</li>
          </ul>
          {decryptedBalance ? (
            <div className="success-panel">
              <p style={{ margin: 0, fontWeight: 700 }}>Decrypted</p>
              <p style={{ margin: "6px 0 0" }}>Amount received: {decryptedBalance}</p>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
