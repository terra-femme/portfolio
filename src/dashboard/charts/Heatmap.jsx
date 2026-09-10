import { useState } from 'react';

/**
 * Grid heatmap (CSS grid, not SVG -- see HBar for the reasoning on labels).
 *
 * Colour comes from a two-stop ramp driven by `color-mix`, so the whole scale
 * derives from the theme's accent tokens and stays correct if those change.
 * A perceptual gamma of 0.7 lifts the low end: with a linear ramp, a dataset
 * with one big outlier washes every ordinary cell out to near-background and
 * the map reads as empty.
 */
export default function Heatmap({ rows, rowLabels, colLabels, valueLabel = 'value', ramp = 'var(--c-1)' }) {
  const [hover, setHover] = useState(null); // { r, c }

  const flat = rows.flat();
  const max = Math.max(...flat);
  const min = Math.min(...flat);

  const intensity = (v) => {
    const t = (v - min) / (max - min || 1);
    return Math.pow(t, 0.7);
  };

  return (
    // `ramp` sets the hot end of the scale per instance: errors read as red,
    // engagement reads as green. Both ends stay theme tokens, so the legend
    // gradient and the cells can never drift apart.
    <div className="heatmap" style={{ '--heat-hot': ramp }}>
      <div className="heatmap-grid" style={{ gridTemplateColumns: `auto repeat(${rows[0].length}, minmax(0, 1fr))` }}>
        {rows.map((row, r) => (
          <div className="heatmap-row" key={rowLabels[r]} style={{ display: 'contents' }}>
            <div className="heatmap-rowlabel">{rowLabels[r]}</div>
            {row.map((value, c) => {
              const t = intensity(value);
              return (
                <div
                  key={c}
                  className="heatmap-cell"
                  style={{
                    // Below ~15% intensity we blend toward the surface colour so
                    // quiet cells read as "nothing happened", not "no data".
                    background: `color-mix(in oklab, var(--heat-hot) ${(t * 100).toFixed(1)}%, var(--heat-cold))`,
                  }}
                  onMouseEnter={() => setHover({ r, c, value })}
                  onMouseLeave={() => setHover(null)}
                  title={`${rowLabels[r]} ${colLabels[c]}: ${value} ${valueLabel}`}
                />
              );
            })}
          </div>
        ))}

        {/* column labels last so they sit in the final grid row */}
        <div className="heatmap-rowlabel" />
        {colLabels.map((label, c) => (
          <div className="heatmap-collabel" key={label + c}>
            {/* thin the labels out on narrow screens via CSS, not JS */}
            <span className={c % 2 === 1 ? 'is-odd' : undefined}>{label}</span>
          </div>
        ))}
      </div>

      <div className="heatmap-footer">
        <span className="heatmap-hint">
          {hover
            ? `${rowLabels[hover.r]} · ${colLabels[hover.c]} — ${hover.value} ${valueLabel}`
            : `Hover a cell for detail`}
        </span>
        <span className="heatmap-scale">
          <em>{min}</em>
          <span className="heatmap-ramp" />
          <em>{max}</em>
        </span>
      </div>
    </div>
  );
}
