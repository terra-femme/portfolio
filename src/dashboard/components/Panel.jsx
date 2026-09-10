/**
 * The card every visual sits in.
 *
 * `span` maps to a CSS grid column span so pages can compose a layout by
 * intent ("this chart is wide") instead of repeating grid-column rules. The
 * grid itself decides what a span means at each breakpoint, which is what keeps
 * the responsive behaviour in one place.
 */
export default function Panel({ title, subtitle, hint, span = 12, children, footer, tone }) {
  const classes = ['panel', `span-${span}`];
  if (tone) classes.push(`is-${tone}`);

  return (
    <section className={classes.join(' ')}>
      {(title || hint) && (
        <header className="panel-head">
          <div>
            {title && <h3 className="panel-title">{title}</h3>}
            {subtitle && <p className="panel-sub">{subtitle}</p>}
          </div>
          {hint && <span className="panel-hint">{hint}</span>}
        </header>
      )}
      <div className="panel-body">{children}</div>
      {footer && <footer className="panel-foot">{footer}</footer>}
    </section>
  );
}

/** Coloured status chip used in tables and panel footers. */
export function Pill({ tone = 'neutral', children }) {
  return <span className={`pill is-${tone}`}>{children}</span>;
}

/**
 * A short written takeaway under a chart.
 *
 * Real BI reports are read by people who will not derive the conclusion from
 * the marks themselves. Stating it costs one line and is the difference
 * between a chart and an insight.
 */
export function Callout({ children }) {
  return <p className="callout">{children}</p>;
}
