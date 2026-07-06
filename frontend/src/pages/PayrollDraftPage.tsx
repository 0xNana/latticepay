import { useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "../components/Cards";
import { Table } from "../components/Table";
import { RunPayrollSection } from "../components/dashboard/DashboardSections";
import { parsePain001 } from "../lib/pain001Parser";
import { getActivePayrollRun, saveActivePayrollRun } from "../lib/payrollRunStore";
import { validatePayrollRun } from "../lib/payrollValidation";

export function PayrollDraftPage() {
  const [run, setRun] = useState(() => getActivePayrollRun());
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isEmpty = run.payments.length === 0;
  const validation = validatePayrollRun(run);
  const batchLimitIssue = validation.checks.find((check) => check.label === "MVP batch limit" && !check.ok);
  const title = run.cycleName && run.cycleName !== "Payroll Draft" ? `Draft: ${run.cycleName}` : "Draft";

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setUploadError(null);
    try {
      const xml = await file.text();
      const nextRun = parsePain001(xml);
      saveActivePayrollRun(nextRun);
      setRun(nextRun);
    } catch (error) {
      setUploadError((error as Error).message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <>
      <RunPayrollSection busy={busy} uploadError={uploadError} onUpload={onUpload} />
      <Section title={title} subtitle="Recipients, checks, execution.">
        {isEmpty ? (
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h3 style={{ marginTop: 0 }}>No cycle loaded</h3>
            <p style={{ marginTop: 0 }}>
              Use Import above to start.
            </p>
          </div>
        ) : (
          <div className="draft-workspace">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Checks</h3>
              <p style={{ marginTop: 0 }}>{validation.ok ? "Passed." : "Fix issues before running."}</p>
              {batchLimitIssue ? (
                <p style={{ marginTop: 0, color: "#b91c1c" }}>
                  Batch limit is 15. Split and re-upload.
                </p>
              ) : null}
              <ul className="list">
                {validation.checks.map((check) => (
                  <li key={check.label}>
                    {check.ok ? "OK" : "FAIL"} - {check.label}: {check.detail}
                  </li>
                ))}
              </ul>
            </div>
            <aside className="card">
              <h3 style={{ marginTop: 0 }}>Batch</h3>
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Source File</span>
                  <strong>pain.001</strong>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Contributors</span>
                  <strong>{run.stats.employees}</strong>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total</span>
                  <strong>{run.stats.totalDisplay}</strong>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <strong>{validation.ok ? "Ready to Encrypt" : "Needs Review"}</strong>
                </div>
              </div>
              <p className="note-text">Pre-encryption preview.</p>
            </aside>
          </div>
        )}
        <div className="draft-table-wrap">
          <Table headers={["Contributor ID", "Role", "Name", "Recipient", "Amount", "Status"]}>
            {run.payments.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.role}</td>
                <td>{p.name}</td>
                <td>{p.recipient}</td>
                <td>{p.amountDisplay}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </Table>
        </div>
        <div className="cta-row">
          <span>
            {isEmpty
              ? "No cycle loaded."
              : validation.ok
                ? "Passed."
                : "Validation failed."}
          </span>
          <div className="cta-actions">
            <Link className="button ghost" to="/dashboard">Back home</Link>
            <Link
              className="button"
              to={!isEmpty && validation.ok ? "/payroll/confirm" : "#"}
              onClick={(e) => {
                if (isEmpty || !validation.ok) e.preventDefault();
              }}
              aria-disabled={isEmpty || !validation.ok}
              style={isEmpty || !validation.ok ? { opacity: 0.5, pointerEvents: "none" } : undefined}
            >
              Continue
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
