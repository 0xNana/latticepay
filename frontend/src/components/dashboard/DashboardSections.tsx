import { type ChangeEvent } from "react";
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
    <div className="landing-stack">
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="hero-content">
          <span className="hero-pill">Sepolia workspace</span>
          <h1 id="hero-title">Confidential payroll</h1>
          <p>Import payroll files, encrypt amounts, and settle private recipient balances.</p>
          <div className="hero-actions">
            <Link className="button hero-button" to="/payroll">Start payroll</Link>
            <Link className="button ghost hero-button" to="/portal">Open portal</Link>
          </div>
        </div>
        <div className="hero-status-panel" aria-label="Payroll status">
          <div className="hero-status-head">
            <span>Run state</span>
            <strong>{hasRun ? "Ready" : "Idle"}</strong>
          </div>
          <div className="hero-metrics" aria-label="Payroll summary">
            <div>
              <span>Recipients</span>
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
          <div className="hero-status-list" aria-label="Payroll workflow">
            <div><span>Import</span><strong>pain.001</strong></div>
            <div><span>Encrypt</span><strong>Amounts</strong></div>
            <div><span>Settle</span><strong>Receipt</strong></div>
          </div>
        </div>
      </section>
      <section className="landing-product-grid" aria-label="Lattice Pay capabilities">
        <article className="landing-product-card">
          <div className="landing-card-media landing-card-media-private" aria-hidden="true" />
          <h3>Private payroll runs</h3>
          <p>Salary amounts stay encrypted from draft review through settlement.</p>
        </article>
        <article className="landing-product-card">
          <div className="landing-card-media landing-card-media-files" aria-hidden="true" />
          <h3>Bank file native</h3>
          <p>Import pain.001 payroll files and keep receipt records for every run.</p>
        </article>
        <article className="landing-product-card">
          <div className="landing-card-media landing-card-media-recipient" aria-hidden="true" />
          <h3>Recipient-controlled reveal</h3>
          <p>Workers reveal only their own confidential balance from the portal.</p>
        </article>
        <article className="landing-product-card">
          <div className="landing-card-media landing-card-media-settle" aria-hidden="true" />
          <h3>Encrypted settlement</h3>
          <p>Confidential token transfers preserve privacy while producing an audit trail.</p>
        </article>
      </section>
    </div>
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
          <Link className="button" to="/payroll">Open payroll</Link>
        </div>
      </div>
      {uploadError ? <p className="error-text">{uploadError}</p> : null}
    </Section>
  );
}
