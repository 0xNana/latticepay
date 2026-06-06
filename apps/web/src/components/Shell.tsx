import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import type { Address } from "viem";
import {
  claimPayrollTokens,
  getSavedWalletAccount,
  loginUser,
  saveWalletAccount,
  waitForTxConfirmation
} from "../lib/walletClient";
import { checkRelayerCdnHealth } from "../lib/fheClient";

const nav = [
  { to: "/dashboard", label: "Home" },
  { to: "/payroll/draft", label: "Payroll" },
  { to: "/runs", label: "Audit" },
  { to: "/payout", label: "Portal" },
];
const TOKEN_DECIMALS = 6n;
const TOKEN_SYMBOL = "cUSDC";
const FAUCET_MAX_TOKENS = 1000000;

const toRawAmount = (value: string): bigint => {
  const normalized = value.trim().replace(/\$/g, "").replace(/,/g, "");
  if (!normalized) throw new Error("Enter an amount.");
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error("Invalid amount format.");
  const [whole, frac = ""] = normalized.split(".");
  const fracPadded = (frac + "0".repeat(Number(TOKEN_DECIMALS))).slice(0, Number(TOKEN_DECIMALS));
  return BigInt(`${whole}${fracPadded}`);
};

export function Shell({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "success" | "error" } | null>(null);
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [showFaucetCard, setShowFaucetCard] = useState(false);
  const [faucetAmount, setFaucetAmount] = useState("$1000000");
  const [relayerHealthy, setRelayerHealthy] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const isAuthenticated = Boolean(walletAddress);

  const showToast = (message: string, tone: "info" | "success" | "error" = "info", timeoutMs = 3500) => {
    setToast({ message, tone });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (timeoutMs > 0) {
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
        toastTimerRef.current = null;
      }, timeoutMs);
    }
  };

  useEffect(() => {
    const saved = getSavedWalletAccount();
    if (saved) setWalletAddress(saved);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const healthy = await checkRelayerCdnHealth();
      if (alive) setRelayerHealthy(healthy);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  const truncateAddress = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

  const onLogin = async () => {
    setBusy(true);
    showToast("Connecting...", "info", 0);
    try {
      const address = await loginUser();
      if (!address) throw new Error("No account returned.");
      setWalletAddress(address as Address);
      saveWalletAccount(address as Address);
      showToast("Connected.", "success");
    } catch (error) {
      showToast(`Connection failed: ${(error as Error).message}`, "error", 5000);
    } finally {
      setBusy(false);
    }
  };

  const onFaucetTap = async () => {
    if (!walletAddress) {
      showToast("Connect a payroll wallet before faucet claim.", "error");
      return;
    }
    let amountRaw: bigint;
    try {
      amountRaw = toRawAmount(faucetAmount);
    } catch (error) {
      showToast((error as Error).message, "error");
      return;
    }
    const maxRaw = BigInt(FAUCET_MAX_TOKENS) * 10n ** TOKEN_DECIMALS;
    if (amountRaw <= 0n) {
      showToast("Enter an amount greater than 0.", "error");
      return;
    }
    if (amountRaw > maxRaw) {
      showToast(`Max faucet claim is ${FAUCET_MAX_TOKENS.toLocaleString()} ${TOKEN_SYMBOL}.`, "error");
      return;
    }
    setBusy(true);
    showToast("Requesting faucet claim...", "info", 0);
    try {
      const claimId = await claimPayrollTokens(walletAddress, amountRaw.toString());
      showToast(`${truncateAddress(walletAddress)} | Faucet tx submitted (${claimId.slice(0, 10)}...). Confirming...`, "info", 0);
      await waitForTxConfirmation(claimId);
      showToast(`${truncateAddress(walletAddress)} | Faucet claim confirmed.`, "success");
      setShowFaucetCard(false);
    } catch (error) {
      showToast(`Faucet claim failed: ${(error as Error).message}`, "error", 5000);
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = () => {
    setWalletAddress(null);
    saveWalletAccount(null);
    setShowFaucetCard(false);
    showToast("Disconnected.", "success");
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand">cPay</div>
          <span>DAO payroll</span>
        </div>
        <button
          className="nav-toggle"
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={mobileNavOpen}
        >
          ☰
        </button>
        <nav className={mobileNavOpen ? "nav open" : "nav"}>
          {nav.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                className={active ? "nav-link active" : "nav-link"}
                to={item.to}
                onClick={() => setMobileNavOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="auth-actions">
          <div className="faucet-wrap">
            <button className="button ghost" onClick={() => setShowFaucetCard((v) => !v)} disabled={busy}>
              <span className="faucet-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3c2.8 3.5 5 6.1 5 9a5 5 0 1 1-10 0c0-2.9 2.2-5.5 5-9Z" />
                </svg>
              </span>
              Faucet
            </button>
            {showFaucetCard ? (
              <div className="faucet-card">
                <input
                  className="faucet-input"
                  type="text"
                  value={faucetAmount}
                  onChange={(event) => setFaucetAmount(event.target.value)}
                  disabled={busy}
                  placeholder={`$ amount in ${TOKEN_SYMBOL} (max $${FAUCET_MAX_TOKENS.toLocaleString()})`}
                />
                <button className="button" onClick={onFaucetTap} disabled={busy}>
                  Claim
                </button>
              </div>
            ) : null}
          </div>
          {!isAuthenticated ? <button className="button ghost" onClick={onLogin} disabled={busy}>Connect wallet</button> : null}
          {isAuthenticated ? (
            <button
              className="address-chip"
              disabled={busy}
              title="Open contributor portal"
              onClick={() => navigate("/payout")}
            >
              {truncateAddress(walletAddress!)}
            </button>
          ) : null}
          {isAuthenticated ? (
            <button className="button ghost" onClick={onDisconnect} disabled={busy}>
              Disconnect
            </button>
          ) : null}
          {relayerHealthy === false ? (
            <span className="warning-chip" title="Relayer SDK CDN is unreachable">
              Relayer offline
            </span>
          ) : null}
        </div>
      </header>
      <main className="page">{children}</main>
      {toast ? <div className={`toast toast-${toast.tone}`}>{toast.message}</div> : null}
    </div>
  );
}
