import { useMemo, useState } from 'react';
import { useMeasure, scaleLinear, niceScale, roundedTopRect, fmtCompact } from './primitives';

/**
 * Vertical bar chart. Handles a single series, grouped series, or a stack.
 *
 * Rows take the same shape as LineChart's, so a caller can switch a panel from
 * bars to a line without touching the data.
 */
export default function BarChart({
  rows,
  keys = ['value'],
  colors = ['var(--c-1)'],
  stacked = false,
  height,
  yFormat = fmtCompact,
}) {
  const [wrapRef, { width, height: measured }] = useMeasure();
  const [hover, setHover] = useState(null);

  // `height` is now optional. When omitted the chart measures the height the
  // flex layout gave it, so a panel stretched to match its neighbour hands that
  // extra space to the chart instead of leaving a gap under it. A fixed height
  // is still accepted for the rare case where a chart must not resize.
  const h = height ?? Math.max(168, measured);

  const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

  const model = useMemo(() => {
    const matrix = keys.map((_, s) =>
      rows.map((r) => (Array.isArray(r.values) ? r.values[s] : r.value))
    );
    // A stack's axis has to reach the column TOTAL, not the tallest single band.
    const peaks = stacked
      ? rows.map((_, i) => matrix.reduce((sum, ser) => sum + ser[i], 0))
      : matrix.flat();
    return { matrix, scale: niceScale(0, Math.max(...peaks)) };
  }, [rows, keys, stacked]);

  if (width === 0) return <div className="chart-wrap" ref={wrapRef} style={height ? { height } : undefined} />;

  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const innerH = Math.max(1, h - PAD.top - PAD.bottom);
  const { matrix, scale } = model;
  const y = scaleLinear(scale.min, scale.max, PAD.top + innerH, PAD.top);

  const slot = innerW / rows.length;
  const groupW = slot * 0.62;                       // 38% of the slot is gutter
  const barW = stacked ? groupW : groupW / keys.length;

  return (
    <div className="chart-wrap" ref={wrapRef} style={height ? { height } : undefined}>
      <svg width={width} height={h} role="img" aria-label={`Bar chart, ${rows.length} categories`}>
        {scale.ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="axis-label" x={PAD.left - 10} y={y(t)} textAnchor="end" dominantBaseline="middle">
              {yFormat(t)}
            </text>
          </g>
        ))}

        {rows.map((row, i) => {
          const slotX = PAD.left + i * slot + (slot - groupW) / 2;
          let stackTop = PAD.top + innerH; // running baseline for stacked mode

          return (
            <g
              key={row.label + i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className={hover !== null && hover !== i ? 'bar-group is-dimmed' : 'bar-group'}
            >
              {/* invisible full-height hit target: hovering the gap still works */}
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />

              {keys.map((k, s) => {
                const value = matrix[s][i];
                const barH = Math.max(0, PAD.top + innerH - y(value));
                const bx = stacked ? slotX : slotX + s * barW;
                const by = stacked ? stackTop - barH : y(value);
                if (stacked) stackTop -= barH;

                return (
                  <path
                    key={k}
                    className="chart-bar"
                    // Only the top band of a stack gets rounded corners; rounding
                    // every band leaves visible notches down the column.
                    d={roundedTopRect(bx, by, stacked ? barW : barW * 0.86, barH,
                      !stacked || s === keys.length - 1 ? 4 : 0)}
                    fill={colors[s]}
                    style={{ animationDelay: `${i * 24 + s * 60}ms` }}
                  />
                );
              })}

              <text className="axis-label" x={PAD.left + i * slot + slot / 2} y={h - 8} textAnchor="middle">
                {row.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: PAD.left + hover * slot + slot / 2 > width * 0.6 ? undefined : PAD.left + hover * slot + slot,
            right: PAD.left + hover * slot + slot / 2 > width * 0.6 ? width - (PAD.left + hover * slot) : undefined,
          }}
        >
          <div className="tt-title">{rows[hover].label}</div>
          {keys.map((k, s) => (
            <div className="tt-row" key={k}>
              <span className="tt-swatch" style={{ background: colors[s] }} />
              <span className="tt-key">{k}</span>
              <span className="tt-val">{yFormat(matrix[s][hover])}</span>
            </div>
          ))}
          {stacked && (
            <div className="tt-row tt-total">
              <span className="tt-key">Total</span>
              <span className="tt-val">{yFormat(matrix.reduce((sum, ser) => sum + ser[hover], 0))}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
