import { useMemo, useState } from 'react';
import { useMeasure } from './primitives';
import { LAND, MAP_ASPECT, project, ringToPath } from './worldOutline';

/**
 * World bubble map: one marker per Azure region, sized by traffic share, with
 * animated arcs showing inter-region flow.
 *
 * Bubbles rather than a choropleth. A cloud region is a POINT -- a specific
 * datacenter metro -- not a country. Shading all of Sweden because one
 * datacenter sits in Gavle would overstate the footprint enormously and imply
 * a national presence that does not exist. Bubbles say "here, this much",
 * which is the actual claim.
 *
 * `maxHeight` caps the drawing so the map stays one panel on a dashboard
 * rather than taking over the page. The cap scales the whole map DOWN and
 * centres it, rather than cropping the latitude range: cropping would slice
 * flat across northern Canada, Russia and Greenland, and a coastline cut off
 * in a straight line reads as a rendering bug rather than a design decision.
 */
export default function RegionMap({ regions, flows = [], maxHeight = 208, legend = true }) {
  const [wrapRef, { width }] = useMeasure();
  const [hover, setHover] = useState(null);

  // Fit to the container, then cap, preserving aspect ratio throughout.
  const h = width ? Math.min(width / MAP_ASPECT, maxHeight) : 0;
  const w = h * MAP_ASPECT;
  const offset = Math.max(0, (width - w) / 2); // centring gutter

  // Land geometry only depends on size, so it is memoised -- reprojecting ~250
  // vertices on every hover would be wasteful.
  const landPaths = useMemo(
    () => (w ? LAND.map((ring) => ringToPath(ring, w, h)) : []),
    [w, h]
  );

  if (width === 0) {
    return <div className="map-wrap" ref={wrapRef} style={{ minHeight: maxHeight }} />;
  }

  const byId = Object.fromEntries(regions.map((r) => [r.id, r]));
  const maxValue = Math.max(...regions.map((r) => r.value));

  // Area, not radius, proportional to value. Scaling the radius linearly would
  // make a 42% region look ~4.7x the area of a 9% one instead of ~2.2x -- the
  // classic way bubble maps exaggerate their largest value.
  const radius = (value) => 4 + 9 * Math.sqrt(value / maxValue);

  const pt = (r) => project(r.lon, r.lat, w, h);

  /** Quadratic curve between two projected points, bowing perpendicular. */
  const quad = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy) || 1;
    // Perpendicular unit vector, sign fixed so every arc bows the same way and
    // parallel routes never cross each other.
    const nx = -dy / dist;
    const ny = dx / dist;
    const bow = Math.min(dist * 0.22, h * 0.3);
    return `M ${p1.x} ${p1.y} Q ${p1.x + dx / 2 + nx * bow} ${p1.y + dy / 2 + ny * bow} ${p2.x} ${p2.y}`;
  };

  /**
   * Route between two regions, taking the SHORTER way around the globe.
   *
   * East US (-78.5) to Australia East (151.2) is 230 degrees apart going east
   * but only 130 going west. Drawn naively the arc sweeps across Africa and the
   * Indian Ocean -- a path no packet takes, and one that visibly contradicts
   * the "East US is the primary" story by making Australia look adjacent to
   * Europe. When the gap exceeds 180 degrees the target longitude is shifted a
   * full turn so the curve exits one edge, then the same curve is redrawn
   * shifted by a map width so it re-enters from the other. The SVG is clipped,
   * so the off-canvas halves are never seen.
   */
  const routes = (a, b) => {
    let lon2 = b.lon;
    const delta = lon2 - a.lon;
    if (delta > 180) lon2 -= 360;
    else if (delta < -180) lon2 += 360;

    const p1 = project(a.lon, a.lat, w, h);
    const p2 = project(lon2, b.lat, w, h);
    if (lon2 === b.lon) return [quad(p1, p2)];

    const shift = lon2 < b.lon ? w : -w;
    return [
      quad(p1, p2),
      quad({ x: p1.x + shift, y: p1.y }, { x: p2.x + shift, y: p2.y }),
    ];
  };

  const focused = hover ? byId[hover] : null;
  const isDim = (id) => hover !== null && hover !== id;

  return (
    <div className="map-wrap" ref={wrapRef}>
      <svg
        className="map-svg"
        width={w}
        height={h}
        role="img"
        aria-label={`World map showing ${regions.length} Azure regions by traffic share`}
      >
        <defs>
          <radialGradient id="region-glow">
            <stop offset="0%" stopColor="var(--c-1)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--c-1)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* graticule: every 30 degrees, purely for spatial reference */}
        <g className="map-grid">
          {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lon) => {
            const x = project(lon, 0, w, h).x;
            return <line key={`m${lon}`} x1={x} y1={0} x2={x} y2={h} />;
          })}
          {[60, 30, 0, -30].map((lat) => {
            const y = project(0, lat, w, h).y;
            return <line key={`p${lat}`} x1={0} y1={y} x2={w} y2={y} />;
          })}
        </g>

        <g className="map-land">
          {landPaths.map((d, i) => <path key={i} d={d} />)}
        </g>

        {/* flows under the markers so bubbles always sit on top */}
        <g className="map-flows">
          {flows.map((f) => {
            const a = byId[f.from];
            const b = byId[f.to];
            if (!a || !b) return null;
            const dim = hover !== null && hover !== f.from && hover !== f.to;
            return routes(a, b).map((d, i) => (
              <path
                key={`${f.from}-${f.to}-${i}`}
                className={dim ? 'map-flow is-dimmed' : 'map-flow'}
                d={d}
                strokeWidth={0.7 + (f.volume / 42) * 1.4}
              />
            ));
          })}
        </g>

        <g className="map-markers">
          {regions.map((r) => {
            const p = pt(r);
            const rad = radius(r.value);
            return (
              <g
                key={r.id}
                className={isDim(r.id) ? 'map-marker is-dimmed' : 'map-marker'}
                onMouseEnter={() => setHover(r.id)}
                onMouseLeave={() => setHover(null)}
              >
                <circle cx={p.x} cy={p.y} r={rad * 2.3} fill="url(#region-glow)" />
                {/* the largest region gets a pulsing ring: it is the primary,
                    and the concentration risk is the page's actual finding */}
                {r.value === maxValue && (
                  <circle className="map-pulse" cx={p.x} cy={p.y} r={rad} />
                )}
                <circle className="map-dot" cx={p.x} cy={p.y} r={rad} />
                <circle className="map-core" cx={p.x} cy={p.y} r={Math.max(1.4, rad * 0.3)} />
                {/* generous invisible hit area -- a 6px bubble is a hard target */}
                <circle cx={p.x} cy={p.y} r={Math.max(rad + 9, 16)} fill="transparent" />
              </g>
            );
          })}
        </g>
      </svg>

      {focused && (
        <div
          className="map-tooltip"
          style={{
            // Marker positions are map-local, so the centring gutter has to be
            // added back or the tooltip drifts left of its bubble on wide panels.
            left: pt(focused).x > w * 0.62 ? undefined : offset + pt(focused).x + 16,
            right: pt(focused).x > w * 0.62 ? width - offset - pt(focused).x + 16 : undefined,
            top: Math.max(2, pt(focused).y - 30),
          }}
        >
          <div className="tt-title">{focused.label}</div>
          <div className="tt-row"><span className="tt-key">Share</span><span className="tt-val">{focused.value}%</span></div>
          <div className="tt-row"><span className="tt-key">Requests</span><span className="tt-val">{focused.requests}</span></div>
          <div className="tt-row"><span className="tt-key">p95</span><span className="tt-val">{focused.p95}ms</span></div>
        </div>
      )}

      {legend && (
        <ul className="map-legend">
          {regions.map((r) => (
            <li
              key={r.id}
              className={isDim(r.id) ? 'is-dimmed' : undefined}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
            >
              <span
                className="legend-dot"
                style={{ width: 5 + (r.value / maxValue) * 5, height: 5 + (r.value / maxValue) * 5 }}
              />
              <span className="legend-label">{r.label}</span>
              <span className="legend-value">{r.value}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
