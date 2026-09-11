import { fmtNumber } from './primitives';

/**
 * Horizontal bar list.
 *
 * Deliberately built from divs rather than SVG. Horizontal bars are dominated
 * by their text labels, and real text in normal flow wraps, truncates with
 * ellipsis, and is selectable and screen-reader friendly -- none of which
 * <text> in an SVG does without a fight. SVG earns its place where geometry is
 * the point; here it would only get in the way.
 */
export default function HBar({ rows, valueFormat = fmtNumber, showPercent = false }) {
  const max = Math.max(...rows.map((r) => r.value));
  const total = rows.reduce((sum, r) => sum + r.value, 0);

  return (
    <ul className="hbar-list">
      {rows.map((row, i) => (
        <li className="hbar-row" key={row.label}>
          <span className="hbar-label" title={row.label}>{row.label}</span>
          <span className="hbar-track">
            <span
              className="hbar-fill"
              style={{
                // Scale to the largest bar, not the total: this is a ranking,
                // and scaling to the total would leave every bar a stub.
                width: `${(row.value / max) * 100}%`,
                background: row.color || 'var(--c-1)',
                animationDelay: `${i * 55}ms`,
              }}
            />
          </span>
          <span className="hbar-value">
            {valueFormat(row.value)}
            {showPercent && <em>{((row.value / total) * 100).toFixed(0)}%</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}
