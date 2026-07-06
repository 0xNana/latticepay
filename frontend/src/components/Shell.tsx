import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { PropsWithChildren } from "react";
import type { Address } from "viem";
import {
  claimPayrollTokens,
  connectWallet,
  getSavedWalletAccount,
  onSavedWalletAccountChange,
  saveWalletAccount
} from "../lib/walletClient";
import { checkRelayerCdnHealth } from "../lib/fheClient";
import { hasFaucetConfig } from "../lib/config";

type IconName = "home" | "payroll" | "audit" | "portal" | "menu" | "close" | "collapse" | "expand" | "faucet";

const nav = [
  {
    to: "/dashboard",
    label: "Home",
    icon: "home" as const,
    match: (pathname: string) => pathname === "/" || pathname.startsWith("/dashboard")
  },
  {
    to: "/payroll",
    label: "Payroll",
    icon: "payroll" as const,
    match: (pathname: string) => pathname.startsWith("/payroll")
  },
  {
    to: "/runs",
    label: "Audit",
    icon: "audit" as const,
    match: (pathname: string) => pathname.startsWith("/runs")
  },
  {
    to: "/portal",
    label: "Portal",
    icon: "portal" as const,
    match: (pathname: string) => pathname.startsWith("/portal") || pathname.startsWith("/payout")
  }
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "success" | "error" } | null>(null);
  const [walletAddress, setWalletAddress] = useState<Address | null>(null);
  const [showFaucetCard, setShowFaucetCard] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [faucetAmount, setFaucetAmount] = useState("$1000000");
  const [relayerHealthy, setRelayerHealthy] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const isAuthenticated = Boolean(walletAddress);
  const faucetConfigured = hasFaucetConfig();

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
    return onSavedWalletAccountChange(setWalletAddress);
  }, []);

  useEffect(() => {
    setSidebarCollapsed(window.localStorage.getItem("latticepay_sidebar_collapsed") === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem("latticepay_sidebar_collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    setMobileNavOpen(false);
    setShowFaucetCard(false);
    setWalletDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

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

  const onConnectWallet = async () => {
    setBusy(true);
    showToast("Connecting...", "info", 0);
    try {
      const address = await connectWallet();
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
    if (!faucetConfigured) {
      showToast("Faucet is not configured for this deployment.", "error");
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
    showToast("Starting faucet claim...", "info", 0);
    try {
      const result = await claimPayrollTokens(walletAddress, amountRaw.toString(), (step) => {
        const shortTx = `${step.txHash.slice(0, 10)}...`;
        if (step.type === "mint-submitted") showToast(`Mint submitted (${shortTx}).`, "info", 0);
        if (step.type === "mint-confirmed") showToast("Mint confirmed. Approving wrapper...", "info", 0);
        if (step.type === "approve-submitted") showToast(`Approval submitted (${shortTx}).`, "info", 0);
        if (step.type === "approve-confirmed") showToast("Approval confirmed. Wrapping confidential tokens...", "info", 0);
        if (step.type === "wrap-submitted") showToast(`Wrap submitted (${shortTx}).`, "info", 0);
      });
      showToast(`${truncateAddress(walletAddress)} | Faucet claim confirmed (${result.wrapTx.slice(0, 10)}...).`, "success");
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
    setWalletDropdownOpen(false);
    showToast("Disconnected.", "success");
  };

  const onOpenPortal = () => {
    setMobileNavOpen(false);
    setWalletDropdownOpen(false);
    navigate("/portal");
  };

  return (
    <div className={`app app-shell ${sidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="mobile-shell-header">
        <div className="mobile-shell-bar">
          <div className="mobile-brand-group">
            <button
              className="icon-button"
              type="button"
              aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((value) => !value)}
            >
              <NavIcon name={mobileNavOpen ? "close" : "menu"} />
            </button>
            <BrandLink compact={false} />
          </div>
        </div>
      </header>

      <aside className="app-sidebar" aria-label="Primary navigation">
        <div className="sidebar-brand-row">
          <BrandLink compact={sidebarCollapsed} />
          <button
            className="icon-button sidebar-toggle"
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            <NavIcon name={sidebarCollapsed ? "expand" : "collapse"} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => {
            const active = item.match(location.pathname);
            return (
              <SidebarLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                active={active}
                collapsed={sidebarCollapsed}
              />
            );
          })}
        </nav>
      </aside>

      {mobileNavOpen ? (
        <div className="mobile-nav-overlay">
          <button className="mobile-nav-scrim" type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)} />
          <aside className="mobile-nav-drawer" aria-label="Primary navigation">
            <div className="mobile-drawer-header">
              <BrandLink compact={false} />
              <button className="icon-button" type="button" aria-label="Close navigation menu" onClick={() => setMobileNavOpen(false)}>
                <NavIcon name="close" />
              </button>
            </div>
            <nav className="mobile-nav-list">
              {nav.map((item) => {
                const active = item.match(location.pathname);
                return (
                  <Link
                    key={item.to}
                    className={`mobile-nav-link ${active ? "is-active" : ""}`}
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <span className="mobile-nav-link-main">
                      <NavIcon name={item.icon} />
                      <span>
                        <span className="mobile-nav-link-label">{item.label}</span>
                      </span>
                    </span>
                    <span aria-hidden="true">-&gt;</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}

      <div className="content-shell">
        <header className="workspace-bar">
          <div className="workspace-context">
            <span>Workspace</span>
            <strong>Confidential payroll</strong>
          </div>
          <div className="workspace-actions">
            <HeaderFaucet
              busy={busy}
              open={showFaucetCard}
              faucetAmount={faucetAmount}
              walletConnected={isAuthenticated}
              faucetConfigured={faucetConfigured}
              onToggle={() => setShowFaucetCard((value) => !value)}
              onAmountChange={setFaucetAmount}
              onClaim={onFaucetTap}
            />
            <WalletDropdown
              walletAddress={walletAddress}
              busy={busy}
              open={walletDropdownOpen}
              relayerHealthy={relayerHealthy}
              onToggle={() => setWalletDropdownOpen((value) => !value)}
              onConnectWallet={onConnectWallet}
              onDisconnect={onDisconnect}
              onOpenPortal={onOpenPortal}
            />
          </div>
        </header>

        <main id="main-content" className="page">{children}</main>
      </div>

      {toast ? <div className={`toast toast-${toast.tone}`}>{toast.message}</div> : null}
    </div>
  );
}

type WalletDropdownProps = {
  walletAddress: Address | null;
  busy: boolean;
  open: boolean;
  relayerHealthy: boolean | null;
  onToggle: () => void;
  onConnectWallet: () => void;
  onDisconnect: () => void;
  onOpenPortal: () => void;
};

function WalletDropdown({
  walletAddress,
  busy,
  open,
  relayerHealthy,
  onToggle,
  onConnectWallet,
  onDisconnect,
  onOpenPortal
}: WalletDropdownProps) {
  const addressLabel = walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : null;

  return (
    <div className="wallet-dropdown">
      {walletAddress ? (
        <button
          className="wallet-trigger"
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={onToggle}
          disabled={busy}
        >
          <span className="wallet-trigger-dot" aria-hidden="true" />
          <span>{addressLabel}</span>
        </button>
      ) : (
        <button className="button ghost wallet-connect-button" onClick={onConnectWallet} disabled={busy}>Connect wallet</button>
      )}
      {open ? (
        <div className="wallet-menu" role="menu">
          <div className="wallet-menu-head">
            <span>Wallet</span>
            <strong>{walletAddress ? "Connected" : "Not connected"}</strong>
          </div>
          {walletAddress ? (
            <div className="wallet-account-row">
              <span>Account</span>
              <strong>{addressLabel}</strong>
            </div>
          ) : null}
          <div className="wallet-network-row">
            <span>Network</span>
            <strong>Sepolia</strong>
          </div>
          {relayerHealthy === false ? <span className="warning-chip wallet-warning">Relayer offline</span> : null}
          <div className="wallet-menu-actions">
            {walletAddress ? <button className="button ghost" onClick={onOpenPortal} disabled={busy}>Open portal</button> : null}
            {walletAddress ? <button className="button ghost" onClick={onDisconnect} disabled={busy}>Disconnect</button> : null}
            {!walletAddress ? <button className="button" onClick={onConnectWallet} disabled={busy}>Connect wallet</button> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BrandLink({ compact }: { compact: boolean }) {
  return (
    <Link className={`brand-link ${compact ? "is-compact" : ""}`} to="/dashboard" aria-label="Lattice Pay home" title={compact ? "Lattice Pay" : undefined}>
      <span className="brand-mark" aria-hidden="true">LP</span>
      <span className="brand-copy">
        <span className="brand-name">Lattice Pay</span>
        <span className="brand-subtitle">Confidential payroll</span>
      </span>
    </Link>
  );
}

type HeaderFaucetProps = {
  busy: boolean;
  open: boolean;
  faucetAmount: string;
  walletConnected: boolean;
  faucetConfigured: boolean;
  onToggle: () => void;
  onAmountChange: (value: string) => void;
  onClaim: () => void;
};

function HeaderFaucet({
  busy,
  open,
  faucetAmount,
  walletConnected,
  faucetConfigured,
  onToggle,
  onAmountChange,
  onClaim
}: HeaderFaucetProps) {
  return (
    <div className="header-faucet">
      <button
        className="faucet-trigger"
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
        disabled={busy}
      >
        <NavIcon name="faucet" />
        <span>Faucet</span>
      </button>
      {open ? (
        <div className="faucet-card header-faucet-card" role="menu">
          <input
            className="faucet-input"
            type="text"
            value={faucetAmount}
            onChange={(event) => onAmountChange(event.target.value)}
            disabled={busy}
            placeholder={`$ amount in ${TOKEN_SYMBOL} (max $${FAUCET_MAX_TOKENS.toLocaleString()})`}
          />
          {!faucetConfigured ? <span className="status-text status-text-warn">Faucet not configured.</span> : null}
          {!walletConnected ? <span className="status-text">Connect wallet first.</span> : null}
          <button className="button" onClick={onClaim} disabled={busy || !walletConnected || !faucetConfigured}>
            Claim
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon,
  active,
  collapsed
}: {
  to: string;
  label: string;
  icon: IconName;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      className={`sidebar-link ${active ? "is-active" : ""} ${collapsed ? "is-compact" : ""}`}
      to={to}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
    >
      <span className="sidebar-link-icon">
        <NavIcon name={icon} />
      </span>
      <span className="sidebar-link-copy">
        <span className="sidebar-link-label">{label}</span>
      </span>
    </Link>
  );
}

function NavIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, string[]> = {
    home: ["M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5Z"],
    payroll: ["M5 4h14v16H5V4Z", "M8 8h8", "M8 12h8", "M8 16h5"],
    audit: ["M6 4h9l3 3v13H6V4Z", "M14 4v4h4", "M9 13l2 2 4-5"],
    portal: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4 21a8 8 0 0 1 16 0"],
    menu: ["M4 7h16", "M4 12h16", "M4 17h16"],
    close: ["M6 6l12 12", "M18 6 6 18"],
    collapse: ["M15 6 9 12l6 6", "M19 5v14"],
    expand: ["M9 6l6 6-6 6", "M5 5v14"],
    faucet: ["M12 3c2.8 3.5 5 6.1 5 9a5 5 0 1 1-10 0c0-2.9 2.2-5.5 5-9Z"]
  };

  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
