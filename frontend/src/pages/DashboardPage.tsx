import { DashboardHeroSection } from "../components/dashboard/DashboardSections";
import { getActivePayrollRun } from "../lib/payrollRunStore";

export function DashboardPage() {
  const activeRun = getActivePayrollRun();
  const hasRun = activeRun.payments.length > 0;

  return <DashboardHeroSection hasRun={hasRun} run={activeRun} />;
}
