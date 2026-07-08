import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { LandingPage } from "./pages/LandingPage";
import { PayrollDraftPage } from "./pages/PayrollDraftPage";
import { ExecutionConfirmationPage } from "./pages/ExecutionConfirmationPage";
import { PayrollProcessingPage } from "./pages/PayrollProcessingPage";
import { PayrollCompletedPage } from "./pages/PayrollCompletedPage";
import { HistoricalRunsPage } from "./pages/HistoricalRunsPage";
import { AuditDetailPage } from "./pages/AuditDetailPage";
import { PayoutPage } from "./pages/PayoutPage";
import { archiveAndClearExecutedPayrollRun, getActivePayrollRun } from "./lib/payrollRunStore";

function PayrollEntryRoute() {
  const run = getActivePayrollRun();
  if (run.executionState?.runId) {
    archiveAndClearExecutedPayrollRun();
    return <Navigate to="/payroll/draft" replace />;
  }
  const status = run.executionState?.status;
  if (status === "confirmed") return <Navigate to="/payroll/completed" replace />;
  if (status === "submitted") return <Navigate to="/payroll/processing" replace />;
  return <Navigate to="/payroll/draft" replace />;
}

function NewPayrollRoute() {
  archiveAndClearExecutedPayrollRun();
  return <Navigate to="/payroll/draft" replace />;
}

function WorkspaceShell() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<WorkspaceShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/payroll" element={<PayrollEntryRoute />} />
        <Route path="/payroll/new" element={<NewPayrollRoute />} />
        <Route path="/payroll/draft" element={<PayrollDraftPage />} />
        <Route path="/payroll/confirm" element={<ExecutionConfirmationPage />} />
        <Route path="/payroll/processing" element={<PayrollProcessingPage />} />
        <Route path="/payroll/completed" element={<PayrollCompletedPage />} />
        <Route path="/portal" element={<PayoutPage />} />
        <Route path="/payout" element={<Navigate to="/portal" replace />} />
        <Route path="/runs" element={<HistoricalRunsPage />} />
        <Route path="/runs/audit" element={<AuditDetailPage />} />
      </Route>
    </Routes>
  );
}
