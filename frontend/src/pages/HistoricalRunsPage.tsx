import { Link } from "react-router-dom";
import { Section } from "../components/Cards";
import { Table } from "../components/Table";
import { getAuditPayrollRun } from "../lib/payrollRunStore";

export function HistoricalRunsPage() {
  const active = getAuditPayrollRun();
  const currentStatus =
    active.executionState?.status === "confirmed"
      ? "Completed"
      : active.executionState?.status === "failed"
        ? "Failed"
        : active.executionState?.status === "submitted"
          ? "Processing"
          : "Draft";

  return (
    <Section title="Audit Trail" subtitle="Track private DAO payroll runs, statuses, and receipts.">
      <Table headers={["Run ID", "Date", "Contributors", "Status", "Action"]}>
        <tr key={`active-${active.runId}`}>
          <td>{active.runId || "-"}</td>
          <td>{new Date(active.createdAt).toISOString().slice(0, 10)}</td>
          <td>{active.stats.employees}</td>
          <td>{currentStatus}</td>
          <td><Link to={currentStatus === "Completed" ? "/runs/audit" : "/payroll"}>Open</Link></td>
        </tr>
      </Table>
    </Section>
  );
}
