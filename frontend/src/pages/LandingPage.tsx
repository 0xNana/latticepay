import { useState } from "react";
import { Link } from "react-router-dom";

const features = [
  {
    kicker: "Encrypted amounts",
    title: "Payroll values stay private across the run.",
    body: "Salary figures are encrypted before settlement, leaving public infrastructure with proofs and handles instead of readable compensation data."
  },
  {
    kicker: "Bank file native",
    title: "Start from the files payroll teams already use.",
    body: "Import ISO 20022 pain.001 batches, validate recipients locally, and export pain.002-style receipts for downstream reconciliation."
  },
  {
    kicker: "Recipient portal",
    title: "Employees reveal only their own balance.",
    body: "Wallet-signed decryptions keep the portal self-serve while preventing global payroll disclosure."
  },
  {
    kicker: "Audit trail",
    title: "Operations can prove execution without exposing payroll.",
    body: "Every batch keeps transaction hashes, receipt status, and run metadata attached to the same confidential workflow."
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

  return (
    <div className="marketing-page">
      <header className="marketing-nav" aria-label="LatticePay">
        <Link className="marketing-brand" to="/" aria-label="LatticePay home">
          <span className="marketing-brand-mark" aria-hidden="true">LP</span>
          <span>LatticePay</span>
        </Link>
        <nav className="marketing-nav-links" aria-label="Landing page sections">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#privacy-demo">Privacy</a>
        </nav>
        <Link className="marketing-nav-cta" to="/dashboard">Open app</Link>
      </header>

      <main>
        <section className="marketing-hero" aria-labelledby="marketing-hero-title">
          <div className="marketing-hero-background" aria-hidden="true" />
          <div className="marketing-hero-copy">
            <span className="marketing-kicker">Confidential payroll on FHEVM</span>
            <h1 id="marketing-hero-title">LatticePay</h1>
            <p>
              Private payroll execution for teams that need bank-file workflows, onchain settlement, and employee-level confidentiality in one operational surface.
            </p>
            <div className="marketing-hero-actions">
              <Link className="marketing-button marketing-button-primary" to="/payroll/new">Start a payroll run</Link>
              <Link className="marketing-button marketing-button-secondary" to="/portal">View employee portal</Link>
            </div>
          </div>
          <div className="marketing-product-shot" aria-label="LatticePay payroll dashboard preview">
            <img src="/hero-payroll-preview.png" alt="LatticePay payroll dashboard showing encrypted payroll workflow" />
            <div className="marketing-shot-overlay">
              <span>Settlement privacy</span>
              <strong>Encrypted totals live onchain</strong>
            </div>
          </div>
        </section>

        <section className="marketing-trust-strip" aria-label="Core guarantees">
          <div><span>Batch input</span><strong>ISO 20022</strong></div>
          <div><span>Privacy layer</span><strong>Zama FHEVM</strong></div>
          <div><span>Token flow</span><strong>Confidential ERC-7984</strong></div>
          <div><span>Output</span><strong>pain.002 receipts</strong></div>
        </section>

        <section id="features" className="marketing-section marketing-features" aria-labelledby="features-title">
          <div className="marketing-section-head">
            <span className="marketing-kicker">Features</span>
            <h2 id="features-title">Built for payroll operators.</h2>
            <p>Every surface is oriented around the controls finance teams need before, during, and after confidential settlement.</p>
          </div>
          <div className="marketing-feature-grid">
            {features.map((feature) => (
              <article className="marketing-feature-card" key={feature.title}>
                <span>{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
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
            <Link className="marketing-button marketing-button-primary" to="/dashboard">Open dashboard</Link>
            <Link className="marketing-button marketing-button-secondary" to="/payroll/new">New payroll run</Link>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <div>
          <Link className="marketing-brand" to="/" aria-label="LatticePay home">
            <span className="marketing-brand-mark" aria-hidden="true">LP</span>
            <span>LatticePay</span>
          </Link>
          <p>Confidential payroll infrastructure for encrypted onchain settlement.</p>
        </div>
        <div className="marketing-footer-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/payroll/new">Payroll</Link>
          <Link to="/runs">Audit</Link>
          <Link to="/portal">Portal</Link>
        </div>
      </footer>
    </div>
  );
}
