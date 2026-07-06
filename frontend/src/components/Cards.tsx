import type { PropsWithChildren, ReactNode } from "react";

export function Section({ title, subtitle, children }: PropsWithChildren<{ title: ReactNode; subtitle?: string }>) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat">
      <p>{label}</p>
      <h3>{value}</h3>
    </article>
  );
}
