import { Link } from "react-router-dom";
import { Section } from "../components/Cards";
import { getTxExplorerUrl, shortHash } from "../lib/explorer";
import { getActivePayrollRun } from "../lib/payrollRunStore";

export function PayrollProcessingPage() {
  const run = getActivePayrollRun();
  const state = run.executionState || { status: "idle" as const };
  const completed = run.payments.filter((p) => p.status === "Completed").length;
  const total = run.payments.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasStarted = state.status !== "idle" || Boolean(state.txHash);
  return (
    <Section title="Processing" subtitle={`Run ${run.runId}.`}>
      <div className="progress-wrap">
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <p>{completed}/{total} completed.</p>
      <div className="cta-row">
        <span>
          {hasStarted ? (
            <>
              Status: {state.status}
              {state.txHash ? (
                <>
                  {" | Tx: "}
                  <a href={getTxExplorerUrl(state.txHash)} target="_blank" rel="noreferrer">
                    {shortHash(state.txHash)}
                  </a>
                </>
              ) : null}
              {state.blockNumber ? ` | Block: ${state.blockNumber}` : ""}
            </>
          ) : (
            "No run submitted."
          )}
        </span>
        {!hasStarted ? <Link className="button ghost" to="/payroll/draft">Back to draft</Link> : null}
        <Link
          className="button"
          to="/payroll/completed"
          aria-disabled={state.status !== "confirmed"}
          style={state.status !== "confirmed" ? { pointerEvents: "none", opacity: 0.5 } : undefined}
        >
          View complete
        </Link>
      </div>
      {state.error ? <p style={{ color: "#f87171" }}>Error: {state.error}</p> : null}
    </Section>
  );
}
