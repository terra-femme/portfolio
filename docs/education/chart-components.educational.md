# `src/dashboard/charts/*.jsx`: Educational Companion

Covers `LineChart`, `BarChart`, `Donut`, `HBar`, `Sparkline`, `Heatmap`, `Gauge`.
The shared maths lives in `primitives.js` (see its own companion file).

---

## The shared contract

Every chart that plots a series accepts the same row shape:

```js
[{ label, value }]            // single series
[{ label, values: [a, b, c] }] // one entry per key
```

and normalises internally:

```js
const matrix = keys.map((_, s) =>
  rows.map((r) => (Array.isArray(r.values) ? r.values[s] : r.value))
);
```

**Why normalise in the chart rather than in the data files:** the data modules
should describe *the data*, not a chart's preferred argument order. Because the
shape is shared, a panel can switch from `<LineChart>` to `<BarChart>` by
changing one identifier. Which is exactly what happened while building the cost
page.

---

## When SVG, and when not

A recurring judgement call, made three different ways in this folder:

| Component | Technology | Reason |
|---|---|---|
| `LineChart`, `BarChart`, `Donut`, `Gauge`, `Sparkline` | SVG | geometry *is* the content |
| `HBar` | divs + flex | dominated by text labels |
| `Heatmap` | CSS grid | a grid of coloured boxes is literally `display: grid` |

**The reasoning for `HBar`:** horizontal bar charts are mostly labels. Real HTML
text wraps, truncates with `text-overflow: ellipsis`, is selectable, and is read
correctly by screen readers. SVG `<text>` does none of that without significant
work. SVG earns its place where you need arbitrary geometry; a bar is a
rectangle, and HTML already has excellent rectangles.

**The reasoning for `Heatmap`:** `color-mix()` in CSS lets the colour ramp be
expressed in terms of theme tokens, so the cells and the legend gradient are
guaranteed to agree. They read the same two custom properties.

---

## `LineChart`

### Hover interaction

```js
const handleMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const ratio = (px - PAD.left) / innerW;
  const idx = Math.round(ratio * (rows.length - 1));
  setHover(Math.max(0, Math.min(rows.length - 1, idx)));
};
```

Mouse position → nearest data index, clamped to valid range.

- `getBoundingClientRect()` converts viewport coordinates to element-local ones.
- One handler on the `<svg>` rather than per-point hit targets: 30 invisible
  circles would each need their own listener, and the gaps between them would be
  dead zones where the tooltip flickers off.
- `Math.round` (not `floor`) snaps to the *nearest* point, so the crosshair
  tracks the cursor symmetrically.

### Tooltip edge flipping

```jsx
style={{
  left:  x(hover) > width * 0.6 ? undefined : x(hover) + 14,
  right: x(hover) > width * 0.6 ? width - x(hover) + 14 : undefined,
}}
```

Past 60% of the width, the tooltip anchors by its right edge instead and grows
leftward. Without this it is clipped by the panel on the last third of every
chart. The region users hover most, because it is the most recent data.

`pointer-events: none` on the tooltip is essential: a tooltip that can receive
the mouse steals hover from the chart underneath and flickers infinitely.

### Stacking

```js
const plotted = stacked
  ? matrix.map((_, s) =>
      rows.map((_, i) => matrix.slice(0, s + 1).reduce((sum, ser) => sum + ser[i], 0)))
  : matrix;
```

Each stacked series is drawn at its **cumulative** height, so series 2 is the
sum of 0, 1, and 2. The areas are painted in order, so later (taller) bands sit
behind earlier ones and the visible result reads bottom-up.

Note that the tooltip reads from `matrix` (raw values) while the geometry reads
from `plotted` (cumulative). Showing a reader "AI Speech: $12,730" when the band
is worth $4,310 would be a straightforward lie.

### `useId` for gradients

```js
const gradientId = useId();
<linearGradient id={`${gradientId}-${s}`}>
```

SVG `<defs>` ids are **global to the document**. Two charts on the same page
both using `id="grad-0"` means the second silently steals the first's fill.
React 18's `useId` generates collision-free ids that are also stable between
server and client rendering.

---

## `BarChart`

### Stacked axis maths

```js
const peaks = stacked
  ? rows.map((_, i) => matrix.reduce((sum, ser) => sum + ser[i], 0))
  : matrix.flat();
```

A stacked column is as tall as its **total**, not its tallest band. Scaling to
the tallest single value clips every column. This is the single most common
stacked-bar bug.

### Corner rounding

```jsx
d={roundedTopRect(bx, by, w, barH, !stacked || s === keys.length - 1 ? 4 : 0)}
```

Only the top band of a stack gets rounded corners. Rounding every band leaves
visible notches where the segments meet, so the column looks like a stack of
separate pills rather than one bar.

### Invisible hit targets

```jsx
<rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
```

38% of each slot is gutter. Without a full-height transparent target, hovering
the gap between bars dismisses the tooltip and the whole chart feels twitchy.

### `transform-box: fill-box`

```css
.chart-bar {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: grow-up 0.6s ...;
}
```

By default an SVG element's `transform-origin` is resolved against the **whole
SVG viewport**, so `50% 100%` means the middle-bottom of the *chart*, and bars
animate by sliding in from the bottom-left. `fill-box` re-resolves it against
each element's own bounding box, so every bar grows from its own base.

---

## `Donut`

### The hole is the feature

```jsx
<div className="donut-value">{valueFormat(focused ? focused.value : total)}</div>
```

The centre shows the total, and swaps to a segment's own value on hover. This is
the entire justification for a donut over a pie: humans are bad at judging
angles, so the hole provides a free slot for the number they actually want.
A pie chart forces estimation; a donut with a live centre readout does not.

### Growth, not explosion

```js
hover === i ? rOuter : rOuter - 3
```

The focused segment grows 3px outward rather than detaching from the ring.
Exploded slices break the shape that communicates "these are parts of one whole".

### Bidirectional legend

Hovering a legend row highlights the arc, and hovering an arc dims the other
legend rows. Both directions share one `hover` state, so they cannot disagree.

---

## `Heatmap`

### Perceptual gamma

```js
const t = (v - min) / (max - min || 1);
return Math.pow(t, 0.7);
```

A linear ramp is the obvious choice and it fails on real data. The error
heatmap's incident hour is 46 errors per 10k while normal hours are 1 to 15. Linear
mapping puts an ordinary busy hour at `15/46 = 33%` intensity, and the quiet
majority near 2%. The map reads as empty with one bright dot.

`Math.pow(t, 0.7)` lifts the low end: 33% becomes 46%, and ordinary variation
becomes visible again while the outlier still dominates. This mirrors how human
brightness perception works. Roughly a power law, not linear.

### The layout bug that testing caught

The first version used `aspect-ratio: 1` for square cells. In a 24-column panel
that gave neat ~28px squares. In the 12-column engagement panel at full width,
each column was ~100px wide, so each cell became **100px tall** and one heatmap
filled the entire screen.

The fix decouples height from column count:

```css
height: clamp(16px, 2.6vw, 32px);
```

**Lesson:** `aspect-ratio` makes one dimension a function of the other. In a
fluid grid the width is unbounded, so the height is too. Whenever a size derives
from available space, ask what it does at the extremes.

### `display: contents`

```jsx
<div className="heatmap-row" style={{ display: 'contents' }}>
```

Rows exist in JSX for readability, but `display: contents` removes the wrapper
box from layout so the cells become direct grid items of the parent. This gets
semantic grouping in the markup without a nested grid.

---

## `Gauge`

### A deliberately truncated axis

```js
{ label: 'Availability', value: 99.94, target: 99.9, floor: 99.5 }
```

The scale runs 99.5→100, not 0→100. Truncating an axis is normally a
data-visualisation sin because it exaggerates differences. The exception is a
**bounded metric with a threshold**: on a 0 to 100 availability gauge, 99.94% and
99.2% are the same indistinguishable sliver, and the reader's actual question.
"are we above the line?". Becomes unanswerable.

The honesty requirement is that the line must be drawn, which is what the target
tick does:

```jsx
<line className="gauge-tick" x1={tIn.x} y1={tIn.y} x2={tOut.x} y2={tOut.y} />
```

Plus an explicit text label: `Meeting target 99.9%`. Truncate the axis, but never
hide the threshold.

### 270°, not 360°

```js
const START = -Math.PI * 0.75;
const SWEEP = Math.PI * 1.5;
```

The gap at the bottom gives the eye an unambiguous start and end. A full circle
has no visual anchor for "zero".

---

## `Sparkline`

### No ResizeObserver, on purpose

Sparklines live in table cells at a known size. Attaching an observer to every
row of a 14-row table costs more than it could buy. Fixed `width`/`height` props.

### Domain padding

```js
const pad = (max - min) * 0.08 || 1;
```

Without padding, a series ending at its own maximum has its final point centred
exactly on the top edge, and half the 1.6px stroke plus the 2.4px end dot is
clipped. The `|| 1` handles a completely flat series, where `max - min === 0`.

### Colour encodes direction

```jsx
color={r.spark[7] >= r.spark[0] ? 'var(--c-ok)' : 'var(--c-crit)'}
```

Scanning the accounts table, the red sparklines are instantly locatable. This is
preattentive processing. Colour is perceived before you consciously read
anything, so it does navigational work that a number cannot.

---

## Common pitfalls, summarised

| Pitfall | Consequence | Guard |
|---|---|---|
| Duplicate SVG `<defs>` ids | second chart steals first's gradient | `useId()` |
| Tooltip receives pointer events | infinite hover flicker | `pointer-events: none` |
| Stacked axis scaled to tallest band | columns clipped | scale to column totals |
| Tooltip reads cumulative values | reports wrong numbers | tooltip reads raw `matrix` |
| `transform-origin` on SVG | bars fly in from the corner | `transform-box: fill-box` |
| `aspect-ratio` in a fluid grid | 100px-tall heatmap cells | fixed `clamp()` height |
| Linear heatmap ramp with outliers | map reads as empty | gamma 0.7 |
| Full-circle arc | renders nothing | clamp sweep below 2π |
| Sparkline clipped at extremes | final point half-drawn | 8% domain padding |

---

## ELI5

Each file draws one kind of picture from a list of numbers. They all accept the
list in the same format, so swapping one picture for another is a one-word
change. The tricky parts are all about not lying: don't let a smooth curve
invent a peak, don't scale a stack to the wrong height, don't show the total
when the reader is pointing at one slice, and don't hide the line a number is
supposed to beat.
