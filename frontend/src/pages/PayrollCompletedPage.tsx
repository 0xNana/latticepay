import { Link } from "react-router-dom";
import { Section } from "../components/Cards";
import { Table } from "../components/Table";
import { getTxExplorerUrl, shortHash } from "../lib/explorer";
import { getActivePayrollRun } from "../lib/payrollRunStore";

export function PayrollCompletedPage() {
  const run = getActivePayrollRun();
  return (
    <Section title={`Complete: ${run.cycleName}`} subtitle="Execution environment.">
      <Table headers={["Role", "Contributor", "Recipient", "Amount", "Status"]}>
        {run.payments.map((p) => (
          <tr key={p.id}>
            <td>{p.role}</td>
            <td>{p.name}</td>
            <td>{p.recipient}</td>
            <td>{p.amountDisplay}</td>
            <td>{p.status}</td>
          </tr>
        ))}
      </Table>
      <p className="completed-meta">
        Run ID: {run.executionState?.runId || run.runId}
        {run.executionState?.txHash ? (
          <>
            {" | Tx: "}
            <a href={getTxExplorerUrl(run.executionState.txHash)} target="_blank" rel="noreferrer">
              {shortHash(run.executionState.txHash)}
            </a>
          </>
        ) : null}
      </p>
      <div className="cta-row">
        <Link className="button" to="/payroll/new">Run another payroll</Link>
        <Link className="button" to="/runs/audit">Audit detail</Link>
      </div>
    </Section>
  );
}
