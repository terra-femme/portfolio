/**
 * Chart primitives: measurement, scales, path geometry, formatting.
 *
 * There is no charting library in this project on purpose. Everything renders
 * as plain SVG, which means no runtime dependency, no bundle weight, and total
 * control over how the marks look on a dark canvas.
 *
 * The one non-obvious decision in here is `useMeasure`. The lazy way to make an
 * SVG chart responsive is a fixed viewBox plus preserveAspectRatio="none", but
 * that scales the whole coordinate system -- stroke widths stretch, text
 * distorts, and circles turn into eggs. Instead every chart measures its own
 * container and draws at real pixel dimensions, so a 1px gridline is 1px at
 * every viewport width.
 */

import { useEffect, useRef, useState } from 'react';

/* ------------------------------------------------------------ measurement */

/**
 * Observe an element's content box.
 * Returns [ref, { width, height }]; both are 0 until the first observation,
 * so callers must skip drawing on the first paint.
 */
export function useMeasure() {
  const ref = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      // contentRect excludes padding and border, which is exactly the drawable
      // area we want. Round to whole pixels so sub-pixel jitter during a
      // window drag doesn't trigger a re-render on every frame.
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, box];
}

/* ---------------------------------------------------------------- scaling */

/** Map a value from a data domain onto a pixel range. */
export function scaleLinear(domainMin, domainMax, rangeMin, rangeMax) {
  const span = domainMax - domainMin || 1; // guard the flat-series divide-by-zero
  return (value) => rangeMin + ((value - domainMin) / span) * (rangeMax - rangeMin);
}

/**
 * Round a domain outward to human-friendly tick values.
 * Raw min/max produce axes labelled 812, 1043, 1274 -- technically correct and
 * unreadable. This snaps to 1/2/5 x 10^n steps the way a person would.
 */
export function niceScale(min, max, tickCount = 5) {
  if (min === max) {
    min = Math.min(0, min);
    max = max || 1;
  }
  const rawStep = (max - min) / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;

  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks = [];
  // Accumulate with a multiplier rather than `t += step` so floating-point
  // error can't drift the last tick to 4999.999999999.
  for (let i = 0; niceMin + i * step <= niceMax + step * 1e-9; i += 1) {
    ticks.push(Number((niceMin + i * step).toPrecision(12)));
  }
  return { min: niceMin, max: niceMax, ticks, step };
}

/* ----------------------------------------------------------------- curves */

/**
 * Monotone cubic interpolation (Fritsch-Carlson), emitted as an SVG path.
 *
 * Why not a plain Catmull-Rom spline: Catmull-Rom overshoots. Feed it a series
 * that rises to a plateau and the curve bulges ABOVE the highest data point,
 * drawing a value that does not exist. On a chart that claims to show p95
 * latency that is not a cosmetic problem, it is a lie. Monotone cubic is
 * guaranteed never to overshoot between points.
 */
export function monotonePath(points) {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M ${points[0].x} ${points[0].y}`;
  if (n === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  // Secant slopes between consecutive points.
  const dx = [];
  const dy = [];
  const slope = [];
  for (let i = 0; i < n - 1; i += 1) {
    dx[i] = points[i + 1].x - points[i].x;
    dy[i] = points[i + 1].y - points[i].y;
    slope[i] = dy[i] / (dx[i] || 1);
  }

  // Tangents: average of neighbouring secants, forced to 0 at local extrema.
  const m = [slope[0]];
  for (let i = 1; i < n - 1; i += 1) {
    if (slope[i - 1] * slope[i] <= 0) {
      m[i] = 0; // sign change => this is a peak or trough => flatten it
    } else {
      m[i] = (slope[i - 1] + slope[i]) / 2;
    }
  }
  m[n - 1] = slope[n - 2];

  // Fritsch-Carlson clamp: keep each tangent inside 3x the local secant, which
  // is the condition that actually guarantees monotonicity.
  for (let i = 0; i < n - 1; i += 1) {
    if (slope[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / slope[i];
    const b = m[i + 1] / slope[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * slope[i];
      m[i + 1] = t * b * slope[i];
    }
  }

  // Hermite tangents -> cubic Bezier control points.
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < n - 1; i += 1) {
    const c1x = points[i].x + dx[i] / 3;
    const c1y = points[i].y + (m[i] * dx[i]) / 3;
    const c2x = points[i + 1].x - dx[i] / 3;
    const c2y = points[i + 1].y - (m[i + 1] * dx[i]) / 3;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${points[i + 1].x} ${points[i + 1].y}`;
  }
  return d;
}

/** Close a line path down to a baseline to make a fillable area. */
export function areaPath(points, baselineY) {
  if (points.length === 0) return '';
  const line = monotonePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

/**
 * A donut segment as a single filled path.
 * Angles are radians, measured clockwise from 12 o'clock, which is how people
 * read a pie -- SVG's native 0-is-3-o'clock convention is offset here once so
 * no caller has to think about it.
 */
export function arcPath(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const polar = (r, a) => {
    const t = a - Math.PI / 2;
    return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
  };

  // A full circle can't be drawn as one arc (start and end coincide, so the
  // renderer draws nothing). Nudge it just short of closing.
  const sweep = Math.min(endAngle - startAngle, Math.PI * 2 - 1e-6);
  const end = startAngle + sweep;
  const largeArc = sweep > Math.PI ? 1 : 0;

  const o1 = polar(rOuter, startAngle);
  const o2 = polar(rOuter, end);
  const i2 = polar(rInner, end);
  const i1 = polar(rInner, startAngle);

  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ');
}

/** Rounded-rectangle path with per-side control, for bars with capped tops. */
export function roundedTopRect(x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, w / 2, h));
  return [
    `M ${x} ${y + h}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + w - radius} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + radius}`,
    `L ${x + w} ${y + h}`,
    'Z',
  ].join(' ');
}

/* ------------------------------------------------------------- formatting */

const NBSP = ' '; // thin space, for unit separation that doesn't wrap

export function fmtCompact(n, decimals = 1) {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(decimals) + 'B';
  if (abs >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
  if (abs >= 1e3) return (n / 1e3).toFixed(abs >= 1e4 ? 0 : decimals) + 'k';
  return String(Math.round(n));
}

export function fmtNumber(n, decimals = 0) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtCurrency(n, decimals = 0) {
  return '$' + fmtNumber(n, decimals);
}

export function fmtPercent(fraction, decimals = 0) {
  return (fraction * 100).toFixed(decimals) + '%';
}

export function fmtSigned(n, decimals = 1) {
  return (n > 0 ? '+' : '') + n.toFixed(decimals) + NBSP + '%';
}

/** Days between an ISO date and the fixed "today" the mock data is built on. */
export function daysUntil(iso, from = '2026-09-10') {
  const ms = new Date(iso + 'T00:00:00Z') - new Date(from + 'T00:00:00Z');
  return Math.round(ms / 86400000);
}
