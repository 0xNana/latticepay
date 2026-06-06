import {
  BatchPreviewSection,
  DashboardHeroSection,
  PayrollNetworkFooterSection,
  PayrollSimulatorSection
} from "../components/dashboard/DashboardSections";
import { hasExecutionConfig } from "../lib/config";
import { getActivePayrollRun } from "../lib/payrollRunStore";

export function DashboardPage() {
  const activeRun = getActivePayrollRun();
  const hasRun = activeRun.payments.length > 0;
  const systemStatus = hasExecutionConfig() ? "Operational" : "Configuration Required";

  return (
    <>
      <DashboardHeroSection hasRun={hasRun} run={activeRun} />
      <PayrollSimulatorSection />
      <BatchPreviewSection hasRun={hasRun} run={activeRun} />
      <PayrollNetworkFooterSection
        systemStatus={systemStatus}
        systemStatusTone={hasExecutionConfig() ? "good" : "warn"}
      />
    </>
  );
}
