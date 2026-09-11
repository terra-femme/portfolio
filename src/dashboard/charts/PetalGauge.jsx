/**
 * Segmented radial gauge: discrete petals around an arc rather than one
 * continuous sweep.
 *
 * Discrete segments are easier to read than a smooth arc because they are
 * countable. A reader can see "19 of 28 lit" without estimating an angle, which
 * is the same reason the donut on the other report puts its number in the hole.
 * It also degrades honestly: a score of 64 lights the same petals every time
 * rather than landing on a slightly different arc length.
 */
export default function PetalGauge({
  value,
  max = 100,
  size = 190,
  petals = 28,
  label,
  sublabel,
  color = 'var(--c-1)',
}) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter - size * 0.17;

  // 250 degrees of travel with a gap at the bottom, so the scale has an
  // unmistakable start and end.
  const START = -Math.PI * 0.694;
  const SWEEP = Math.PI * 1.389;

  const lit = Math.round((Math.min(value, max) / max) * petals);
  const step = SWEEP / petals;
  const gap = step * 0.3;

  const petal = (i) => {
    const a0 = START + i * step + gap / 2;
    const a1 = START + (i + 1) * step - gap / 2;
    const pt = (r, a) => {
      const t = a - Math.PI / 2;
      return `${cx + r * Math.cos(t)} ${cy + r * Math.sin(t)}`;
    };
    return `M ${pt(rInner, a0)} L ${pt(rOuter, a0)} A ${rOuter} ${rOuter} 0 0 1 ${pt(rOuter, a1)} L ${pt(rInner, a1)} A ${rInner} ${rInner} 0 0 0 ${pt(rInner, a0)} Z`;
  };

  return (
    <div className="petal-gauge" style={{ width: size }}>
      <svg width={size} height={size} role="img" aria-label={`${label}: ${value} of ${max}`}>
        {Array.from({ length: petals }, (_, i) => (
          <path
            key={i}
            className={i < lit ? 'petal is-lit' : 'petal'}
            d={petal(i)}
            // Inline style, NOT a fill attribute. A CSS rule beats an SVG
            // presentation attribute at any specificity, so `.petal { fill }`
            // silently won over `fill={color}` and no petal ever lit. Inline
            // style outranks the rule, which is what the attribute could not do.
            style={{ animationDelay: `${i * 22}ms`, ...(i < lit ? { fill: color } : null) }}
          />
        ))}
      </svg>
      <div className="petal-center">
        <span className="petal-value">{value}<em>{max === 100 ? '%' : ''}</em></span>
        {label && <span className="petal-label">{label}</span>}
      </div>
      {sublabel && <div className="petal-sub">{sublabel}</div>}
    </div>
  );
}
