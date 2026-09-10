# `src/dashboard/components/` — Educational Companion

Covers `hooks.js`, `KpiTile.jsx`, `Panel.jsx`, and `DataTable.jsx`.

---

## Part 1 — `hooks.js`

### `useCountUp` and a real bug that was caught in testing

This hook animates a KPI from 0 to its true value on mount. The first version
looked correct and *was* broken. The story is worth keeping because the bug
class is common and nearly invisible.

#### The final code

```js
export function useCountUp(target, { duration = 900, delay = 0 } = {}) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const frameRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) { setValue(target); return undefined; }

    let start = null;
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const step = (now) => {
      if (start === null) start = now;
      const elapsed = now - start - delay;
      if (elapsed < 0) { frameRef.current = requestAnimationFrame(step); return; }
      const t = Math.min(1, elapsed / duration);
      setValue(target * ease(t));
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    };

    frameRef.current = requestAnimationFrame(step);

    const settle = setTimeout(() => setValue(target), delay + duration + 120);

    return () => {
      cancelAnimationFrame(frameRef.current);
      clearTimeout(settle);
    };
  }, [target, duration, delay]);

  return value;
}
```

#### Decision 1 — elapsed time, not frame counting

The naive animation is:

```js
// DON'T
let current = 0;
const step = () => {
  current += target / 60;          // assumes 60 frames per second
  ...
};
```

`requestAnimationFrame` fires at the *display's* refresh rate. On a 60 Hz
monitor that reaches the target in one second. On a 120 Hz laptop, half a
second. On a 240 Hz gaming display, a quarter. The animation's duration becomes
a property of the user's hardware.

Timing against `now - start` makes the duration mean what it says everywhere.
`requestAnimationFrame` passes a `DOMHighResTimeStamp` as its argument for
exactly this purpose.

#### Decision 2 — easeOutCubic

```js
const ease = (t) => 1 - Math.pow(1 - t, 3);
```

`t` runs 0→1 (progress), the function returns 0→1 (eased progress). Cubic
ease-out starts fast and decelerates into the target. It matches the
`cubic-bezier(0.22, 1, 0.36, 1)` used on panel entrances, so the counters and
the cards feel like one motion system rather than two animations that happen to
overlap.

#### Decision 3 — the bug, and the `settle` timer

**Symptom found in testing:** in an iframe, the four KPI tiles froze at
`$1.57M`, `9%`, `$0k`, `0.0` and stayed there. The true values are `$4.82M`,
`108%`, `$412k`, `71.4`. Two samples two seconds apart returned identical
frozen strings, which ruled out "caught mid-animation".

**Root cause:** `requestAnimationFrame` only fires when the browser is
*painting* the page. It is suspended for background tabs, occluded or offscreen
iframes, and some power-saving modes. If it suspends mid-count, the last
`setValue` wins forever and the tile displays a partial number permanently.

**Why this matters more than it looks:** the failure is silent and it is
*plausible*. `$1.57M` is not obviously wrong. A recruiter who opens the
dashboard in a background tab, reads email, then switches to it would see
confidently-presented false figures. A frozen animation is a cosmetic bug; a
frozen *number* on an analytics dashboard is a correctness bug.

**The fix:**

```js
const settle = setTimeout(() => setValue(target), delay + duration + 120);
```

`setTimeout` is also throttled in hidden tabs, but unlike rAF it still *fires* —
and an overdue timer runs immediately when the tab is focused again. So the true
value always lands. The `+ 120` ms buffer keeps the timer from racing the final
animation frame and causing a visible snap.

**The general lesson:** any animation whose end state carries information needs
a guarantee that the end state is reached, independent of the animation. Ask of
every animation: *if this stops halfway, is the result wrong or just ugly?*

#### Decision 4 — reduced motion returns the value, not nothing

```js
const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
```

`useState` with a function argument is the **lazy initialiser** — it runs once
on mount rather than on every render. Here it means a reduced-motion user sees
the correct number in the very first paint, with no flash of `0`. Accessibility
settings must never withhold content.

---

### `useElapsed`

```js
const seconds = Math.max(0, Math.floor((now - new Date(sinceIso).getTime()) / 1000));
```

The only place in the dashboard that touches the real clock. The data is
static, but a BI canvas that claims a sync time and shows a frozen string looks
broken. A counter that advances reads as a live connection **without lying about
the numbers** — the honest version of "live-feeling".

`Math.max(0, ...)` guards a real case: if a viewer's system clock is behind the
hard-coded ingest timestamp, the naive version renders `-3612s ago`.

---

### `useSort`

```js
const toggle = (key) =>
  setSort((prev) => (prev.key === key
    ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
    : { key, dir: 'desc' }));
```

Clicking a **new** column starts descending. This is a small UX judgement:
for metrics tables the implicit question is almost always "what is biggest" —
biggest spend, worst health, most tickets. Starting ascending would make every
user click twice.

`apply` copies before sorting (`[...rows]`) because `Array.prototype.sort`
mutates in place. Sorting props directly would corrupt the imported data module
for every other component on the page.

---

## Part 2 — `KpiTile.jsx`

### The `goodWhen` prop is the whole point

```js
const rising = delta >= 0;
const healthy = goodWhen === 'up' ? rising : !rising;
```

Two KPIs on the Azure overview:

- **Spend** — up 5.9%
- **Tokens processed** — up 5.4%

Same arrow, same direction, opposite meanings. Colouring both green because the
number went up would actively mislead. Each metric declares which direction is
healthy in its own data definition:

```js
{ id: 'spend',  delta: 5.9, goodWhen: 'down' },
{ id: 'tokens', delta: 5.4, goodWhen: 'up'   },
```

**Generalisable rule:** colour encodes *sentiment*, never *sign*. Anywhere the
two are conflated, one of the metrics is being misreported. The same fix was
applied to the cost table (rising spend is red) and the accounts table (rising
health is green).

### The arrow is one shape

```jsx
<path d="M6 2 L11 9 L1 9 Z" transform={rising ? undefined : 'rotate(180 6 6)'} />
```

One triangle, rotated. Two hand-drawn paths inevitably differ by a pixel and
the up-arrow ends up visually heavier than the down-arrow.

### Precision that respects the data

```jsx
{Math.abs(delta).toFixed(Math.abs(delta) < 0.1 ? 2 : 1)}%
```

Availability beats its SLO by 0.04 percentage points. Fixed one-decimal
formatting renders that as `0.0%`, which tells the reader nothing. For a
four-nines availability metric, hundredths *are* the signal.

### `font-variant-numeric: tabular-nums`

In most proportional fonts `1` is narrower than `8`. During a count-up every
digit change shifts the number's width and the whole tile jitters sideways.
Tabular figures give every digit identical advance width. Applied to every
animated or right-aligned number in the dashboard.

---

## Part 3 — `Panel.jsx`

### Layout by intent

```jsx
<Panel span={8} title="Daily spend">
```

The panel emits `class="panel span-8"` and the CSS decides what a span means at
each breakpoint:

```css
.span-8 { grid-column: span 8; }
@media (max-width: 1240px) { .span-7, .span-8 { grid-column: span 12; } }
@media (max-width: 900px)  { [class*="span-"] { grid-column: 1 / -1; } }
```

**Why a class and not an inline `--span` variable:** an inline custom property
cannot be overridden by a media query without `!important`, and CSS has no way
to write "span the smaller of `--span` and 6". Emitting a class moves the
responsive decision into the stylesheet, where all the other responsive
decisions live. Pages never mention breakpoints.

### `Callout`

```jsx
export function Callout({ children }) {
  return <p className="callout">{children}</p>;
}
```

Twelve characters of component for a real purpose. Every chart in this
dashboard is followed by a sentence stating what it means. Real BI reports are
read by people who will not derive the conclusion from the marks — and writing
the takeaway is what separates a chart from an insight. It also forces the
author to *have* a conclusion, which is a useful discipline: a chart with no
possible callout probably should not be on the page.

---

## Part 4 — `DataTable.jsx`

### Sort the data, render the presentation

```js
{ key: 'cost', label: 'Cost', align: 'right', render: (r) => fmtCurrency(r.cost) }
```

`key` drives sorting against the **raw** value; `render` controls display only.
This split is the entire design.

**The bug this prevents:** sorting formatted strings. `"$9,800"` sorts *above*
`"$12,400"` because `'9' > '1'` lexicographically. Currency, percentages, and
dates all break this way, and the failure looks like a data problem rather than
a sorting problem — the numbers are right, they are just in the wrong order.

### Accessibility

```jsx
<th aria-sort={active ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}>
  <button type="button" onClick={() => toggle(col.key)}>
```

- `aria-sort` announces sort state to screen readers.
- The clickable element is a real `<button>`, not a `<th onClick>`. Buttons are
  keyboard-focusable, respond to Enter and Space, and are announced as
  interactive — all of which a click handler on a `<th>` gets none of.
- `type="button"` prevents form submission if the table is ever nested in a form.

### The key fallback chain

```jsx
key={row.id ?? row.name ?? row.resource ?? row.model ?? i}
```

`??` is nullish coalescing — it falls through on `null`/`undefined` only, unlike
`||`, which would also reject `0` and `''`. The chain lets one table component
serve incidents (`id`), accounts (`name`), cost drivers (`resource`), and models
(`model`), with the index as a last resort.

---

## ELI5

- **`useCountUp`** — a number that counts up to its real value, with an alarm
  clock set so that if the counting ever gets interrupted, the real value still
  shows up.
- **`KpiTile`** — a big number with an arrow, where each number gets to say
  whether "up" is good news for it.
- **`Panel`** — the box a chart sits in; it says how wide it wants to be and the
  stylesheet decides what that means on your screen.
- **`DataTable`** — a table you can click to sort, which is careful to sort by
  the real numbers rather than by how they look.

---

## Architecture

```
hooks.js ──────► KpiTile.jsx ──┐
                 Panel.jsx ────┼──► pages/*.jsx ──► Dashboard.jsx
                 DataTable.jsx ┘
```

None of these import chart code, and none import data. They are the generic
layer: given props, render a box. That is what lets six different report pages
share them without special cases.
