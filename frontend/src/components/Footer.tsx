import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div>
            <div className="site-footer-brand">
              <div className="site-footer-mark" aria-hidden="true">
                <span className="material-icons">shield_lock</span>
              </div>
              <div>
                <p className="site-footer-name">Lattice Pay</p>
                <p className="site-footer-tagline">Private payroll on Ethereum</p>
              </div>
            </div>
            <p className="site-footer-desc">
              ISO 20022 payroll ingestion, encrypted salary settlement, and
              recipient-controlled balance reveals in one confidential workflow.
            </p>
          </div>

          <div>
            <h4 className="site-footer-heading">Product</h4>
            <ul className="site-footer-links">
              <li><Link to="/payroll">Run payroll</Link></li>
              <li><Link to="/portal">Employee portal</Link></li>
              <li><Link to="/runs">Audit trail</Link></li>
              <li><Link to="/dashboard">Home</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="site-footer-heading">Trust</h4>
            <ul className="site-footer-links">
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#privacy">Privacy model</a></li>
              <li><Link to="/runs/audit">Receipt records</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="site-footer-heading">Demo Flow</h4>
            <ul className="site-footer-links">
              <li><span>1. Claim test cUSDC</span></li>
              <li><Link to="/payroll">2. Import pain.001</Link></li>
              <li><Link to="/payroll/confirm">3. Execute payroll</Link></li>
              <li><Link to="/portal">4. Reveal balance</Link></li>
            </ul>
          </div>
        </div>

        <div className="site-footer-bottom">
          © 2026 Lattice Pay. Confidential payroll with proof-verified settlement receipts.
        </div>
      </div>
    </footer>
  );
}
