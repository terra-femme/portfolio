import { monotonePath, scaleLinear } from './primitives';

/**
 * Inline trend line for table cells.
 *
 * Fixed pixel size, no ResizeObserver: a sparkline lives inside a table cell at
 * a known size, and attaching an observer to every row of a 14-row table would
 * cost more than it could possibly buy.
 *
 * The domain is padded by 8% top and bottom so a series that ends at its own
 * maximum doesn't get its final point clipped by the stroke width.
 */
export default function Sparkline({ values, width = 88, height = 28, color = 'var(--c-1)' }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.08 || 1;

  const x = scaleLinear(0, values.length - 1, 1.5, width - 1.5);
  const y = scaleLinear(min - pad, max + pad, height - 2, 2);
  const points = values.map((v, i) => ({ x: x(i), y: y(v) }));

  const last = points[points.length - 1];
  const rising = values[values.length - 1] >= values[0];

  return (
    <svg
      className="sparkline"
      width={width}
      height={height}
      role="img"
      aria-label={`Trend, ${rising ? 'rising' : 'falling'}, latest ${values[values.length - 1]}`}
    >
      <path d={monotonePath(points)} fill="none" stroke={color} strokeWidth={1.6}
        strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2.4} fill={color} />
    </svg>
  );
}
