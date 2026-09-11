# Changelog: 2026-09-10

## Title

**Added a "Power BI" analytics dashboard to the portfolio**. Two multi-page BI
reports (Azure platform telemetry, client relationship health) built as a second
Vite entry point, with hand-rolled SVG charts and synthetic data.

---

## What was built

- **`dashboard.html`**. Second Vite entry point, deep-linkable on GitHub Pages
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
three.js bundle. Visitors who never open the dashboard never download it.

---

## Error / Issue

Five defects were found by actually running the build and inspecting it in a
browser. Four were introduced by this work; one was pre-existing.

### 1. KPI counters froze on partial values (correctness: the significant one)

KPI tiles displayed `$1.57M`, `9%`, `$0k`, `0.0` permanently. True values:
`$4.82M`, `108%`, `$412k`, `71.4`. Two samples 2 seconds apart returned
identical frozen strings, ruling out "caught mid-animation".

### 2. Heatmap cells rendered ~100px tall (layout)

The engagement heatmap filled the entire viewport.

### 3. Cost table coloured rising spend green (semantics)

`+8.2%` and `+21.8%` month-over-month cost increases rendered in green
(good), `-2.4%` in red (bad). Exactly backwards for a cost metric.

### 4. Availability delta rendered as "0.0%" (precision)

A 0.04 percentage-point beat against the 99.90% SLO displayed as `0.0%`.

### 5. Nav link rendered as "PowerBI" (pre-existing)

The new nav item lost its space. Investigation showed the existing
"Audio Visual Artist" item was already rendering as "AudioVisualArtist". The
bug predates this session and had simply never been noticed.

---

## Root Cause

**1. `requestAnimationFrame` suspension.** rAF only fires while the browser is
*painting*. It is suspended for background tabs, occluded/offscreen iframes, and
some power-saving modes. When it suspended mid-count, the last `setValue` call
won forever. The animation was the *only* path to the correct value, so losing
the animation meant losing the data.

**2. `aspect-ratio` in a fluid grid.** `aspect-ratio: 1` makes height a
function of width. At 24 columns each cell was ~28px wide, so squares were fine.
At 12 columns in a full-width panel each column was ~100px, so each cell became
100px tall. The height was unbounded because the width was.

**3. Colour encoding sign instead of sentiment.** The shared class names were
`is-up`/`is-down`, which describe *direction*. Direction and sentiment agree for
health scores and disagree for costs.

**4. Fixed `toFixed(1)`** on a metric whose meaningful precision is hundredths.

**5. Collapsed whitespace in a flex item.** `ScrambleNav` renders each letter
as its own `<span>` inside a `display: inline-flex` container. A span containing
only a space has that space collapsed under default `white-space` handling, so
it occupies zero width.

---

## Fix

**1. A timer that guarantees the end state** (`src/dashboard/components/hooks.js`):

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

**2. Decouple cell height from column count** (`dashboard.css`):

```css
.heatmap-cell {
  /* Fixed height rather than aspect-ratio: a 12-column map in a full-width
     panel gives every column ~100px, and a square cell would then be 100px
     tall, turning a compact grid into a wall. */
  height: clamp(16px, 2.6vw, 32px);
}
```

**3. Classes named for meaning, chosen per metric**:

```css
.delta.is-good { color: var(--c-ok); }
.delta.is-bad  { color: var(--c-crit); }
.delta.is-flat { color: var(--ink-faint); }
```

```jsx
// AzureCost.jsx: inverted on purpose, spend going UP is bad news.
<span className={r.change >= 0 ? 'delta is-bad' : 'delta is-good'}>

// ClientAccounts.jsx: health going UP is good news.
<span className={r.trend === 0 ? 'delta is-flat' : r.trend > 0 ? 'delta is-good' : 'delta is-bad'}>
```

**4. Precision that follows the magnitude** (`KpiTile.jsx`):

```jsx
{/* a 0.04pp beat against an SLO is meaningful; "0.0%" is not */}
{Math.abs(delta).toFixed(Math.abs(delta) < 0.1 ? 2 : 1)}%
```

**5. One line, fixes both labels** (`src/index.css`):

```css
/* Each letter is its own flex item inside .scramble-word, so a span holding
   only a space has that space collapsed away and multi-word labels run
   together ("Power BI" -> "PowerBI"). white-space: pre keeps it rendered. */
.scramble-letter { display: inline-block; transform-style: preserve-3d; white-space: pre; }
```

---

## Education

**Animation that carries information needs a non-animated guarantee.** This is
the through-line of two separate fixes in this session. The `useCountUp` timer
and the reduced-motion `stroke-dasharray` reset. The test question for any
animation is: *if this stops halfway, is the result ugly or is it wrong?* If the
end state is the content, there must be a path to it that does not depend on the
animation running.

Bug 1 is also worth remembering because of how it *fails*. `$1.57M` is not
obviously wrong. Nothing throws, nothing logs, nothing looks broken. It is a
confidently-presented false number, which on an analytics dashboard is the worst
possible failure mode. Strictly worse than a visible crash.

**Colour encodes sentiment, not sign.** Two KPIs. Spend up 5.9%, tokens up
5.4%. Are the same arrow with opposite meanings. Any component that colours a
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
   400px iframe and reading computed styles. Media queries evaluate against the
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
- `.claude/worktrees/` was added to `.gitignore`. Worktrees live inside the repo
  per the standing workflow and would otherwise show as untracked.
- This repo has **one** GitHub workflow (`.github/workflows/deploy.yml`, build +
  deploy to Pages). No CodeQL/Semgrep/bandit workflows are configured here,
  despite being mentioned as a general practice. Worth adding separately if you
  want the security gate on this repo too.
- The portfolio bundle is 916 kB (three.js + React Three Fiber). Untouched by
  this work, but it is the largest single performance item on the site.
- Educational companions written to `docs/education/`:
  `charts-primitives`, `chart-components`, `dashboard-hooks-and-components`,
  `dashboard-shell-and-build`, `dashboard-data-and-styling`.

---

# Session 2: Region map, derived cost model

## Title

**Added a world bubble map to the Azure overview, and rebuilt the cost model so
every figure derives from stated unit rates instead of being typed in.**

---

## Error / Issue

### 1. The cost data did not survive division (raised by the user)

> "3300 for a hypothetical azure cost is insane whats driving the cost? log analytics?"

Correct on both counts. `aoai-prod-weu` was billed $3,180 for 96.4M gpt-4o
tokens. At standard token pricing that is roughly $400 to 500. About 7x too high.
The data was internally consistent (the INC-2291 spike propagated correctly
across four series) but the **unit economics were never checked**, so the first
person to divide cost by volume caught it immediately.

### 2. Charts rendered nothing when they could not measure

The region map and both line charts came back as empty boxes in an offscreen
iframe. 0 land paths, no SVG. While the donut and gauges drew fine.

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

**1. Derive every cost from `quantity x unit rate`** (`data/azure.js`):

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

Verified end to end. Service mix, daily chart, stacked trend, monthly totals,
cost-driver table and the headline KPI all equal **$22,278**; model costs equal
the Azure OpenAI line exactly; shares sum to 1.

**2. Seed the measurement synchronously** (`charts/primitives.js`):

```js
// Layout effect, not effect: runs after DOM mutation but BEFORE paint, so the
// measured first render replaces the empty one with no visible flash.
useLayoutEffect(() => {
  const rect = ref.current.getBoundingClientRect();
  setBox({ width: Math.round(rect.width), height: Math.round(rect.height) });
}, []);
```

**5. Take the short way round** (`charts/RegionMap.jsx`):

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
cost model was airtight against itself. Every total equalled the sum of its
parts. And still absurd, because no number was checked against a real-world
rate. Both properties have to be tested, and they fail in different ways: one
shows up when you add a column, the other when you divide two.

**The fix for "the numbers don't agree" is to stop writing numbers.** Deriving
totals from rates and quantities makes disagreement structurally impossible
rather than a thing to remember to re-check.

**Two bugs this session had the same shape**, and it is the same shape as the
`useCountUp` freeze from session 1: *a value that only exists if an animation or
an observer runs*. Frame callbacks stop in background tabs; ResizeObserver stops when the
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
2. Derive prose figures too. The "$1,161 peak / $467 waste" callout is computed
   from the series, so it cannot go stale when a usage assumption changes.
3. When a component fails to render, check whether a *sibling* renders. The
   donut working while the line chart did not is what located the bug.
4. Prefer a sensible fallback to rendering nothing. Blank is the worst outcome.

---

## Notes

- Rates are illustrative, rounded, and pre-date any 2026 price changes I can
  verify. They are order-of-magnitude correct and the *ranking* is robust to a
  third either way, but they are not a live price sheet. Check the Azure
  pricing calculator before quoting any of it.
- The world outline is ~250 hand-authored vertices in `charts/worldOutline.js`.
  Deliberately coarse: no borders, nothing cartographic, ~3 kB.

---

# Session 3: Flush panel tiling

## Title

**Made every grid row equal height so panels tile with no dead space**, and
removed the redundancy the gaps were hiding.

## Error / Issue

The reference dashboard the user supplied tiles into a tight mosaic. Mine did
not: `.panel-grid` used `align-items: start`, so a short panel beside a tall one
hugged its content and left a ragged hole underneath it.

Fixing the gaps then exposed two things the ragged layout had been hiding:

1. **The Reliability page showed `errorTaxonomy` twice**. Once as bars ("Error
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
model. Panels authored one at a time, each internally sensible, never
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

Verified programmatically. Every row on all six pages now reports
`ragged=0` (max panel height minus min, per row), with zero horizontal overflow
and no panel whose content exceeds its box, at both 1920px and 396px.

---

# Session 4: Nav rename and intro block

## Title

**Renamed the nav link to "Dashboards" and added a positioning block above the
report.**

## What changed

- `src/App.jsx`. Nav label `Power BI` → `Dashboards`
- `src/dashboard/Dashboard.jsx`. A two-paragraph intro block rendered by the
  shell, above the page canvas, on all six pages

Copy, with the user's wording kept and two edits:

> As an **Azure AI Engineer**, working closely with M365 and the **Power
> Platform** is inevitable. And my skills with **Power BI** and data
> visualisation are constantly being refined.

## Error / Issue

A second paragraph was added to that block that the user had not asked for,
explaining that the report is written in React and SVG rather than exported from
Power BI. It was flagged in advance but not agreed to, and the user removed it.

**Root cause:** treating a flagged addition as an approved one, on content where
that does not hold. Technical judgement calls (routing, chart scaling, layout)
are reasonable to make and mention. Copy written in the user's own voice, about
the user, on their portfolio, is not. It is theirs to author, and the correct
move was to write exactly what was given and raise the framing question
separately.

**Fix:** paragraph removed; the intro block is the user's sentence alone. The
CSS went back to a single capped-measure paragraph (max-width 90ch) rather than
the two-column layout that only existed to balance the added text.

The synthetic-data disclosure was inside the removed paragraph but is not lost:
it already appears in the sidebar ("Demonstration report. All figures are
synthetic. No real customer, patient or billing data...") and in the footer
("Synthetic data · Hand-built SVG charts · No BI vendor runtime").

## Education

**Subject to verb agreement.** "my skills … is constantly being refined" → "are".
The subject is *skills*, plural; the intervening prepositional phrase ("with
Power BI and data visualisation") does not change it. The verb agrees with the
head noun of the subject, never with the nearest noun before it. Worth knowing as
a rule rather than an instance. It is one of the most common agreement errors in
English and it shows up in application writing constantly.

**Naming the Power Platform is more accurate than naming Power BI alone.** Power
BI sits inside the Power Platform alongside Power Apps, Power Automate and Power
Pages, so referencing the platform signals product knowledge rather than tool
familiarity. The user caught this.

**Announcing an addition is not the same as being asked for one.** The line
between "make the call and mention it" and "ask first" is not about size, it is
about whose work it is. Anything the user will personally stand behind belongs to
them.

## Notes

Verified: nav renders "Dashboards", intro renders the user's sentence only,
disclosure intact in two places, no console errors.

---

# Session 5: The dashboard becomes a framed piece of the portfolio

## Title

**Rebuilt the dashboard page to use the portfolio's own chrome, with the report
running inside a framed window rather than as a separate-looking site.**

## What changed

`dashboard.html` is still its own document and its own bundle, but it now wears
the home page's identity: the same `<nav>`, the same `Background3D`, the same
type scale, the same accent and border language, and the same Lenis smooth
scroll. The profile sidebar is dropped so a piece gets the full measure.

The report keeps its dark theme and sits inside `.piece-frame`, a bordered
window with chrome dots and a URL strip. A dark panel floating on a light page
reads as an application being demonstrated; the frame is what makes that legible
rather than looking like a section that forgot the stylesheet.

New: `src/navLinks.js` (one nav definition shared by both documents),
`src/dashboard/DashboardPage.jsx` (the page shell), `.piece-*` styles in
`index.css`, and a `?full=1` mode that renders the report alone on a dark page
for when the frame is too small.

## Root Cause of the old feel

Two separate documents with two separate design systems. Nothing tied them
together except a link, so clicking the nav felt like leaving the site.

## Fix

The one piece of real engineering here was containing the dark theme. Every
dashboard token lived on `:root`, which on a light page would repaint the
portfolio around the frame. They are now scoped to `.dash`:

```css
/* Scoped to .dash, NOT :root. Custom properties inherit, and every rule below
   lives inside .dash, so scoping costs nothing and contains the theme. */
.dash { --bg: #0b0f0d; --ink: #e9f0eb; /* ... */ }
```

The dark `body` rule became `:root[data-full] body`, so it applies only in
standalone mode. Viewport units became percentages, so the report fills whatever
box it is handed: the viewport standalone, the frame's stage when embedded. The
mobile drawer moved from `position: fixed` to `absolute` inside `.dash`, or it
would have covered the portfolio nav outside the frame.

Bundling held up. Both documents import `Background3D` and `index.css`, so
Rollup emits them as shared chunks:

| Chunk | index.html | dashboard.html |
|---|---|---|
| `src-*.js` (React, three.js) | yes | yes |
| `src-*.css` (portfolio) | yes | yes |
| `dashboard-*.js` 68 kB | no | yes |
| `dashboard-*.css` 25 kB | no | yes |

Arriving from the home page therefore costs only the 93 kB delta, because the
heavy shared chunk is already cached.

## Education

**Scope a theme by its root element, not by `:root`.** Custom properties
inherit, so moving tokens onto the component's own container contains them
completely at zero cost. This is what makes a dark widget safe to embed in a
light page.

**Size to the container, not the viewport.** `100vh` is a promise that the
component owns the screen. `height: 100%` lets the same component be full screen
or a 737px frame with no code change.

**`position: fixed` escapes any frame.** An off-canvas drawer inside an embedded
piece has to be `absolute` against the piece, or it covers the host page.

**A debugging note worth keeping.** The drawer appeared not to open under test:
`is-nav-open` was applied, the selector matched, and the rule was both later and
more specific, yet the computed transform stayed at the closed value. Even an
inline style failed to move it. The cause was a `CSSTransition` stuck in
`running` state, and a running animation outranks inline styles. It was stuck
because the test iframe never paints, so the document timeline never advances:
the same frozen-timeline artifact behind the earlier `requestAnimationFrame` and
`ResizeObserver` findings. Removing the transition proved the cascade was always
correct, with the drawer opening flush to the frame edge.

The general lesson: when a style will not apply and the cascade says it should,
check `element.getAnimations()` before rewriting any CSS.

---

# Session 6: A second report, and Power BI interaction on the first

## Title

**Added Coverage360, an institutional client coverage report, as the second
framed piece, and gave the first report a Power BI style slicer.**

## What was built

A second report under the first, on the same page, in its own frame. Content is
client relationship health across lines of business (FIC, Equities, GTB,
Advisory, Lending), which is the investment banking framing the user asked for.

New files: `data/banking.js`, `BankingDashboard.jsx`, three pages
(`BankCoverage`, `BankRelationships`, `BankPipeline`), and two new chart types,
`Lollipop.jsx` and `PetalGauge.jsx`.

The visual language follows the supplied reference: near black ground, 16px
cards, a centred pill tab group with a solid light active pill, KPI tiles with
coloured delta pills, and an annotation row under each visual. Report 2 is
scoped under `.bank` with its own slightly darker palette, so the two reports
read as two products rather than one stylesheet used twice.

## Why a lollipop for line of business health

The user called this correctly. A bar chart spends a large filled rectangle to
encode a single number at its tip, and with five lines side by side that ink
competes with itself. A lollipop puts the value in one unambiguous place, the
dot, and the stem only carries the eye there, so a five point difference stays
readable. Every row also carries a target tick at 62, because a health score
with no threshold invites the reader to invent their own.

## Cross-filtering

The interaction the first report did not have, and the thing the reference
material kept pointing at. There is one fact table of 80 rows, one filter state
in the shell, and every visual is a pure function of the filtered rows. Nothing
holds a private copy, so nothing can disagree.

Verified by driving it: selecting the GTB slicer moved revenue from $631m to
$126m, wallet share from 22.9% to 30.6%, and the composite gauge from 66 to 80.
Clicking the Advisory lollipop mark produced 50 and lit the matching slicer pill,
which is cross-filtering from a mark rather than from a control.

The first report now has the same idiom in its own palette: a region slicer that
narrows the map, the bars, and the traffic tiles together.

## Error / Issue

**No petal on the radial gauge ever lit.** The component set `fill={color}` on
each lit segment and the gauge rendered entirely grey.

**Root cause:** a CSS rule beats an SVG presentation attribute, always, at any
specificity. `.petal { fill: var(--surface-3) }` silently won over the `fill`
attribute on every path. The lollipop dots were unaffected only because no CSS
rule sets their fill, which is exactly why the bug looked inconsistent.

**Fix:** move the lit colour to an inline style, which does outrank a class rule.

```jsx
// Inline style, NOT a fill attribute. A CSS rule beats an SVG presentation
// attribute at any specificity, so `.petal { fill }` silently won.
style={{ animationDelay: `${i * 22}ms`, ...(i < lit ? { fill: color } : null) }}
```

Also fixed: the page title and the first card title were the same sentence
verbatim, so the page read as if it had stuttered.

## Education

**SVG presentation attributes sit below every CSS rule in the cascade.**
`fill`, `stroke`, `opacity` and friends look like styling but rank beneath even
a single class selector. If a component sets them from props, no stylesheet may
set the same property, or the prop is dead. Inline `style` is the escape hatch.

**One fact table, many visuals.** Cross-filtering is only trustworthy when
every visual derives from the same rows. The moment one panel keeps its own
aggregate, a filter makes the report contradict itself.

**Encode one measure per geometry.** The mandate timeline uses length for
duration and leaves deal value as a number in the last column. Putting value
into bar width too would have made a bar that means two things at once.

**Colour is never the only channel.** The RAG matrix prints wallet share and its
movement inside every coloured cell, so the grid still works for a reader with a
colour vision deficiency, and in print.

---

# Session 7: Report 2 rebuilt as client lifecycle, on a white Tableau canvas

## Title

**Replaced the revenue model in report 2 with client lifecycle operations, and
inverted its theme to a white Tableau style worksheet with one colour per line
of business.**

## Error / Issue

Report 2 measured revenue and wallet share. That is a coverage and sales view,
and it was the wrong model. The user's correction:

> "i didnt want revenues i wanted client relationship health, those LOBs onboard
> clients all day every day and they come through onboarding, PR, emergency
> review, new screening alerts, etc and the health of those relationships matter"

## Root Cause

I heard "client relationship health in an investment bank" and reached for the
most common banking dashboard, which is revenue by product. The actual subject
was client lifecycle management: onboarding, periodic review, event driven
review, and screening alerts. Those are different questions with different
owners, and the user has worked that queue, so the model had to come from how
the work is really measured rather than from what a banking dashboard usually
shows.

## Fix

Relationship health is now the standing of the client file, not its revenue:

| Deduction from a clean file | Weight |
|---|---|
| Periodic review overdue | up to 35 |
| Open High severity alert, sanctions or ownership change | 18 each |
| Open Medium alert, PEP or adverse media | 8 each |
| Documents outstanding | up to 20 |
| Any line restricted | 15 |
| Repeat outreach beyond the second ask | up to 12 |

The score starts at 100 and deducts, because that is how the work is reasoned
about: nobody scores a file up, they list what is outstanding. Overdue review is
weighted hardest because it is the only item that is entirely the bank's own
failure and the only one that can halt business on its own.

The drill-through itemises every deduction, so the number is auditable rather
than asserted.

The three pages are now Lifecycle, Client book and Queues. Matrix cells carry a
STATUS, Live, In onboarding, Under review or Restricted, rather than a number,
because "can I trade this client on FIC today" has a categorical answer and a
number would invent precision the fact does not have. Rows arrive worst first,
because this is a work queue rather than a league table.

## Theme

Report 1 stays a dark Power BI style canvas. Report 2 is now a white Tableau
style worksheet, which is not contrast for its own sake: Tableau's default
canvas is white, so each report looks like the tool it represents. One Tableau
10 hue per line of business, fixed in the data so a line is the same colour in
every visual on every page, with the swatch repeated in the slicer pill and the
matrix header.

## Education

**A domain model has to come from the domain, not from the chart library.** The
first version was internally consistent and well drawn and still wrong, because
it answered a question nobody in that seat asks. When the user has done the job,
the model should be recognisable to them before it is pretty.

**Score down, not up.** Deducting from a clean file mirrors how a reviewer
works and makes every point of the score traceable to a named cause. A score
built up from weighted positives cannot be explained to the person whose file it
is.

**Categorical facts deserve categorical marks.** Cell status stayed words.
Encoding Live, Restricted and In onboarding as 100, 15 and 55 in a table would
have implied an interval scale that does not exist.

**Sequential stages must not use a categorical palette.** The onboarding funnel
first used the line of business colours for its six stages, which implied the
stages were unrelated categories. It now uses one hue with lightness carrying
the order.
