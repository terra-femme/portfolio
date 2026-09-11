import { useState } from 'react';

/**
 * Concentric radial rings: one ring per population, arc length carries the count.
 *
 * A lollipop wrapped around a circle. Each ring runs on its own track, sweeps
 * clockwise from the top, and ends in a round cap, which is the lollipop head
 * doing the same job it does on a straight axis: marking one unambiguous
 * position that the eye lands on.
 *
 * Every ring is scaled against the SAME max across every card, not against its
 * own card's total. That is the decision that makes five of these comparable
 * side by side: a short outer ring means a genuinely smaller population, rather
 * than a smaller share of a smaller book. Scaling each card to itself would make
 * a line with seven clients look identical to one with sixteen.
 *
 * The 60 degree gap at the bottom is not decoration. A full 360 degree ring has
 * no visible start, so a nearly-full ring and a completely full one look the
 * same; the gap gives the scale two ends.
 *
 * KNOWN DISTORTION, stated rather than hidden: an inner ring has a smaller
 * circumference, so the same fraction covers fewer pixels there than on the
 * outer ring. 12% of the inner ring is a shorter mark than 12% of the outer one
 * even though they are the same number. Every radial bar chart has this, and it
 * is why the exact counts are printed under each card instead of being left to
 * the arcs. The rings are for the shape of the distribution at a glance; the
 * numbers are the authority. If precise comparison across the three bands ever
 * became the main job, this should go back to a straight axis.
 */
export default function RadialRings({
  rings,
  max,
  size = 132,
  thickness = 9,
  gap = 5,
  center,
  centerLabel,
}) {
  const [hover, setHover] = useState(null);

  const cx = size / 2;
  const cy = size / 2;

  const START = -Math.PI * (150 / 180);  // gap centred on the bottom
  const SWEEP = Math.PI * (300 / 180);

  const polar = (r, a) => {
    const t = a - Math.PI / 2;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  };

  const arc = (r, from, to) => {
    // Clamp just short of a full turn: an arc whose endpoints coincide renders
    // as nothing at all.
    const span = Math.min(to - from, Math.PI * 2 - 1e-6);
    const [x0, y0] = polar(r, from);
    const [x1, y1] = polar(r, from + span);
    return `M ${x0} ${y0} A ${r} ${r} 0 ${span > Math.PI ? 1 : 0} 1 ${x1} ${y1}`;
  };

  return (
    <div className="rings" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img"
        aria-label={rings.map((r) => `${r.label}: ${r.value}`).join(', ')}>
        {rings.map((ring, i) => {
          const r = size / 2 - thickness / 2 - 2 - i * (thickness + gap);
          const frac = max > 0 ? Math.min(1, ring.value / max) : 0;
          const dim = hover !== null && hover !== i;
          return (
            <g
              key={ring.label}
              className={dim ? 'ring-group is-dimmed' : 'ring-group'}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <path className="ring-track" d={arc(r, START, START + SWEEP)} strokeWidth={thickness} />
              {ring.value > 0 && (
                <path
                  className="ring-value"
                  d={arc(r, START, START + SWEEP * frac)}
                  stroke={ring.color}
                  strokeWidth={thickness}
                  style={{ animationDelay: `${i * 90}ms` }}
                />
              )}
            </g>
          );
        })}
      </svg>

      <div className="ring-center">
        {hover !== null ? (
          <>
            <span className="ring-num" style={{ color: rings[hover].color }}>{rings[hover].value}</span>
            {/* `short` exists because the full band names do not fit inside a
                132px ring: "Needs attention" overflowed the hole and clipped
                against the arcs. */}
            <span className="ring-lab">{rings[hover].short ?? rings[hover].label}</span>
          </>
        ) : (
          <>
            <span className="ring-num">{center}</span>
            {centerLabel && <span className="ring-lab">{centerLabel}</span>}
          </>
        )}
      </div>
    </div>
  );
}
