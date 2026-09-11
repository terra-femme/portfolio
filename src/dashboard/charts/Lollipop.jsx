import { useState } from 'react';
import { useMeasure, scaleLinear } from './primitives';

/**
 * Horizontal lollipop chart.
 *
 * The right mark for comparing a handful of categories on one measure. A bar
 * chart spends a large filled rectangle encoding a single number at its tip,
 * and with five lines of business side by side that ink competes with itself.
 * A lollipop puts the value in one unambiguous place, the dot, and uses the
 * stem only to carry the eye there, so differences of a few points stay
 * readable and the category labels get the room they need.
 *
 * Each row also carries a target tick. Health is meaningless without the number
 * it is supposed to beat, and a naked score invites the reader to invent their
 * own threshold.
 */
export default function Lollipop({
  rows,
  max = 100,
  valueFormat = (v) => String(Math.round(v)),
  labelWidth = 92,
  rowHeight = 40,
  onSelect,
  selected,
}) {
  const [wrapRef, { width }] = useMeasure();
  const [hover, setHover] = useState(null);

  const PAD = { left: labelWidth, right: 64, top: 10, bottom: 24 };
  const height = rows.length * rowHeight + PAD.top + PAD.bottom;

  if (width === 0) {
    return <div className="lolli-wrap" ref={wrapRef} style={{ minHeight: height }} />;
  }

  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const x = scaleLinear(0, max, PAD.left, PAD.left + innerW);
  const y = (i) => PAD.top + i * rowHeight + rowHeight / 2;

  const ticks = [0, max * 0.25, max * 0.5, max * 0.75, max];

  return (
    <div className="lolli-wrap" ref={wrapRef} style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={`Lollipop chart, ${rows.length} categories`}>
        {/* gridlines behind everything */}
        {ticks.map((t) => (
          <line key={t} className="grid-line" x1={x(t)} x2={x(t)} y1={PAD.top} y2={height - PAD.bottom} />
        ))}
        {ticks.map((t) => (
          <text key={`l${t}`} className="axis-label" x={x(t)} y={height - 8} textAnchor="middle">
            {Math.round(t)}
          </text>
        ))}

        {rows.map((row, i) => {
          const isSel = selected === row.id;
          const dim = (selected && !isSel) || (hover !== null && hover !== i && !selected);
          return (
            <g
              key={row.id ?? row.label}
              className={dim ? 'lolli-row is-dimmed' : 'lolli-row'}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={onSelect ? () => onSelect(isSel ? null : row.id) : undefined}
              style={onSelect ? { cursor: 'pointer' } : undefined}
            >
              {/* full-width hit target so the label and the empty track respond too */}
              <rect x={0} y={y(i) - rowHeight / 2} width={width} height={rowHeight} fill="transparent" />

              <text className="lolli-label" x={PAD.left - 12} y={y(i)} textAnchor="end" dominantBaseline="middle">
                {row.label}
              </text>

              {/* the unfilled remainder, so each row reads as a scale not a bar */}
              <line className="lolli-track" x1={x(0)} x2={x(max)} y1={y(i)} y2={y(i)} />

              <line
                className="lolli-stem"
                x1={x(0)}
                x2={x(row.value)}
                y1={y(i)}
                y2={y(i)}
                stroke={row.color}
                style={{ animationDelay: `${i * 70}ms` }}
              />

              {/* target tick: the number the value is supposed to beat */}
              {row.target != null && (
                <line
                  className="lolli-target"
                  x1={x(row.target)}
                  x2={x(row.target)}
                  y1={y(i) - 9}
                  y2={y(i) + 9}
                />
              )}

              <circle
                className="lolli-dot"
                cx={x(row.value)}
                cy={y(i)}
                r={isSel || hover === i ? 8 : 6.5}
                fill={row.color}
                style={{ animationDelay: `${i * 70 + 120}ms` }}
              />

              <text className="lolli-value" x={x(max) + 12} y={y(i)} dominantBaseline="middle">
                {valueFormat(row.value)}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && rows[hover].detail && (
        <div className="lolli-tip" style={{ top: y(hover) - 6 }}>
          {rows[hover].detail}
        </div>
      )}
    </div>
  );
}
