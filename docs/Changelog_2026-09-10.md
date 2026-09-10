# Changelog — 2026-09-10

## Title

**Added a "Power BI" analytics dashboard to the portfolio** — two multi-page BI
reports (Azure platform telemetry, client relationship health) built as a second
Vite entry point, with hand-rolled SVG charts and synthetic data.

---

## What was built

- **`dashboard.html`** — second Vite entry point, deep-linkable on GitHub Pages
- **6 report pages** across 2 reports, with an in-dashboard sidebar nav
  - *Azure Platform*: Overview · Cost & usage · Reliability
  - *Client Health*: Portfolio · Accounts · Engagement
- **7 chart types**, all hand-written SVG/CSS with no charting library:
  line/area (single, multi-series, stacked), bar (grouped, stacked), donut,
  horizontal bar, sparkline, heatmap, radial gauge
- **Interaction**: hover crosshair + tooltips, sortable tables, segment filter
  chips, at-risk toggle, interactive donut legend, hash-based routing with
  working browser back/forward
- **Synthetic data**: two modules totalling ~350 lines, deterministic and
  internally cross-consistent
- **Nav link** added to the portfolio at `src/App.jsx`

Bundle: **52 kB (16.8 kB gzipped)**, fully separate from the portfolio's 916 kB
three.js bundle — visitors who never open the dashboard never download it.

---

## Error / Issue

Five defects were found by actually running the build and inspecting it in a
browser. Four were introduced by this work; one was pre-existing.

### 1. KPI counters froze on partial values (correctness — the significant one)

KPI tiles displayed `$1.57M`, `9%`, `$0k`, `0.0` permanently. True values:
`$4.82M`, `108%`, `$412k`, `71.4`. Two samples 2 seconds apart returned
identical frozen strings, ruling out "caught mid-animation".

### 2. Heatmap cells rendered ~100px tall (layout)

The engagement heatmap filled the entire viewport.

### 3. Cost table coloured rising spend green (semantics)

`+8.2%` and `+21.8%` month-over-month cost increases rendered in green
(good), `-2.4%` in red (bad) — exactly backwards for a cost metric.

### 4. Availability delta rendered as "0.0%" (precision)

A 0.04 percentage-point beat against the 99.90% SLO displayed as `0.0%`.

### 5. Nav link rendered as "PowerBI" (pre-existing)

The new nav item lost its space. Investigation showed the existing
"Audio Visual Artist" item was already rendering as "AudioVisualArtist" — the
bug predates this session and had simply never been noticed.

---

## Root Cause

**1 — `requestAnimationFrame` suspension.** rAF only fires while the browser is
*painting*. It is suspended for background tabs, occluded/offscreen iframes, and
some power-saving modes. When it suspended mid-count, the last `setValue` call
won forever. The animation was the *only* path to the correct value, so losing
the animation meant losing the data.

**2 — `aspect-ratio` in a fluid grid.** `aspect-ratio: 1` makes height a
function of width. At 24 columns each cell was ~28px wide, so squares were fine.
At 12 columns in a full-width panel each column was ~100px, so each cell became
100px tall. The height was unbounded because the width was.

**3 — colour encoding sign instead of sentiment.** The shared class names were
`is-up`/`is-down`, which describe *direction*. Direction and sentiment agree for
health scores and disagree for costs.

**4 — fixed `toFixed(1)`** on a metric whose meaningful precision is hundredths.

**5 — collapsed whitespace in a flex item.** `ScrambleNav` renders each letter
as its own `<span>` inside a `display: inline-flex` container. A span containing
only a space has that space collapsed under default `white-space` handling, so
it occupies zero width.

---

## Fix

**1 — a timer that guarantees the end state** (`src/dashboard/components/hooks.js`):

```js
frameRef.current = requestAnimationFrame(step);

// Safety net, and not a theoretical one: requestAnimationFrame stops firing
// whenever the page is not being painted -- a background tab, an occluded
// or offscreen iframe, some power-saving modes. When that happens mid-count
// the tile freezes on a PARTIAL number and never recovers, so a $4.82M KPI
// sits there reading $1.57M. Timers are throttled in hidden tabs too, but
// unlike rAF they still fire, and an overdue one fires immediately when the
// tab is focused again.
const settle = setTimeout(() => setValue(target), delay + duration + 120);

return () => {
  cancelAnimationFrame(frameRef.current);
  clearTimeout(settle);
};
```

**2 — decouple cell height from column count** (`dashboard.css`):

```css
.heatmap-cell {
  /* Fixed height rather than aspect-ratio: a 12-column map in a full-width
     panel gives every column ~100px, and a square cell would then be 100px
     tall, turning a compact grid into a wall. */
  height: clamp(16px, 2.6vw, 32px);
}
```

**3 — classes named for meaning, chosen per metric**:

```css
.delta.is-good { color: var(--c-ok); }
.delta.is-bad  { color: var(--c-crit); }
.delta.is-flat { color: var(--ink-faint); }
```

```jsx
// AzureCost.jsx — inverted on purpose: spend going UP is bad news.
<span className={r.change >= 0 ? 'delta is-bad' : 'delta is-good'}>

// ClientAccounts.jsx — health going UP is good news.
<span className={r.trend === 0 ? 'delta is-flat' : r.trend > 0 ? 'delta is-good' : 'delta is-bad'}>
```

**4 — precision that follows the magnitude** (`KpiTile.jsx`):

```jsx
{/* a 0.04pp beat against an SLO is meaningful; "0.0%" is not */}
{Math.abs(delta).toFixed(Math.abs(delta) < 0.1 ? 2 : 1)}%
```

**5 — one line, fixes both labels** (`src/index.css`):

```css
/* Each letter is its own flex item inside .scramble-word, so a span holding
   only a space has that space collapsed away and multi-word labels run
   together ("Power BI" -> "PowerBI"). white-space: pre keeps it rendered. */
.scramble-letter { display: inline-block; transform-style: preserve-3d; white-space: pre; }
```

---

## Education

**Animation that carries information needs a non-animated guarantee.** This is
the through-line of two separate fixes in this session — the `useCountUp` timer
and the reduced-motion `stroke-dasharray` reset. The test question for any
animation is: *if this stops halfway, is the result ugly or is it wrong?* If the
end state is the content, there must be a path to it that does not depend on the
animation running.

Bug 1 is also worth remembering because of how it *fails*. `$1.57M` is not
obviously wrong. Nothing throws, nothing logs, nothing looks broken. It is a
confidently-presented false number, which on an analytics dashboard is the worst
possible failure mode — strictly worse than a visible crash.

**Colour encodes sentiment, not sign.** Two KPIs — spend up 5.9%, tokens up
5.4% — are the same arrow with opposite meanings. Any component that colours a
delta needs the metric to declare which direction is healthy. The `goodWhen`
prop on KPI tiles and the `is-good`/`is-bad` classes both exist for this.

**`aspect-ratio` makes one dimension a function of another.** In a fluid layout
the input is unbounded, so the output is too. Whenever a size derives from
available space, check the extremes.

**Monotone cubic interpolation, not Catmull-Rom.** Catmull-Rom splines overshoot
between points, drawing values that never occurred. On a chart labelled "p95
latency" that is a picture of an SLO breach that did not happen. Fritsch-Carlson
monotone interpolation is provably non-overshooting.

**Adding a feature to an existing component finds latent bugs in it.** The
"PowerBI" spacing bug had been live in the nav for some time. It surfaced only
because a new label made the missing space obvious.

**Mock data is convincing when it is internally consistent, not when it is
pretty.** One Azure incident (INC-2291) appears in four independent series, all
agreeing. One failing account (Northwind) drives the at-risk KPI, the renewal
pipeline, and the NPS dip. Cross-referencing is what real telemetry feels like.

---

## Best Practices

1. **Build and open it before claiming it works.** All five defects came from
   running `npm run build` and looking at the result in a browser. None would
   have been caught by reading the code.
2. **Verify claims empirically when the tool allows.** The window would not
   resize, so responsive behaviour was tested by loading the dashboard in a
   400px iframe and reading computed styles — media queries evaluate against the
   iframe's own viewport, so it is a real test rather than an assumption.
3. **Don't trust a tool's success message.** `resize_window` reported success;
   `window.innerWidth` was still 1920.
4. **Check totals by hand in synthetic data.** Every aggregate in both data
   modules was verified to equal the sum of its parts.
5. **Static hosting constrains architecture.** GitHub Pages has no rewrites, so
   client-side routes 404 on refresh. A second HTML entry point plus hash
   routing sidesteps it entirely, and code-splits as a bonus.
6. **Label synthetic data as synthetic**, on every page, when it is public and
   healthcare-adjacent.

---

## Notes

- **Reminder for when you're back at your computer:** local `main` is one merge
  commit behind `origin/main`. Sync with:
  ```powershell
  git checkout main
  git pull origin main
  git branch -d feat/nav-github-link
  ```
- `.claude/worktrees/` was added to `.gitignore` — worktrees live inside the repo
  per the standing workflow and would otherwise show as untracked.
- This repo has **one** GitHub workflow (`.github/workflows/deploy.yml`, build +
  deploy to Pages). No CodeQL/Semgrep/bandit workflows are configured here,
  despite being mentioned as a general practice — worth adding separately if you
  want the security gate on this repo too.
- The portfolio bundle is 916 kB (three.js + React Three Fiber). Untouched by
  this work, but it is the largest single performance item on the site.
- Educational companions written to `docs/education/`:
  `charts-primitives`, `chart-components`, `dashboard-hooks-and-components`,
  `dashboard-shell-and-build`, `dashboard-data-and-styling`.

---

# Session 2 — Region map, derived cost model

## Title

**Added a world bubble map to the Azure overview, and rebuilt the cost model so
every figure derives from stated unit rates instead of being typed in.**

---

## Error / Issue

### 1. The cost data did not survive division (raised by the user)

> "3300 for a hypothetical azure cost is insane whats driving the cost? log analytics?"

Correct on both counts. `aoai-prod-weu` was billed $3,180 for 96.4M gpt-4o
tokens. At standard token pricing that is roughly $400–500 — about 7x too high.
The data was internally consistent (the INC-2291 spike propagated correctly
across four series) but the **unit economics were never checked**, so the first
person to divide cost by volume caught it immediately.

### 2. Charts rendered nothing when they could not measure

The region map and both line charts came back as empty boxes in an offscreen
iframe — 0 land paths, no SVG — while the donut and gauges drew fine.

### 3. Map dominated the page

At `span-8` with a 2.55:1 aspect ratio the map was ~320px tall and the largest
element on the overview.

### 4. Map legend overflowed its container

`.map-wrap` had a fixed inline height covering only the SVG, so the legend
escaped the box and overlapped the panel callout.

### 5. Flow arcs took the wrong way around the globe

East US → Australia East swept east across Africa and the Indian Ocean.

---

## Root Cause

**1.** Hand-typed totals. Nothing forced `cost` and `tokens` to be consistent
with any rate, so they drifted independently.

**2.** `ResizeObserver` only delivers callbacks during the browser's
"update the rendering" steps. A document that is not being painted may never run
them, so `observe()` can be called and never fire even though the element has a
valid width the entire time. Charts that gated rendering on the first
observation therefore rendered nothing, **permanently**. The donut survived only
because it happened to have a `width || size` fallback.

**3/4.** Layout defaults chosen before the panel had real content in it.

**5.** Those two regions are 230° apart going east but only 130° going west. A
naive interpolation between projected x-coordinates always takes the long way.

---

## Fix

**1 — derive every cost from `quantity x unit rate`** (`data/azure.js`):

```js
export const RATES = { logAnalyticsPerGb: 2.30, ptuPerMonth: 132, /* ... */ };
export const USAGE = { logIngestGbPerDay: 76, ptuUnits: 15, /* ... */ };

const COST = {
  logAnalytics: USAGE.logIngestGbPerDay * WINDOW_DAYS * RATES.logAnalyticsPerGb,
  // ...
};

export const SPEND_30D = serviceMix.reduce((sum, s) => sum + s.value, 0);
```

The daily chart is then rescaled to land exactly on that headline, with the
rounding remainder absorbed:

```js
const scaled = SPEND_SHAPE.map((v) => Math.round((v * SPEND_30D) / shapeTotal));
scaled[scaled.length - 1] += SPEND_30D - scaled.reduce((a, b) => a + b, 0);
```

Verified end to end — service mix, daily chart, stacked trend, monthly totals,
cost-driver table and the headline KPI all equal **$22,278**; model costs equal
the Azure OpenAI line exactly; shares sum to 1.

**2 — seed the measurement synchronously** (`charts/primitives.js`):

```js
// Layout effect, not effect: runs after DOM mutation but BEFORE paint, so the
// measured first render replaces the empty one with no visible flash.
useLayoutEffect(() => {
  const rect = ref.current.getBoundingClientRect();
  setBox({ width: Math.round(rect.width), height: Math.round(rect.height) });
}, []);
```

**5 — take the short way round** (`charts/RegionMap.jsx`):

```js
let lon2 = b.lon;
const delta = lon2 - a.lon;
if (delta > 180) lon2 -= 360;
else if (delta < -180) lon2 += 360;
// ...then draw the curve twice, offset by a map width, and clip the SVG
```

---

## Education

**Internal consistency is not the same as external plausibility.** The first
cost model was airtight against itself — every total equalled the sum of its
parts — and still absurd, because no number was checked against a real-world
rate. Both properties have to be tested, and they fail in different ways: one
shows up when you add a column, the other when you divide two.

**The fix for "the numbers don't agree" is to stop writing numbers.** Deriving
totals from rates and quantities makes disagreement structurally impossible
rather than a thing to remember to re-check.

**Two bugs this session had the same shape**, and it is the same shape as the
`useCountUp` freeze from session 1: *a value that only exists if an animation or
an observer runs*. rAF stops in background tabs; ResizeObserver stops when the
page is not painted. In all three cases the answer is to make the correct state
reachable without the asynchronous mechanism, and let the mechanism handle only
the enhancement.

**The real finding the dashboard now shows** is worth stating plainly, because
it is true of real Azure estates: inference is ~12% of spend while observability
is ~24%. Per-GB log ingestion, provisioned search units, always-on container
replicas and reserved Cosmos throughput bill whether or not anyone uses them.
Token billing is genuinely usage-based and genuinely cheap by comparison.

**Bubbles, not choropleth, for point-located data.** A cloud region is a
datacenter metro. Shading all of Sweden for one datacenter in Gävle overstates
the footprint by orders of magnitude.

---

## Best Practices

1. Put the assumptions in the file. `RATES` is exported and commented as
   illustrative, so a reader can check the arithmetic or swap in real prices.
2. Derive prose figures too — the "$1,161 peak / $467 waste" callout is computed
   from the series, so it cannot go stale when a usage assumption changes.
3. When a component fails to render, check whether a *sibling* renders. The
   donut working while the line chart did not is what located the bug.
4. Prefer a sensible fallback to rendering nothing. Blank is the worst outcome.

---

## Notes

- Rates are illustrative, rounded, and pre-date any 2026 price changes I can
  verify. They are order-of-magnitude correct and the *ranking* is robust to a
  third either way, but they are not a live price sheet — check the Azure
  pricing calculator before quoting any of it.
- The world outline is ~250 hand-authored vertices in `charts/worldOutline.js`.
  Deliberately coarse: no borders, nothing cartographic, ~3 kB.

---

# Session 3 — Flush panel tiling

## Title

**Made every grid row equal height so panels tile with no dead space**, and
removed the redundancy the gaps were hiding.

## Error / Issue

The reference dashboard the user supplied tiles into a tight mosaic. Mine did
not: `.panel-grid` used `align-items: start`, so a short panel beside a tall one
hugged its content and left a ragged hole underneath it.

Fixing the gaps then exposed two things the ragged layout had been hiding:

1. **The Reliability page showed `errorTaxonomy` twice** — once as bars ("Error
   taxonomy"), once as a donut ("Failure share"). Two panels of identical data,
   and the donut left half its panel empty.
2. **Error counts disagreed with the heatmap by 15x.** The taxonomy totalled
   2,277 errors for the window; the heatmap averaged ~6.9 per 10k against 43.3M
   requests, which implies ~29,800.

## Root Cause

**Layout:** `align-items: start` is the right default for cards of genuinely
independent height, and the wrong one for a dashboard, where the grid is
supposed to read as one surface.

**Duplication and the 15x gap:** both are the same mistake as the original cost
model — panels authored one at a time, each internally sensible, never
cross-checked against each other.

## Fix

Rows stretch, and the panel becomes a flex column so its body can absorb the
extra height rather than leaving it at the bottom:

```css
.panel-grid { align-items: stretch; }
.panel      { display: flex; flex-direction: column; }
.panel-body { flex: 1; display: flex; flex-direction: column; min-height: 0; }
```

One child per panel is then designated the grower. Charts take the slack:

```css
.chart-wrap { flex: 1 1 auto; min-height: 168px; }
.callout    { flex: 0 0 auto; }
```

`LineChart` and `BarChart` now measure their own height instead of taking a
fixed `height` prop, so a stretched panel genuinely hands the space to the
chart. Short content (donut, gauges, bars) centres instead, so the slack sits
above *and* below rather than pooling at the bottom.

Error volume is now derived from the heatmap, the same way costs derive from
rates:

```js
export const ERR_PER_10K = HEAT_CELLS.reduce((a, b) => a + b, 0) / HEAT_CELLS.length;
export const ERRORS_30D  = Math.round(((REQUESTS_30D_M * 1e6) / 10000) * ERR_PER_10K);
// taxonomy splits that total by relative weight; remainder absorbed into the largest
```

The duplicate donut was deleted, its slot given to a KPI strip on the taxonomy
panel (total errors, error rate, worst hour), and the incident log promoted to
full width as an auto-fitting card grid.

## Education

**`align-items: start` vs `stretch` is a design decision, not a default.**
Independent cards want `start`; a dashboard wants `stretch`, because the row is
meant to read as one band.

**Only one element per panel should grow.** If two do, the slack is shared and
nothing lines up. Everything else gets `flex: 0 0 auto`.

**Centre short content rather than top-aligning it.** Slack split above and
below reads as padding; the same slack all at the bottom reads as a hole.

**Empty space was a symptom.** The half-empty donut panel was duplicate data,
and squeezing the layout is what made that obvious. Layout pressure is a decent
audit tool: a panel that cannot fill its space often should not exist.

## Notes

Verified programmatically — every row on all six pages now reports
`ragged=0` (max panel height minus min, per row), with zero horizontal overflow
and no panel whose content exceeds its box, at both 1920px and 396px.

---

# Session 4 — Nav rename and intro block

## Title

**Renamed the nav link to "Dashboards" and added a positioning block above the
report.**

## What changed

- `src/App.jsx` — nav label `Power BI` → `Dashboards`
- `src/dashboard/Dashboard.jsx` — a two-paragraph intro block rendered by the
  shell, above the page canvas, on all six pages

Copy, with the user's wording kept and two edits:

> As an **Azure AI Engineer**, working closely with M365 and the **Power
> Platform** is inevitable — and my skills with **Power BI** and data
> visualisation are constantly being refined.
>
> This report is written from scratch in React and SVG rather than exported from
> Power BI, so every chart, scale, projection and interaction on it is my own
> code. All figures are synthetic.

## Education

**Subject–verb agreement.** "my skills … is constantly being refined" → "are".
The subject is *skills*, plural; the intervening prepositional phrase ("with
Power BI and data visualisation") does not change it. This is one of the most
common agreement errors in English and it is worth knowing the rule rather than
the instance: the verb agrees with the head noun of the subject, never with the
nearest noun before it.

**Naming the Power Platform is more accurate than naming Power BI alone.** Power
BI sits inside the Power Platform alongside Power Apps, Power Automate and Power
Pages, so referencing the platform signals product knowledge rather than tool
familiarity. The user caught this.

**The second paragraph is a credibility hedge, and a deliberate one.** The page
is reached from a link about Power BI but is not a Power BI export. Leaving that
ambiguous invites an awkward interview question; stating it converts the same
fact into the stronger claim, which is that the rendering itself was built
rather than configured.

**Layout note.** The block was initially one full-width paragraph capped at a
readable measure, which left half the band empty — the exact fault the panel grid
had just been fixed for. Two columns, each with its own short measure, fills the
band and keeps both readable. They stack below ~740px.

## Notes

Verified: nav renders "Dashboards", intro stacks to one column at 400px with no
overflow, no console errors.
