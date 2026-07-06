import { Link } from "react-router-dom";
import { Section } from "../components/Cards";
import { ExecutionActions } from "../components/ExecutionActions";
import { getActivePayrollRun } from "../lib/payrollRunStore";

export function ExecutionConfirmationPage() {
  const run = getActivePayrollRun();
  return (
    <Section title="Confirm" subtitle="Final review before settlement.">
      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Batch</h3>
          <ul className="list compact-list">
            <li>Run ID: {run.runId}</li>
            <li>Network: {run.network}</li>
            <li>Contributors: {run.stats.employees}</li>
            <li>Private Total: {run.stats.totalDisplay}</li>
          </ul>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Execution</h3>
          <ul className="list compact-list">
            <li>XML parsed</li>
            <li>Recipients locked</li>
            <li>Amounts encrypted</li>
            <li>Treasury transaction</li>
          </ul>
        </div>
      </div>
      <ExecutionActions />
      <div className="cta-row">
        <Link className="button ghost" to="/payroll/draft">Cancel</Link>
        <Link className="button ghost" to="/payroll/completed">Results</Link>
      </div>
    </Section>
  );
}
