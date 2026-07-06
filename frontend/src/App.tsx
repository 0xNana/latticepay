import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { DashboardPage } from "./pages/DashboardPage";
import { PayrollDraftPage } from "./pages/PayrollDraftPage";
import { ExecutionConfirmationPage } from "./pages/ExecutionConfirmationPage";
import { PayrollProcessingPage } from "./pages/PayrollProcessingPage";
import { PayrollCompletedPage } from "./pages/PayrollCompletedPage";
import { HistoricalRunsPage } from "./pages/HistoricalRunsPage";
import { AuditDetailPage } from "./pages/AuditDetailPage";
import { PayoutPage } from "./pages/PayoutPage";

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/payroll/draft" element={<PayrollDraftPage />} />
        <Route path="/payroll/confirm" element={<ExecutionConfirmationPage />} />
        <Route path="/payroll/processing" element={<PayrollProcessingPage />} />
        <Route path="/payroll/completed" element={<PayrollCompletedPage />} />
        <Route path="/payout" element={<PayoutPage />} />
        <Route path="/runs" element={<HistoricalRunsPage />} />
        <Route path="/runs/audit" element={<AuditDetailPage />} />
      </Routes>
    </Shell>
  );
}
