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
