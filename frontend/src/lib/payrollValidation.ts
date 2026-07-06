import type { PayrollRunDraft } from "./payrollRunStore";

const MVP_OPERATIONAL_MAX_PAYMENTS = 15;

export type PayrollValidationResult = {
  ok: boolean;
  checks: Array<{ label: string; ok: boolean; detail: string }>;
};

export function validatePayrollRun(run: PayrollRunDraft): PayrollValidationResult {
  const checks: PayrollValidationResult["checks"] = [];
  const recipients = run.execution.recipients.map((r) => r.toLowerCase());
  const uniqueRecipients = new Set(recipients);
  const duplicateCount = recipients.length - uniqueRecipients.size;
  const nonPositiveAmounts = run.execution.clearAmounts.filter((a) => a <= 0n).length;

  checks.push({
    label: "Payments present",
    ok: run.execution.recipients.length > 0,
    detail: `${run.execution.recipients.length} payment(s)`
  });
  checks.push({
    label: "MVP batch limit",
    ok: run.execution.recipients.length <= MVP_OPERATIONAL_MAX_PAYMENTS,
    detail:
      run.execution.recipients.length <= MVP_OPERATIONAL_MAX_PAYMENTS
        ? `Within operational cap (${MVP_OPERATIONAL_MAX_PAYMENTS})`
        : `Exceeds operational cap (${MVP_OPERATIONAL_MAX_PAYMENTS})`
  });
  checks.push({
    label: "Recipient uniqueness",
    ok: duplicateCount === 0,
    detail: duplicateCount === 0 ? "No duplicate recipient addresses" : `${duplicateCount} duplicate recipient(s)`
  });
  checks.push({
    label: "Amounts > 0",
    ok: nonPositiveAmounts === 0,
    detail: nonPositiveAmounts === 0 ? "All amounts are positive" : `${nonPositiveAmounts} non-positive amount(s)`
  });
  checks.push({
    label: "Totals consistency",
    ok: run.stats.totalMinor === run.execution.clearAmounts.reduce((acc, n) => acc + n, 0n),
    detail: `Declared ${run.stats.totalDisplay}`
  });

  return { ok: checks.every((c) => c.ok), checks };
}
