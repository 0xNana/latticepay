import { useMemo, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "../Cards";
import { downloadPain001SampleFile, pain001SampleFiles } from "../../data/pain001Template";
import type { PayrollRunDraft } from "../../lib/payrollRunStore";

type DashboardHeroSectionProps = {
  hasRun: boolean;
  run: PayrollRunDraft;
};

export function DashboardHeroSection({ hasRun, run }: DashboardHeroSectionProps) {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="hero-content">
        <span className="hero-pill">cPay for DAOs</span>
        <h1 id="hero-title">Private payroll for onchain teams</h1>
        <p>Upload payroll. Encrypt amounts. Settle from treasury.</p>
        <div className="hero-actions">
          <Link className="button hero-button" to="/payroll/draft">Start payroll</Link>
          <Link className="button ghost hero-button" to="/runs">View audit</Link>
        </div>
        <div className="hero-metrics" aria-label="Payroll summary">
          <div>
            <span>Contributors</span>
            <strong>{hasRun ? run.stats.employees : 0}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{hasRun ? run.stats.totalDisplay : "-"}</strong>
          </div>
          <div>
            <span>Privacy</span>
            <strong>FHE</strong>
          </div>
        </div>
      </div>
      <div className="hero-visual" aria-label="Encrypted payroll preview">
        <img className="hero-preview-image" src="/hero-payroll-preview.png" alt="Encrypted payroll dashboard preview" />
      </div>
    </section>
  );
}


export function PayrollSimulatorSection() {
  const [contributors, setContributors] = useState(24);
  const [averagePayout, setAveragePayout] = useState(2800);
  const total = useMemo(() => contributors * averagePayout, [contributors, averagePayout]);
  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(total);

  return (
    <section className="payroll-sim" aria-labelledby="sim-title">
      <div className="sim-copy">
        <span className="hero-pill">Live preview</span>
        <h2 id="sim-title">Model a private run</h2>
      </div>
      <div className="sim-panel">
        <div className="sim-controls">
          <label>
            <span>Contributors</span>
            <strong>{contributors}</strong>
            <input
              type="range"
              min="4"
              max="120"
              value={contributors}
              onChange={(event) => setContributors(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Avg payout</span>
            <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(averagePayout)}</strong>
            <input
              type="range"
              min="500"
              max="12000"
              step="100"
              value={averagePayout}
              onChange={(event) => setAveragePayout(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="sim-output">
          <div>
            <span>Operator total</span>
            <strong>{formattedTotal}</strong>
          </div>
          <div>
            <span>Public amount</span>
            <strong>****** cUSDC</strong>
          </div>
          <div className="settlement-rail" aria-hidden="true">
            <span>Treasury</span>
            <i />
            <span>Encrypted</span>
            <i />
            <span>Paid</span>
          </div>
        </div>
      </div>
    </section>
  );
}

type RunPayrollSectionProps = {
  busy: boolean;
  uploadError: string | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function RunPayrollSection({ busy, uploadError, onUpload }: RunPayrollSectionProps) {
  return (
    <Section title="Import">
      <div className="upload-console compact-upload">
        <div className="stack-sm">
          <h3>Payroll XML</h3>
          <div className="badge-row">
            <span className="badge">pain.001</span>
            <span className="badge badge-muted">Local parse</span>
            <span className="badge badge-muted">Encrypted settlement</span>
          </div>
        </div>
        <div className="sample-panel">
          <span className="detail-label">Samples</span>
          {pain001SampleFiles.map((sample) => (
            <button
              key={sample.fileName}
              className="button ghost"
              onClick={() => downloadPain001SampleFile(sample.fileName)}
            >
              {sample.label}
            </button>
          ))}
        </div>
        <div className="cta-actions cta-actions-stacked">
          <label className="button ghost" style={{ cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Parsing..." : "Upload XML"}
            <input
              type="file"
              accept=".xml,text/xml,application/xml"
              onChange={onUpload}
              disabled={busy}
              style={{ display: "none" }}
            />
          </label>
          <Link className="button" to="/payroll/draft">Open draft</Link>
        </div>
      </div>
      {uploadError ? <p className="error-text">{uploadError}</p> : null}
    </Section>
  );
}

type BatchPreviewSectionProps = {
  hasRun: boolean;
  run: PayrollRunDraft;
};

export function BatchPreviewSection(_props: BatchPreviewSectionProps) {
  const workflows = [
    {
      eyebrow: "DAO",
      title: "Payroll intake",
      detail: "Import pain.001, review recipients, lock totals."
    },
    {
      eyebrow: "Private",
      title: "Encrypted amounts",
      detail: "Seal salary values before they touch the chain."
    },
    {
      eyebrow: "Treasury",
      title: "Settlement record",
      detail: "Batch payout with audit trail and pain.002 receipt."
    }
  ];

  return (
    <section className="pro-flow-section" aria-labelledby="product-flow-title">
      <div className="pro-flow-hero">
        <div className="pro-flow-visual" aria-label="Private payroll flow preview">
          <div className="pro-window-head">
            <div className="pro-product-mark pro-product-mark-dark">
              <span aria-hidden="true">cP</span>
              <strong id="product-flow-title">cPay Flow</strong>
            </div>
          </div>
          <div className="pro-workflow-head">
            <h3>Every payroll strategy, one private flow.</h3>
          </div>
          <div className="pro-window-rail" aria-hidden="true">
            <span />
            <i />
            <span />
            <i />
            <span />
          </div>
          <div className="pro-window-list">
            <div><span>Import</span><strong>pain.001 XML</strong></div>
            <div><span>Encrypt</span><strong>****** cUSDC</strong></div>
            <div><span>Settle</span><strong>pain.002 receipt</strong></div>
          </div>
          <div className="pro-workflow-grid">
            {workflows.map((workflow) => (
              <article className="pro-workflow-card" key={workflow.title}>
                <span>{workflow.eyebrow}</span>
                <h4>{workflow.title}</h4>
                <p>{workflow.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

type PayrollNetworkFooterSectionProps = {
  systemStatus: string;
  systemStatusTone: "good" | "warn";
};

export function PayrollNetworkFooterSection({
  systemStatus,
  systemStatusTone
}: PayrollNetworkFooterSectionProps) {
  const statusClassName = systemStatusTone === "good" ? "status-text status-text-good" : "status-text status-text-warn";

  return (
    <footer className="site-footer">
      <div className="footer-brand-row">
        <div>
          <strong>cPay</strong>
          <span>Private payroll for DAOs.</span>
        </div>
      </div>
      <div className="footer-grid">
        <div className="footer-col">
          <span>Product</span>
          <Link to="/payroll/draft">Payroll</Link>
          <Link to="/runs">Audit</Link>
          <Link to="/payout">Portal</Link>
        </div>
        <div className="footer-col">
          <span>Files</span>
          <button type="button" onClick={() => downloadPain001SampleFile(pain001SampleFiles[0].fileName)}>pain.001 sample</button>
          <Link to="/payroll/completed">pain.002 receipt</Link>
          <span className="footer-muted">ISO 20022</span>
        </div>
        <div className="footer-col">
          <span>Security</span>
          <span className="footer-muted">FHE active</span>
          <span className="footer-muted">Multisig policy</span>
          <span className={statusClassName}>{systemStatus}</span>
        </div>
      </div>
      <div className="footer-bottom">
        <span>cPay Labs</span>
        <span>(c) 2026</span>
      </div>
    </footer>
  );
}
