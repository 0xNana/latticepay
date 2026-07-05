import type { PayrollRunDraft } from "../lib/payrollRunStore";

const xmlEscape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const toIsoDateTime = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return date.toISOString();
};

const mapTxStatus = (status: string) => (status === "Completed" ? "ACCP" : "RJCT");

export function buildPain002Xml(run: PayrollRunDraft) {
  const msgId = `PAIN002-${run.runId || "RUN"}`;
  const created = toIsoDateTime(run.executionState?.confirmedAt || run.executionState?.submittedAt || run.createdAt);

  const txRows = run.payments
    .map((payment, index) => {
      const txStatus = mapTxStatus(payment.status);
      const reason = txStatus === "ACCP" ? "Payroll payment settled." : "Payroll payment not settled.";
      return `      <TxInfAndSts>
        <OrgnlEndToEndId>${xmlEscape(payment.id || `TX-${index + 1}`)}</OrgnlEndToEndId>
        <TxSts>${txStatus}</TxSts>
        <StsRsnInf>
          <AddtlInf>${xmlEscape(reason)}</AddtlInf>
        </StsRsnInf>
      </TxInfAndSts>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.002.001.10">
  <CstmrPmtStsRpt>
    <GrpHdr>
      <MsgId>${xmlEscape(msgId)}</MsgId>
      <CreDtTm>${created}</CreDtTm>
      <InitgPty>
        <Nm>${xmlEscape(run.companyName || "Lattice Pay")}</Nm>
      </InitgPty>
    </GrpHdr>
    <OrgnlGrpInfAndSts>
      <OrgnlMsgId>${xmlEscape(run.runId || "RUN")}</OrgnlMsgId>
      <OrgnlMsgNmId>pain.001.001.09</OrgnlMsgNmId>
      <GrpSts>${run.executionState?.status === "confirmed" ? "ACCP" : "PART"}</GrpSts>
    </OrgnlGrpInfAndSts>
${txRows}
  </CstmrPmtStsRpt>
</Document>
`;
}

export function downloadPain002Receipt(run: PayrollRunDraft) {
  const xml = buildPain002Xml(run);
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(run.runId || "payroll-run").toLowerCase()}-receipt.pain.002.xml`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
