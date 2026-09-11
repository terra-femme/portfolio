import { useId, useMemo, useState } from 'react';
import {
  useMeasure, scaleLinear, niceScale, monotonePath, areaPath, fmtCompact,
} from './primitives';

/**
 * Multi-series line / area chart with a hover crosshair and tooltip.
 *
 * Accepts rows in either shape:
 *   [{ label, value }]            single series
 *   [{ label, values: [a, b] }]   one entry per key in `keys`
 * Normalising here rather than at every call site keeps the data files honest
 * -- they describe the data, not the chart's preferred argument order.
 */
export default function LineChart({
  rows,
  keys = ['value'],
  colors = ['var(--c-1)'],
  area = false,
  stacked = false,
  height,
  yFormat = fmtCompact,
  xTickEvery,
  baselineZero = true,
}) {
  const [wrapRef, { width, height: measured }] = useMeasure();
  const [hover, setHover] = useState(null); // index of the focused column

  // `height` is now optional. When omitted the chart measures the height the
  // flex layout gave it, so a panel stretched to match its neighbour hands that
  // extra space to the chart instead of leaving a gap under it. A fixed height
  // is still accepted for the rare case where a chart must not resize.
  const h = height ?? Math.max(168, measured);
  const gradientId = useId();

  const PAD = { top: 16, right: 16, bottom: 28, left: 48 };

  const model = useMemo(() => {
    // ---- normalise into a matrix: series[s][i] = number
    const matrix = keys.map((_, s) =>
      rows.map((r) => (Array.isArray(r.values) ? r.values[s] : r.value))
    );

    // Stacked charts plot cumulative totals; the topmost band defines the axis.
    const plotted = stacked
      ? matrix.map((_, s) =>
          rows.map((_, i) => matrix.slice(0, s + 1).reduce((sum, ser) => sum + ser[i], 0))
        )
      : matrix;

    const flat = plotted.flat();
    const rawMin = baselineZero ? 0 : Math.min(...flat);
    const scale = niceScale(rawMin, Math.max(...flat));
    return { matrix, plotted, scale };
  }, [rows, keys, stacked, baselineZero]);

  if (width === 0) {
    return <div className="chart-wrap" ref={wrapRef} style={height ? { height } : undefined} />;
  }

  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const innerH = Math.max(1, h - PAD.top - PAD.bottom);
  const { matrix, plotted, scale } = model;

  const x = (i) => PAD.left + (rows.length === 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW);
  const y = scaleLinear(scale.min, scale.max, PAD.top + innerH, PAD.top);

  // Label every nth tick so a 30-point axis doesn't turn into a grey smear.
  const step = xTickEvery ?? Math.max(1, Math.ceil(rows.length / 7));

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const ratio = (px - PAD.left) / innerW;
    const idx = Math.round(ratio * (rows.length - 1));
    setHover(Math.max(0, Math.min(rows.length - 1, idx)));
  };

  return (
    <div className="chart-wrap" ref={wrapRef} style={height ? { height } : undefined}>
      <svg
        width={width}
        height={h}
        role="img"
        aria-label={`Line chart, ${rows.length} points`}
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {colors.map((c, s) => (
            <linearGradient key={s} id={`${gradientId}-${s}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={stacked ? 0.55 : 0.32} />
              <stop offset="100%" stopColor={c} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>

        {/* horizontal gridlines + y axis labels */}
        {scale.ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} />
            <text className="axis-label" x={PAD.left - 10} y={y(t)} textAnchor="end" dominantBaseline="middle">
              {yFormat(t)}
            </text>
          </g>
        ))}

        {/* x axis labels */}
        {rows.map((r, i) =>
          i % step === 0 || i === rows.length - 1 ? (
            <text key={r.label + i} className="axis-label" x={x(i)} y={h - 8} textAnchor="middle">
              {r.label}
            </text>
          ) : null
        )}

        {/* areas painted back-to-front so a stack reads bottom-up */}
        {area &&
          plotted.map((series, s) => {
            const pts = series.map((v, i) => ({ x: x(i), y: y(v) }));
            return (
              <path
                key={`a-${s}`}
                className="chart-area"
                d={areaPath(pts, PAD.top + innerH)}
                fill={`url(#${gradientId}-${s})`}
                style={{ animationDelay: `${s * 90}ms` }}
              />
            );
          })}

        {/* lines on top */}
        {plotted.map((series, s) => {
          const pts = series.map((v, i) => ({ x: x(i), y: y(v) }));
          return (
            <path
              key={`l-${s}`}
              className="chart-line"
              d={monotonePath(pts)}
              stroke={colors[s]}
              style={{ animationDelay: `${s * 90}ms` }}
            />
          );
        })}

        {/* crosshair + focused points */}
        {hover !== null && (
          <g className="chart-hover">
            <line className="crosshair" x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} />
            {plotted.map((series, s) => (
              <circle key={s} cx={x(hover)} cy={y(series[hover])} r={4.5} fill={colors[s]} stroke="var(--surface)" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>

      {hover !== null && (
        <div
          className="chart-tooltip"
          style={{
            // Flip the tooltip to the left of the cursor once it would run off
            // the right edge, so it is never clipped by the panel.
            left: x(hover) > width * 0.6 ? undefined : x(hover) + 14,
            right: x(hover) > width * 0.6 ? width - x(hover) + 14 : undefined,
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
        </div>
      )}
    </div>
  );
}
