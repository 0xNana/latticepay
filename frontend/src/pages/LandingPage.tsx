import { useState } from "react";
import { Link } from "react-router-dom";

import { getActivePayrollRun } from "../lib/payrollRunStore";

const capabilities = [
  {
    mediaClass: "landing-card-media-private",
    title: "Private payroll runs",
    body: "Salary amounts stay encrypted from draft review through settlement."
  },
  {
    mediaClass: "landing-card-media-files",
    title: "Bank file native",
    body: "Import pain.001 payroll files and keep receipt records for every run."
  },
  {
    mediaClass: "landing-card-media-recipient",
    title: "Recipient-controlled reveal",
    body: "Workers reveal only their own confidential balance from the portal."
  },
  {
    mediaClass: "landing-card-media-settle",
    title: "Encrypted settlement",
    body: "Confidential token transfers preserve privacy while producing an audit trail."
  }
];

const workflow = [
  ["01", "Ingest", "Upload a pain.001 payroll file and normalize employee payout lines."],
  ["02", "Validate", "Catch malformed addresses, duplicate recipients, and batch-limit issues before execution."],
  ["03", "Encrypt", "Convert amounts into confidential inputs for the payroll executor contract."],
  ["04", "Settle", "Submit the encrypted batch, monitor finality, and download the receipt."]
];

const auditRows = [
  ["Run ID", "LP-2026-03-DAO-10", "LP-2026-03-DAO-10"],
  ["Public total", "$184,250.00", "ct:8f71...b92a"],
  ["Maya Chen", "$12,400.00", "euint64:0x7a...41"],
  ["Kwame Mensah", "$9,850.00", "euint64:0xc2...09"],
  ["Receipt", "pain.002 accepted", "pain.002 accepted"]
];

export function LandingPage() {
  const [revealed, setRevealed] = useState(false);
  const activeRun = getActivePayrollRun();
  const hasRun = activeRun.payments.length > 0;

  return (
    <div className="marketing-page">
      <div className="marketing-main">
        <section className="marketing-hero marketing-hero-workspace" aria-labelledby="marketing-hero-title">
          <div className="marketing-hero-shell-grid">
            <div className="marketing-hero-copy">
              <h1 id="marketing-hero-title">Confidential payroll</h1>
              <p>
                Import payroll files, encrypt amounts client-side, and settle confidential recipient balances without exposing compensation onchain.
              </p>
              <div className="marketing-hero-actions">
                <Link className="marketing-button marketing-button-primary" to={hasRun ? "/payroll/draft" : "/payroll/new"}>
                  {hasRun ? "Continue payroll run" : "Start payroll run"}
                </Link>
                <Link className="marketing-button marketing-button-secondary" to="/portal">Open portal</Link>
              </div>
              <ul className="marketing-hero-points" aria-label="Workspace highlights">
                <li>ISO 20022 pain.001 import with local validation</li>
                <li>Encrypted settlement via confidential ERC-7984 transfers</li>
                <li>Recipient-controlled balance reveal in the portal</li>
              </ul>
            </div>

            <aside className="marketing-hero-panel" aria-label="Payroll workspace status">
              <div className="marketing-hero-panel-head">
                <span>Run state</span>
                <strong>{hasRun ? "Ready" : "Idle"}</strong>
              </div>
              <div className="marketing-hero-metrics" aria-label="Payroll summary">
                <div>
                  <span>Recipients</span>
                  <strong>{hasRun ? activeRun.stats.employees : 0}</strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>{hasRun ? activeRun.stats.totalDisplay : "—"}</strong>
                </div>
                <div>
                  <span>Privacy</span>
                  <strong>FHE</strong>
                </div>
              </div>
              <div className="marketing-hero-flow-list" aria-label="Payroll workflow">
                <div><span>Import</span><strong>pain.001</strong></div>
                <div><span>Encrypt</span><strong>Amounts</strong></div>
                <div><span>Settle</span><strong>Receipt</strong></div>
              </div>
              <div className="marketing-hero-panel-foot">
                <span>Network</span>
                <strong>Sepolia testnet</strong>
              </div>
            </aside>
          </div>
        </section>

        <section className="marketing-trust-strip" aria-label="Core guarantees">
          <div><span>Batch input</span><strong>ISO 20022</strong></div>
          <div><span>Privacy layer</span><strong>Zama FHEVM</strong></div>
          <div><span>Token flow</span><strong>Confidential ERC-7984</strong></div>
          <div><span>Output</span><strong>pain.002 receipts</strong></div>
        </section>

        <nav className="marketing-section-nav" aria-label="On this page">
          <a href="#capabilities">Capabilities</a>
          <a href="#workflow">Workflow</a>
          <a href="#privacy-demo">Privacy</a>
        </nav>

        <section id="capabilities" className="marketing-section marketing-capabilities" aria-labelledby="capabilities-title">
          <div className="marketing-section-head">
            <span className="marketing-kicker">Capabilities</span>
            <h2 id="capabilities-title">Everything in one confidential payroll surface.</h2>
          </div>
          <div className="landing-product-grid">
            {capabilities.map((item) => (
              <article className="landing-product-card" key={item.title}>
                <div className={`landing-card-media ${item.mediaClass}`} aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="workflow" className="marketing-section marketing-workflow" aria-labelledby="workflow-title">
          <div className="marketing-section-head">
            <span className="marketing-kicker">Workflow</span>
            <h2 id="workflow-title">A clean path from payroll file to confidential settlement.</h2>
          </div>
          <div className="marketing-workflow-grid">
            {workflow.map(([number, title, body]) => (
              <article className="marketing-workflow-step" key={title}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="privacy-demo" className="marketing-section marketing-privacy-demo" aria-labelledby="privacy-title">
          <div className="marketing-section-head">
            <span className="marketing-kicker">Privacy demo</span>
            <h2 id="privacy-title">One payroll run, two visibility modes.</h2>
            <p>Toggle the view to see what authorized payroll staff can inspect versus what public observers see after encryption.</p>
          </div>
          <div className="marketing-demo-shell">
            <div className="marketing-demo-controls" role="group" aria-label="Visibility mode">
              <button className={!revealed ? "is-active" : ""} type="button" onClick={() => setRevealed(false)}>
                Public chain view
              </button>
              <button className={revealed ? "is-active" : ""} type="button" onClick={() => setRevealed(true)}>
                Authorized payroll view
              </button>
            </div>
            <div className="marketing-demo-table" aria-live="polite">
              {auditRows.map(([label, clear, encrypted]) => (
                <div className="marketing-demo-row" key={label}>
                  <span>{label}</span>
                  <strong>{revealed ? clear : encrypted}</strong>
                </div>
              ))}
            </div>
            <div className="marketing-demo-proof">
              <span className="marketing-proof-dot" aria-hidden="true" />
              <p>{revealed ? "Authorized view opened with wallet-controlled decryption." : "Observer view keeps amounts as encrypted handles while preserving run status."}</p>
            </div>
          </div>
        </section>

        <section className="marketing-cta" aria-labelledby="cta-title">
          <div>
            <span className="marketing-kicker">Deploy the workflow</span>
            <h2 id="cta-title">Run payroll with confidentiality as the default.</h2>
            <p>Open the app, load a sample batch, and move through validation, encryption, settlement, and receipt export.</p>
          </div>
          <div className="marketing-cta-actions">
            <Link className="marketing-button marketing-button-primary" to="/payroll">Open payroll</Link>
            <Link className="marketing-button marketing-button-secondary" to="/payroll/new">New payroll run</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
