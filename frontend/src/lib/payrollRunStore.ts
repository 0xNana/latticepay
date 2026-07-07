import type { Address } from "viem";

const STORAGE_KEY = "latticepay_payroll_run";
const AUDIT_STORAGE_KEY = "latticepay_latest_audited_payroll_run";

export type PayrollPaymentDraft = {
  id: string;
  role: string;
  name: string;
  recipient: Address;
  amountMinor: bigint;
  amountDisplay: string;
  status: string;
};

export type PayrollRunDraft = {
  companyName: string;
  runId: string;
  cycleName: string;
  network: string;
  currency: string;
  createdAt: string;
  payments: PayrollPaymentDraft[];
  execution: {
    recipients: Address[];
    clearAmounts: bigint[];
  };
  stats: {
    employees: number;
    totalMinor: bigint;
    totalDisplay: string;
  };
  executionState?: {
    status: "idle" | "submitted" | "confirmed" | "failed";
    runId?: string;
    txHash?: string;
    blockNumber?: string;
    submittedAt?: string;
    confirmedAt?: string;
    error?: string;
  };
};

function formatMinor(minor: bigint, decimals: number, ccy: string) {
  const base = 10n ** BigInt(decimals);
  const whole = minor / base;
  const frac = (minor % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return `${ccy} ${whole.toString()}${frac ? `.${frac}` : ""}`;
}

function buildDefaultRun(): PayrollRunDraft {
  return {
    companyName: "",
    runId: "",
    cycleName: "Payroll Draft",
    network: "Sepolia",
    currency: "USDC",
    createdAt: new Date().toISOString(),
    payments: [],
    execution: {
      recipients: [],
      clearAmounts: []
    },
    stats: {
      employees: 0,
      totalMinor: 0n,
      totalDisplay: formatMinor(0n, 6, "USDC")
    },
    executionState: { status: "idle" }
  };
}

type SerializedPayrollPayment = Omit<PayrollPaymentDraft, "amountMinor"> & { amountMinor: string };

type SerializedPayrollRun = Omit<PayrollRunDraft, "payments" | "execution" | "stats"> & {
  payments: SerializedPayrollPayment[];
  execution: { recipients: Address[]; clearAmounts: string[] };
  stats: { employees: number; totalMinor: string; totalDisplay: string };
};

function deserializeRun(raw: string): PayrollRunDraft {
  const parsed = JSON.parse(raw) as SerializedPayrollRun;
  return {
    ...parsed,
    payments: parsed.payments.map((p) => ({ ...p, amountMinor: BigInt(p.amountMinor) })),
    execution: {
      ...parsed.execution,
      clearAmounts: parsed.execution.clearAmounts.map((n) => BigInt(n))
    },
    stats: {
      ...parsed.stats,
      totalMinor: BigInt(parsed.stats.totalMinor)
    }
  };
}

function serializeRun(run: PayrollRunDraft): SerializedPayrollRun {
  return {
    ...run,
    payments: run.payments.map((p) => ({ ...p, amountMinor: p.amountMinor.toString() })),
    execution: {
      ...run.execution,
      clearAmounts: run.execution.clearAmounts.map((n) => n.toString())
    },
    stats: {
      ...run.stats,
      totalMinor: run.stats.totalMinor.toString()
    }
  };
}

function readRun(key: string): PayrollRunDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? deserializeRun(raw) : null;
  } catch {
    return null;
  }
}

function writeRun(key: string, run: PayrollRunDraft) {
  window.localStorage.setItem(key, JSON.stringify(serializeRun(run)));
}

export function getActivePayrollRun(): PayrollRunDraft {
  return readRun(STORAGE_KEY) || buildDefaultRun();
}

export function getAuditPayrollRun(): PayrollRunDraft {
  const active = getActivePayrollRun();
  if (active.executionState?.status === "confirmed") return active;
  return readRun(AUDIT_STORAGE_KEY) || active;
}

export function saveActivePayrollRun(run: PayrollRunDraft) {
  writeRun(STORAGE_KEY, run);
}

export function archiveAndClearExecutedPayrollRun() {
  const current = getActivePayrollRun();
  if (current.executionState?.runId) {
    writeRun(AUDIT_STORAGE_KEY, current);
  }
  window.localStorage.removeItem(STORAGE_KEY);
  return buildDefaultRun();
}

export function formatTokenAmount(minor: bigint, ccy = "USDC", decimals = 6) {
  return formatMinor(minor, decimals, ccy);
}

export function findRecipientPayment(account: Address | null, payments: PayrollPaymentDraft[]) {
  if (!account) return null;
  const normalized = account.toLowerCase();
  return payments.find((payment) => payment.recipient.toLowerCase() === normalized) || null;
}

export type WalletUserProfile = {
  payment: PayrollPaymentDraft | null;
  name: string | null;
  role: string | null;
  description: string;
  headerLabel: string;
  headerTitle: string;
};

export function getWalletUserProfile(account: Address | null): WalletUserProfile {
  const run = getAuditPayrollRun();
  const payment = findRecipientPayment(account, run.payments);
  const addressLabel = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "";

  if (payment) {
    const company = run.companyName.trim();
    const description = company
      ? `${payment.role} · ${company}${run.cycleName ? ` · ${run.cycleName}` : ""}`
      : `${payment.role} · ${run.cycleName || "confidential payroll"}`;

    return {
      payment,
      name: payment.name,
      role: payment.role,
      description,
      headerLabel: payment.role,
      headerTitle: payment.name
    };
  }

  if (run.payments.length > 0) {
    const company = run.companyName.trim();
    return {
      payment: null,
      name: null,
      role: null,
      description: company
        ? `Payroll operator · ${company}`
        : "Connected account for payroll execution and confidential balance decrypts.",
      headerLabel: "Wallet",
      headerTitle: addressLabel
    };
  }

  return {
    payment: null,
    name: null,
    role: null,
    description: "Connected account for payroll execution and confidential balance decrypts.",
    headerLabel: "Wallet",
    headerTitle: addressLabel
  };
}

export function updateExecutionState(patch: Partial<NonNullable<PayrollRunDraft["executionState"]>>) {
  const run = getActivePayrollRun();
  run.executionState = { ...(run.executionState || { status: "idle" }), ...patch };
  saveActivePayrollRun(run);
}

export function markPaymentsStatus(status: string) {
  const run = getActivePayrollRun();
  run.payments = run.payments.map((p) => ({ ...p, status }));
  saveActivePayrollRun(run);
}

export function setPaymentResults(results: boolean[]) {
  const run = getActivePayrollRun();
  run.payments = run.payments.map((p, i) => {
    const success = results[i];
    if (success === true) return { ...p, status: "Completed" };
    if (success === false) return { ...p, status: "Failed" };
    return { ...p, status: "Processing" };
  });
  saveActivePayrollRun(run);
}
