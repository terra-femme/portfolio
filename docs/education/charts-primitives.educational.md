# `src/dashboard/charts/primitives.js` — Educational Companion

Covers the measurement, scaling, curve-geometry and formatting layer that every
chart in the dashboard is built on.

---

## Why this file exists at all

The dashboard renders every chart as hand-written SVG. No Recharts, no Chart.js,
no D3. That was a deliberate trade:

| | Charting library | Hand-rolled SVG |
|---|---|---|
| Bundle cost | 50–200 kB | 0 kB beyond your own code |
| Visual control | Fight the theme | Total |
| Dark-mode behaviour | Often an afterthought | Yours by construction |
| Portfolio signal | "I can call an API" | "I understand the math" |
| Time to first chart | Minutes | Hours |

For a portfolio piece the last two rows dominate. The whole chart layer is under
600 lines and ships as part of a 52 kB bundle.

---

## Section 1 — `useMeasure`

```js
export function useMeasure() {
  const ref = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setBox((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, box];
}
```

### Syntax breakdown

- `useRef(null)` — a mutable box that survives re-renders. Attaching it via
  `<div ref={ref}>` makes React assign the DOM node to `ref.current`.
- `ResizeObserver` — a browser API that fires whenever an observed element's box
  changes. Unlike a `window.resize` listener, it also catches changes caused by
  *layout* (a sidebar opening, a panel reflowing), not just the window.
- `([entry])` — array destructuring in the parameter position. The callback
  receives an array of entries; we observe one element, so we take the first.
- `setBox((prev) => ...)` — the functional update form. Returning `prev`
  unchanged is how you tell React "nothing happened, skip the re-render".

### The theory: why not `viewBox` + `preserveAspectRatio`

The tempting shortcut for a responsive SVG is:

```html
<svg viewBox="0 0 800 300" preserveAspectRatio="none" width="100%"></svg>
```

This scales the entire coordinate system to fit. Everything scales — including
things that should never scale:

- a `stroke-width: 2` line becomes 3.4px wide on a wide screen and 1.1px on a
  narrow one
- text stretches horizontally into distorted lettering
- `<circle r="4">` renders as an ellipse

Measuring the container and drawing at **real pixel dimensions** means a 1px
gridline is 1px at every viewport width. The cost is one ResizeObserver per
chart and a first render where `width === 0`, which each chart handles by
reserving its height and drawing nothing.

### Pitfall: the ResizeObserver loop

Returning `prev` when dimensions are unchanged is not an optimisation, it is a
correctness guard. Without it, sub-pixel jitter during a window drag re-renders
the chart on every frame, which can resize the container, which fires the
observer again. Browsers detect this and log
`ResizeObserver loop completed with undelivered notifications`. Rounding to
whole pixels *and* bailing on equality breaks the cycle at both ends.

---

## Section 2 — `niceScale`

```js
const rawStep = (max - min) / tickCount;
const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
const residual = rawStep / magnitude;
const step = (residual > 5 ? 10 : residual > 2 ? 5 : residual > 1 ? 2 : 1) * magnitude;
```

### What it does

Turns an ugly data range into human tick marks.

Given latency data from 206 to 3820 and a request for 5 ticks:

- `rawStep = (3820 - 206) / 5 = 722.8`
- `magnitude = 10^floor(log10(722.8)) = 10^2 = 100`
- `residual = 7.228` → greater than 5 → multiplier `10`
- `step = 1000`
- axis becomes `0, 1000, 2000, 3000, 4000`

Without this the axis would read `206, 928, 1651, 2374, 3096` — technically
accurate and unreadable.

### The theory

People read numbers in powers of 1, 2, and 5 (think coins, rulers, and every
axis you have ever seen). The algorithm snaps the raw step *up* to the nearest
such value, then extends the domain outward to land on clean multiples.

### The floating-point pitfall

```js
for (let i = 0; niceMin + i * step <= niceMax + step * 1e-9; i += 1) {
  ticks.push(Number((niceMin + i * step).toPrecision(12)));
}
```

Two guards here, both earned:

1. **Multiply, don't accumulate.** `t += step` compounds binary rounding error.
   With `step = 0.1`, ten additions give `0.9999999999999999`. Multiplying from
   the origin keeps error constant instead of growing.
2. **The `1e-9` epsilon.** The final tick often computes to something like
   `4000.0000000000005`, which fails a plain `<= 4000` test and silently drops
   the top gridline. The epsilon absorbs it.

---

## Section 3 — `monotonePath`: the most important function here

### The problem it solves

A smooth curve through data points is drawn with cubic Bézier segments, and the
question is where to put the control points. The popular answer is a
**Catmull-Rom spline**, which is smooth and easy. It is also *wrong for data*.

Catmull-Rom **overshoots**. Feed it a series that climbs and then flattens —
say `[10, 20, 30, 30, 30]` — and the curve bulges above 30 between the third and
fourth points. The chart then draws a value that never occurred.

On a chart labelled "p95 latency" that is not a cosmetic issue. It is a picture
of an SLO breach that did not happen.

### The algorithm (Fritsch–Carlson, 1980)

**Step 1 — secant slopes.** The straight-line slope between each pair:

```js
slope[i] = dy[i] / dx[i];
```

**Step 2 — initial tangents.** Average the neighbouring secants, but force a
flat tangent at any local peak or trough:

```js
if (slope[i - 1] * slope[i] <= 0) {
  m[i] = 0;                                  // sign change => extremum
} else {
  m[i] = (slope[i - 1] + slope[i]) / 2;
}
```

A negative product means the data changed direction. Flattening the tangent
there is what stops the curve from sailing past the actual peak.

**Step 3 — the monotonicity clamp.** This is the part that makes the guarantee
real:

```js
const a = m[i] / slope[i];
const b = m[i + 1] / slope[i];
const s = a * a + b * b;
if (s > 9) {
  const t = 3 / Math.sqrt(s);
  m[i] = t * a * slope[i];
  m[i + 1] = t * b * slope[i];
}
```

Fritsch and Carlson proved that a cubic Hermite segment is monotone **iff** the
point `(a, b)` lies inside a particular region, and that the circle of radius 3
sits safely inside it. So: if `a² + b² > 9`, project back onto that circle.
That is exactly what `t = 3 / sqrt(s)` does.

**Step 4 — Hermite to Bézier.** SVG speaks Bézier, the algorithm speaks
tangents. The conversion is fixed:

```js
c1 = (x[i]   + dx/3,  y[i]   + m[i]   * dx/3)
c2 = (x[i+1] - dx/3,  y[i+1] - m[i+1] * dx/3)
```

The `/3` is not a tuning constant — it falls out of the algebra relating the
cubic Hermite basis to the Bernstein basis.

### ELI5

Imagine drawing a smooth line through dots with a flexible ruler. A normal
flexible ruler springs past the dots on tight turns, drawing hills that were
never there. This version checks every bend and stiffens the ruler wherever it
is about to overshoot. The line still looks smooth, but it never invents a value.

---

## Section 4 — `arcPath`

```js
const polar = (r, a) => {
  const t = a - Math.PI / 2;
  return { x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) };
};
```

### Two conventions being reconciled

SVG's native angle 0 points at **3 o'clock** and y grows **downward**. Humans
read a pie starting at **12 o'clock**. Subtracting `π/2` once, in one helper,
means no caller anywhere else has to think about it.

### The full-circle trap

```js
const sweep = Math.min(endAngle - startAngle, Math.PI * 2 - 1e-6);
```

An SVG arc is defined by its two endpoints. For a 360° sweep those endpoints are
the *same point*, so the renderer has no way to know you meant "all the way
round" — and draws nothing at all. A donut with a single 100% segment
disappears. Clamping just short of a full turn leaves a gap of about 0.00006
radians: mathematically present, visually invisible.

### The `largeArcFlag`

```js
const largeArc = sweep > Math.PI ? 1 : 0;
```

Any two points on a circle can be joined two ways — the short way or the long
way. This flag picks. Get it wrong and a 70% slice renders as the 30% slice.

---

## Best practices demonstrated

1. **One conversion, one place.** The polar-angle offset and the number
   formatters exist once. Duplicated conversions drift apart over time.
2. **Guard the degenerate case.** `domainMax - domainMin || 1` stops a
   flat series (every value identical) from dividing by zero and rendering `NaN`
   into the DOM, which fails silently and invisibly.
3. **Comment the *why*, not the *what*.** `slope[i] = dy[i] / dx[i]` needs no
   comment. The Fritsch–Carlson clamp needs a paragraph.
4. **Pure functions are testable.** Everything except `useMeasure` takes numbers
   and returns numbers or strings. `monotonePath` could be unit-tested with no
   DOM at all.

---

## Where this sits in the architecture

```
data/*.js          plain numbers, no chart knowledge
      ↓
primitives.js      measurement · scales · geometry · formatting   ← this file
      ↓
charts/*.jsx       LineChart, BarChart, Donut, Heatmap, Gauge, ...
      ↓
pages/*.jsx        compose charts into a report page
      ↓
Dashboard.jsx      shell, navigation, routing
```

Dependencies point strictly downward. `primitives.js` imports nothing from the
project — only React — so it could be lifted into another project unchanged.

---

## Potential bugs and pitfalls

| Risk | Where | Mitigation in place |
|---|---|---|
| Divide by zero on a flat series | `scaleLinear` | `|| 1` fallback |
| Dropped final gridline | `niceScale` | epsilon in the loop condition |
| Curve overshoot inventing values | `monotonePath` | Fritsch–Carlson clamp |
| Invisible 100% donut segment | `arcPath` | sweep clamped below 2π |
| Inverted large slices | `arcPath` | `largeArcFlag` computed from sweep |
| ResizeObserver feedback loop | `useMeasure` | round + bail on equality |
| `n < 3` crashing the spline | `monotonePath` | explicit 0/1/2-point branches |

**Untested edge case worth knowing about:** `monotonePath` assumes strictly
increasing x. Every caller generates x from an array index, so this holds — but
it would need revisiting for a scatter plot or a time series with duplicate
timestamps.
