import type { Address } from "viem";
import { formatTokenAmount, type PayrollRunDraft } from "./payrollRunStore";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function firstByLocalName(root: Document | Element, localName: string): Element | null {
  const all = root.getElementsByTagName("*");
  for (let i = 0; i < all.length; i += 1) {
    const node = all[i];
    if (node.localName === localName) return node;
  }
  return null;
}

function allByLocalName(root: Document | Element, localName: string): Element[] {
  const out: Element[] = [];
  const all = root.getElementsByTagName("*");
  for (let i = 0; i < all.length; i += 1) {
    const node = all[i];
    if (node.localName === localName) out.push(node);
  }
  return out;
}

function readText(root: Document | Element, localName: string) {
  return firstByLocalName(root, localName)?.textContent?.trim() || "";
}

function decimalToMinor(value: string, decimals = 6): bigint {
  const [w, f = ""] = value.trim().split(".");
  if (!/^\d+$/.test(w || "0") || (f && !/^\d+$/.test(f))) throw new Error(`Invalid amount: ${value}`);
  const frac = (f + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(`${w || "0"}${frac}`);
}

export function parsePain001(xml: string): PayrollRunDraft {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const parserError = doc.getElementsByTagName("parsererror")[0];
  if (parserError) throw new Error("Invalid XML.");

  const customerInit = firstByLocalName(doc, "CstmrCdtTrfInitn");
  if (!customerInit) throw new Error("Missing CstmrCdtTrfInitn root.");

  const msgId = readText(customerInit, "MsgId");
  const createdAt = readText(customerInit, "CreDtTm") || new Date().toISOString();
  const companyName = readText(customerInit, "Nm") || "Uploaded DAO";
  if (!msgId) throw new Error("Missing GrpHdr.MsgId.");

  const txs = allByLocalName(customerInit, "CdtTrfTxInf");
  if (txs.length === 0) throw new Error("No payments found in PmtInf.CdtTrfTxInf.");

  const payments = txs.map((tx, i) => {
    const endToEndId = readText(tx, "EndToEndId") || `CNT-${String(i + 1).padStart(3, "0")}`;
    const name = readText(tx, "Nm") || `Contributor ${i + 1}`;
    const addr = readText(tx, "Id");
    if (!ADDRESS_RE.test(addr)) {
      throw new Error(`Invalid recipient address at payment ${i + 1}: ${addr || "(empty)"}`);
    }

    const instdAmt = firstByLocalName(tx, "InstdAmt");
    if (!instdAmt?.textContent?.trim()) throw new Error(`Missing amount at payment ${i + 1}`);
    const currency = instdAmt.getAttribute("Ccy") || "USDC";
    const amountMinor = decimalToMinor(instdAmt.textContent.trim(), 6);

    return {
      id: endToEndId,
      role: "Contributor",
      name,
      recipient: addr as Address,
      amountMinor,
      amountDisplay: formatTokenAmount(amountMinor, currency, 6),
      status: "Pending",
      currency
    };
  });

  const currency = payments[0].currency;
  if (payments.some((p) => p.currency !== currency)) {
    throw new Error("Mixed currencies are not supported in one payroll run.");
  }

  const totalMinor = payments.reduce((acc, p) => acc + p.amountMinor, 0n);
  return {
    companyName,
    runId: msgId,
    cycleName: `${companyName} Payroll`,
    network: "Sepolia",
    currency,
    createdAt,
    payments: payments.map(({ currency: _c, ...p }) => p),
    execution: {
      recipients: payments.map((p) => p.recipient),
      clearAmounts: payments.map((p) => p.amountMinor)
    },
    stats: {
      employees: payments.length,
      totalMinor,
      totalDisplay: formatTokenAmount(totalMinor, currency, 6)
    }
  };
}
