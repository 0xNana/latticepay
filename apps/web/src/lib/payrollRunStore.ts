import type { Address } from "viem";

const STORAGE_KEY = "latticepay_payroll_run";

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

export function getActivePayrollRun(): PayrollRunDraft {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildDefaultRun();
    const parsed = JSON.parse(raw) as PayrollRunDraft & {
      payments: Array<PayrollPaymentDraft & { amountMinor: string }>;
      execution: { recipients: Address[]; clearAmounts: string[] };
      stats: { employees: number; totalMinor: string; totalDisplay: string };
      executionState?: PayrollRunDraft["executionState"];
    };
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
  } catch {
    return buildDefaultRun();
  }
}

export function saveActivePayrollRun(run: PayrollRunDraft) {
  const serializable = {
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function formatTokenAmount(minor: bigint, ccy = "USDC", decimals = 6) {
  return formatMinor(minor, decimals, ccy);
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
