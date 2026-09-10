# Mock data and styling — Educational Companion

Covers `src/dashboard/data/azure.js`, `src/dashboard/data/clients.js`,
`src/dashboard/dashboard.css`, and the pages that compose them.

---

## Part 1 — Designing mock data that doesn't look mock

Most mock data is random numbers with plausible labels, and it always reads as
fake. Three properties separate convincing synthetic data from noise.

### Property 1 — determinism

```js
const ANCHOR = new Date('2026-09-10T00:00:00Z');
```

No `Math.random()`, no `Date.now()` in any series. The dashboard renders
identically on every visit, which matters practically: a screenshot in a job
application still matches what the reviewer sees when they open the link a week
later. A seeded generator would also be reproducible, but it can produce ugly
shapes — and there is no reason to accept a random shape when you can author a
good one.

The anchor is fixed rather than derived from the real clock so the axis reads
like real dates without the data drifting as the calendar advances.

### Property 2 — internal consistency

This is what actually sells it. The Azure data contains one incident,
**INC-2291** on Aug 31, and it appears in four independent places:

| Series | What it shows |
|---|---|
| `dailySpend` | $705 → **$1,180** (retries are billed like first attempts) |
| `latencyDaily` | p95 832ms → **2,140ms**, p99 1,336 → **3,820ms** |
| `errorRateHeatmap` | row 4 spikes to **46**/10k across business hours |
| `incidents` | the `INC-2291` record, Sev 2, 3h 12m |

A reader who notices the spend spike can find its cause on another page. That
cross-referencing is what real telemetry feels like, and no amount of visual
polish substitutes for it.

The same technique runs through the client data: **Northwind Health Group** is
the largest account and it is quietly failing — health 38, trend −14, 11 open
tickets, no contact in 34 days, renewal in 55 days. Its $412k is exactly the
"ARR at risk" KPI, exactly the Q4 at-risk band in the renewal pipeline, and its
survey response is the July–August dip in the NPS trend.

### Property 3 — the numbers actually add up

```js
serviceMix: 8420 + 4310 + 2980 + 2240 + 1870 + 1120 + 890 + 810 = 22,640 ✓
```

which is the `spend` KPI. And in the client data:

```js
Enterprise accounts: 688k + 540k + 412k             = 1,640k ✓ segmentMix
Mid-Market:  296 + 264 + 248 + 232 + 210 + 198      = 1,448k ✓
SMB:         142 + 128 + 116 + 94 + 78              =   558k ✓
```

Anyone who adds a column and finds it disagrees with the headline stops
believing every other number on the page.

### The subtlety this forced

The 14 listed accounts sum to $3.65M, but total ARR is $4.82M. That is not an
error — the difference is the public-sector segment, reported in aggregate. But
"14 of 14 accounts" next to "All 68 accounts" reads as a contradiction, so the
label became **"14 of 14 named accounts"** with a comment explaining the
relationship. Consistent data still needs consistent *labelling*.

### A deliberate imperfection

```js
{ label: 'Q3 27', values: [604000, 132000, 0] },
```

A zero. Real pipelines have empty cells, and data where every number is
comfortably non-zero looks generated.

---

## Part 2 — Styling a dark BI canvas

### Why a separate stylesheet

`dashboard.css` never imports `index.css`. The portfolio is a light document
(`--bg-0: #ffffff`), the dashboard is dark (`--bg: #0b0f0d`). Sharing a
stylesheet would mean every rule fighting the other theme with overrides. Two
documents, two stylesheets, zero conflicts — and each bundle only ships what it
uses.

### Carrying the brand across a theme inversion

```css
--c-1: #35c46f;   /* dashboard */
/* portfolio: --accent: #1f8a4c */
```

Same hue, lifted luminance. `#1f8a4c` on `#0b0f0d` is too dark to read
comfortably; raising lightness while holding hue keeps it recognisably the same
green. **Brand colours are rarely portable between light and dark unchanged** —
what transfers is the hue, not the hex.

### The categorical palette

```css
--c-1: #35c46f;  --c-2: #2dd4bf;  --c-3: #5aa2ff;  --c-4: #a78bfa;
--c-5: #ef8fb4;  --c-6: #f5b74e;  --c-7: #86d9a4;  --c-8: #7d8fa9;
```

Ordered so the first three — the ones most charts actually reach for — differ in
**luminance as well as hue**. Hue-only palettes become unreadable for the ~8% of
men with red/green colour vision deficiency. Varying lightness too means the
series stay distinguishable even when the hue difference collapses.

Semantic colours are kept separate from categorical ones:

```css
--c-ok: #35c46f;  --c-warn: #f5b74e;  --c-crit: #f2626f;
```

Series colour answers "which one is this"; semantic colour answers "is this
good". Conflating them is how a chart ends up implying that the purple series is
worse than the green one.

### `color-mix()`

```css
background: color-mix(in oklab, var(--c-1) 14%, transparent);
```

Every tint derives from one token rather than being a separately maintained hex.
Change `--c-1` and the nav highlight, callout background, pill fill, and meter
fill all follow.

`in oklab` specifies a **perceptually uniform** colour space. Mixing in sRGB
produces muddy midpoints, especially toward grey; oklab keeps the intermediate
colours looking like the colour you asked for at the intensity you asked for.

### Responsive strategy

Three breakpoints, each with a job:

```css
@media (max-width: 1240px) { /* wide panels go full-width */ }
@media (max-width: 900px)  { /* sidebar becomes an off-canvas drawer */ }
@media (max-width: 620px)  { /* KPIs single-column, chrome sheds */ }
```

Verified empirically at 396px: **zero horizontal overflow**, drawer translated
off-canvas, hamburger visible, KPI grid single-column, status pill hidden.

The one thing allowed to scroll sideways is tables:

```css
.table-wrap { overflow-x: auto; }
```

A ten-column metrics table crushed into 360px stops being readable at all.
Horizontal scroll is the honest answer for tabular data; everything else
reflows.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
  .chart-line { stroke-dasharray: none; stroke-dashoffset: 0; }
}
```

The second rule matters and is easy to miss. The line draw-on works by hiding
the stroke (`stroke-dashoffset: 4000`) and animating it to 0. Zeroing the
*duration* alone would leave the line permanently hidden — the accessibility
preference would delete the content. Any animation that hides its element in its
initial state needs an explicit reset here.

The same principle as the `useCountUp` timer: **the end state must be reachable
without the animation.**

### The draw-on trick

```css
stroke-dasharray: 4000;
stroke-dashoffset: 4000;
animation: draw 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
```

A dash pattern longer than the path means one dash covers the whole line;
offsetting by the same amount pushes it entirely out of view; animating the
offset to 0 slides it in, so the line appears to draw itself.

The usual approach measures `path.getTotalLength()` in JavaScript. 4000 is a
constant chosen to comfortably exceed any path these charts produce, which
avoids a layout read per chart. **The trade-off:** it is a magic number. If a
chart ever produced a path longer than 4000 units the dash would repeat
mid-animation. Documented in the source so the constraint is discoverable.

---

## Part 3 — Composition in the pages

Pages contain no chart logic. They are declarative:

```jsx
<Panel span={8} title="Daily spend" subtitle="Last 30 days" hint="USD">
  <LineChart rows={dailySpend} keys={['Spend']} colors={['var(--c-1)']} area
             height={280} yFormat={(v) => '$' + fmtCompact(v, 0)} />
  <Callout>The <strong>$1,180 peak on Aug 31</strong> is INC-2291 — …</Callout>
</Panel>
```

Colours are passed as **CSS custom property references**, not hex literals, so
charts stay themeable from one place.

### Derived, not duplicated

```jsx
const cold = accounts.filter((a) => a.lastTouch > 20).length;
const coverage = ((accounts.length - cold) / accounts.length) * 100;
```

The coverage gauge computes from the account data rather than hard-coding 78.6%.
If someone edits an account's `lastTouch`, the gauge and its callout both follow.
Hard-coded summary figures are how dashboards start lying after their first edit.

---

## Pitfalls summarised

| Pitfall | Where | Guard |
|---|---|---|
| Data drifts as the real calendar moves | date labels | fixed `ANCHOR` |
| Totals disagree with components | every aggregate | sums verified by hand |
| Brand colour illegible on dark | palette | same hue, lifted luminance |
| Hue-only palette fails CVD | palette | luminance varies too |
| Reduced motion deletes content | `.chart-line` | explicit dash reset |
| Truncated axis exaggerates | `Gauge` | target tick + text label |
| Hard-coded summary goes stale | pages | derive from source data |
| Synthetic data mistaken for real | shell | disclosure on every page |

---

## ELI5

The numbers are made up, but they are made up *carefully*: one bad day in
August shows up in the cost chart, the speed chart, the error map, and the
incident list, all agreeing with each other — the way real data would. The
colours all come from one small list at the top of the stylesheet, so changing
the green in one place changes it everywhere. And anything that fades or slides
in has a backup plan that puts the real value on screen even if the animation
never runs.
