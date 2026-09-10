import { arcPath } from './primitives';

const START = -Math.PI * 0.75; // 225 degrees, i.e. lower-left
const SWEEP = Math.PI * 1.5;   // 270 degree total travel

/**
 * Radial SLO gauge.
 *
 * The scale deliberately does NOT start at zero. An availability gauge drawn
 * 0-100% pins every healthy value to the same indistinguishable sliver at the
 * top; the interesting range is 99.5-100, so `floor` sets where the arc begins.
 * Truncating an axis is normally a sin, but for a bounded SLO the reader is
 * asking "am I above the line", and the target tick makes that line explicit.
 */
export default function Gauge({ label, value, target, floor = 0, max = 100, unit = '%', size = 132 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const thickness = 9;

  const norm = (v) => Math.max(0, Math.min(1, (v - floor) / (max - floor || 1)));
  const angleFor = (v) => START + norm(v) * SWEEP;

  const meets = value >= target;
  const tone = meets ? 'var(--c-ok)' : 'var(--c-crit)';

  // Target tick: a short radial line drawn across the track.
  const tickAngle = angleFor(target) - Math.PI / 2;
  const tick = (rr) => ({
    x: cx + rr * Math.cos(tickAngle),
    y: cy + rr * Math.sin(tickAngle),
  });
  const tIn = tick(r - thickness - 2);
  const tOut = tick(r + 3);

  return (
    <div className="gauge">
      <svg width={size} height={size} role="img" aria-label={`${label}: ${value}${unit}, target ${target}${unit}`}>
        <path
          className="gauge-track"
          d={arcPath(cx, cy, r, r - thickness, START, START + SWEEP)}
        />
        <path
          className="gauge-value"
          d={arcPath(cx, cy, r, r - thickness, START, angleFor(value))}
          fill={tone}
        />
        <line className="gauge-tick" x1={tIn.x} y1={tIn.y} x2={tOut.x} y2={tOut.y} />
      </svg>

      <div className="gauge-center">
        <span className="gauge-num">{value}<em>{unit}</em></span>
      </div>

      <div className="gauge-meta">
        <span className="gauge-label">{label}</span>
        <span className={meets ? 'gauge-status is-ok' : 'gauge-status is-bad'}>
          {meets ? 'Meeting' : 'Breaching'} target {target}{unit}
        </span>
      </div>
    </div>
  );
}
