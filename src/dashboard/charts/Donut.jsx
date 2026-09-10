import { useState } from 'react';
import { useMeasure, arcPath, fmtCompact, fmtPercent } from './primitives';

/**
 * Donut with an interactive legend and a centre readout.
 *
 * The centre is not decoration: hovering a segment swaps it to that segment's
 * own value. That is the whole reason to prefer a donut over a pie -- the hole
 * is a free slot for the number the reader actually wants, so they never have
 * to estimate an angle by eye.
 */
export default function Donut({
  slices,
  size = 200,
  thickness = 26,
  centerLabel = 'Total',
  valueFormat = fmtCompact,
  legend = true,
}) {
  const [wrapRef, { width }] = useMeasure();
  const [hover, setHover] = useState(null);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  // Shrink to fit narrow columns, but never below something legible.
  const dim = Math.max(140, Math.min(size, width || size));
  const cx = dim / 2;
  const cy = dim / 2;
  const rOuter = dim / 2 - 4;
  const rInner = rOuter - thickness;

  const focused = hover === null ? null : slices[hover];

  let angle = 0;
  const arcs = slices.map((slice, i) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const path = arcPath(
      cx, cy,
      // The focused segment grows outward by 4px. Growing rather than exploding
      // outward keeps the ring reading as one object.
      hover === i ? rOuter : rOuter - 3,
      rInner,
      angle,
      angle + sweep
    );
    angle += sweep;
    return { ...slice, path, index: i };
  });

  return (
    <div className={legend ? 'donut-wrap has-legend' : 'donut-wrap'} ref={wrapRef}>
      <div className="donut-chart" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} role="img" aria-label={`Donut chart, ${slices.length} segments`}>
          {arcs.map((a) => (
            <path
              key={a.label}
              d={a.path}
              fill={a.color}
              className="donut-seg"
              style={{ animationDelay: `${a.index * 55}ms` }}
              onMouseEnter={() => setHover(a.index)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>

        <div className="donut-center">
          <div className="donut-value">{valueFormat(focused ? focused.value : total)}</div>
          <div className="donut-label">
            {focused ? focused.label : centerLabel}
          </div>
          {focused && <div className="donut-pct">{fmtPercent(focused.value / total, 1)}</div>}
        </div>
      </div>

      {legend && (
        <ul className="donut-legend">
          {slices.map((s, i) => (
            <li
              key={s.label}
              className={hover !== null && hover !== i ? 'is-dimmed' : undefined}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span className="legend-dot" style={{ background: s.color }} />
              <span className="legend-label">{s.label}</span>
              <span className="legend-value">{fmtPercent(s.value / total, 0)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
