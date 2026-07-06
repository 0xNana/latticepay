import { Section } from "../components/Cards";
import { downloadPain002Receipt } from "../data/pain002Receipt";
import { getTxExplorerUrl, shortHash } from "../lib/explorer";
import { getAuditPayrollRun } from "../lib/payrollRunStore";

export function AuditDetailPage() {
  const run = getAuditPayrollRun();
  const state = run.executionState || { status: "idle" as const };
  const timeline = [
    { label: "Uploaded", detail: "pain.001 parsed.", time: new Date(run.createdAt).toISOString() },
    { label: "Validated", detail: "Checks passed.", time: new Date(run.createdAt).toISOString() },
    state.submittedAt
      ? {
          label: "Submitted",
          detail: `Tx ${state.txHash ? shortHash(state.txHash) : "-"}`,
          txUrl: state.txHash ? getTxExplorerUrl(state.txHash) : undefined,
          time: state.submittedAt
        }
      : null,
    state.confirmedAt
      ? { label: "Confirmed", detail: `Block ${state.blockNumber || "-"}`, time: state.confirmedAt }
      : null,
    state.status === "failed"
      ? { label: "Failed", detail: state.error || "Unknown error", time: new Date().toISOString() }
      : null
  ].filter(Boolean) as Array<{ label: string; detail: string; txUrl?: string; time: string }>;

  return (
    <Section title={`Audit: ${run.runId || "-"}`} subtitle="File, checks, settlement.">
      <ol className="timeline">
        {timeline.map((item) => (
          <li key={item.label}>
            <h4>{item.label}</h4>
            <p>
              {item.detail}
              {item.txUrl ? (
                <>
                  {" "}
                  <a href={item.txUrl} target="_blank" rel="noreferrer">View on Explorer</a>
                </>
              ) : null}
            </p>
            <small>{item.time}</small>
          </li>
        ))}
      </ol>
      <div className="cta-row">
        <button className="button button-receipt" onClick={() => downloadPain002Receipt(run)}>
          Download pain.002
        </button>
      </div>
    </Section>
  );
}
