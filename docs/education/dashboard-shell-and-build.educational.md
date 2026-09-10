# Dashboard shell and build wiring — Educational Companion

Covers `src/dashboard/Dashboard.jsx`, `src/dashboard/main.jsx`, `dashboard.html`,
`vite.config.js`, and the `NAV_LINKS` change in `src/App.jsx`.

---

## The architectural decision: a second document, not a route

The dashboard could have been a route inside the existing single-page app. It is
a separate HTML document instead. This was the first decision made and it shaped
everything after it.

### Why not client-side routing

GitHub Pages is a **static file server with no rewrite rules**. A single-page
app with a route at `/portfolio/dashboard` works while you click around, because
the router intercepts navigation in JavaScript. It breaks the moment anyone:

- refreshes the page
- opens a shared link directly
- opens a link in a new tab
- arrives from a search engine

In each case the browser asks the server for `/portfolio/dashboard`, no such
file exists, and Pages returns 404. The usual workaround is a `404.html` that
re-bootstraps the app — a hack that costs an extra redirect and briefly flashes
an error page.

### The alternative chosen

Two real HTML entry points:

```js
build: {
  rollupOptions: {
    input: {
      main: entry('./index.html'),
      dashboard: entry('./dashboard.html'),
    },
  },
},
```

`/portfolio/dashboard.html` is a file that exists. It cannot 404.

**The bonus:** Vite code-splits per entry. The portfolio's bundle is 916 kB
(three.js and React Three Fiber dominate). The dashboard is 52 kB. A visitor who
never opens the dashboard never downloads it, and a recruiter who opens the
dashboard directly never downloads three.js.

### The ESM trap in the config

The Vite docs show this:

```js
import { resolve } from 'node:path'
input: { main: resolve(__dirname, 'index.html') }
```

`package.json` has `"type": "module"`, so this config is an ES module — and
**`__dirname` does not exist in ESM**. That is a `ReferenceError` at build time,
which in CI means a red deploy rather than a helpful local error.

The ESM-correct form:

```js
import { fileURLToPath } from 'node:url'
const entry = (file) => fileURLToPath(new URL(file, import.meta.url))
```

`import.meta.url` is the module's own URL; `new URL(file, base)` resolves
relative to it; `fileURLToPath` converts `file:///C:/...` to a real path —
which matters on Windows, where a raw file URL is not a valid path.

---

## Hash routing inside the dashboard

The dashboard has six pages and they are all deep-linkable, without a router
library and without server support.

```js
function parseHash(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const report = REPORTS.find((r) => r.id === parts[0]);
  if (!report) return DEFAULT_ROUTE;
  const page = report.pages.find((p) => p.id === parts[1]);
  return { report: report.id, page: page ? page.id : report.pages[0].id };
}
```

### Why the hash specifically

**Everything after `#` is never sent to the server.** The browser requests
`/portfolio/dashboard.html` — a real file — and the fragment is handled entirely
client-side. So `#/clients/accounts` survives refresh, sharing, and bookmarking
on a static host. This is the same reason hash routing existed before the
History API, and it remains the correct answer on hosting without rewrites.

### Validation at the boundary

Note that `parseHash` never trusts its input. A URL is user-controlled: anyone
can type `#/nonsense/garbage`. Every segment is looked up against the known
structure and falls back rather than throwing. An unknown report → default
route; a known report with an unknown page → that report's first page.

`.filter(Boolean)` removes empty strings from `split`, which handles `#/`,
`#//azure`, and trailing slashes without special cases.

### Browser back/forward

```js
useEffect(() => {
  const onHash = () => { setRoute(parseHash(window.location.hash)); setNavOpen(false); };
  window.addEventListener('hashchange', onHash);
  return () => window.removeEventListener('hashchange', onHash);
}, []);
```

Navigation is performed by *assigning* the hash:

```js
const go = useCallback((reportId, pageId) => {
  window.location.hash = `#/${reportId}/${pageId}`;
}, []);
```

The click does not call `setRoute`. It changes the URL, the browser fires
`hashchange`, and the listener updates state. **The URL is the single source of
truth**, so a click and a back-button press travel the identical code path and
cannot diverge. Setting state directly *and* updating the URL is how routers
develop bugs where the address bar disagrees with the screen.

### Canonicalising the URL on load

```js
useEffect(() => {
  const canonical = `#/${route.report}/${route.page}`;
  if (window.location.hash !== canonical) {
    window.history.replaceState(null, '', canonical);
  }
}, []);
```

A bare `/dashboard.html` renders the overview but claims no route, so copying
the URL loses the page. `replaceState` rewrites the address bar **without**
adding a history entry — using `location.hash =` here would put a redundant
entry in the back stack, so the back button would appear broken.

---

## Remounting to replay animations

```jsx
<main className="dash-canvas" key={`${route.report}/${route.page}`}>
  <PageComponent />
</main>
```

Changing a React `key` destroys the subtree and builds a new one. That is
normally something to avoid — here it is the goal. CSS entrance animations run
on mount; without a changing key, React would reconcile the old page into the
new one and every chart would swap its data silently with no motion at all.

The cost is that page state is discarded on navigation (the accounts filter
resets). For a report dashboard that is correct behaviour.

---

## Accessibility in the shell

```jsx
<button aria-expanded={navOpen} aria-controls="dash-nav" onClick={...}>
```

- `aria-expanded` announces drawer state.
- `aria-controls` links the button to the element it operates.
- `aria-current="page"` marks the active nav item.
- The scrim is a real `<button>` with `tabIndex={navOpen ? 0 : -1}` — removed
  from the tab order while closed so keyboard users don't tab into an invisible
  control.
- Off-canvas nav uses `transform: translateX(-100%)`, not `display: none`, so it
  stays in the accessibility tree and can animate.

---

## The disclosure that has to be there

```jsx
<p className="nav-note">
  Demonstration report. All figures are synthetic — no real customer,
  patient or billing data appears anywhere in this dashboard.
</p>
```

Present in the sidebar on every page, plus the footer. The dashboard shows named
"accounts" with revenue figures and health scores in a healthcare-adjacent
context. Anyone can see it. Labelling synthetic data as synthetic is not
decoration — an unlabelled mock dashboard with plausible patient-adjacent
figures is exactly the artefact that causes trouble later.

---

## The portfolio nav link

```jsx
const NAV_LINKS = [
  { href: '#td', label: 'TouchDesigner' },
  { href: './dashboard.html', label: 'Power BI' },
  { label: 'Audio Visual Artist' },
];
```

`ScrambleNav` already treats an item with no `href` as inert text, so adding a
destination was a one-line data change with no component edits — a sign the
existing component was factored well.

The href is **relative** (`./dashboard.html`). Under the `/portfolio/` base path
an absolute `/dashboard.html` would resolve to the domain root and 404.

### A pre-existing bug this surfaced

The new link rendered as **"PowerBI"** with no space. Investigation showed
`ScrambleNav` splits labels into per-letter `<span>`s inside a
`display: inline-flex` container. A flex item containing only a space has that
space collapsed by default `white-space` handling, so it occupies zero width.

The existing "Audio Visual Artist" item was already rendering as
"AudioVisualArtist" — the bug predates this work and was simply never noticed
on a label people read as one phrase. One line fixes both:

```css
.scramble-letter { ... white-space: pre; }
```

**Lesson:** adding a feature to an existing component is one of the most
reliable ways to discover latent bugs in it. The new input exercised a code path
(a two-word label where the space matters) that the old inputs technically hit
but nobody scrutinised.

---

## ELI5

The dashboard is its own web page, not a screen inside the portfolio page. That
matters because GitHub's free hosting only knows how to hand out files that
really exist — so a made-up address breaks, but a real file never does. Inside
the dashboard, the bit of the address after the `#` says which of the six pages
to show. The `#` part never goes to the server, so the link keeps working when
someone refreshes it or sends it to a friend.

---

## Architecture

```
index.html      ──► src/main.jsx      ──► App.jsx       (portfolio, 916 kB)
dashboard.html  ──► src/dashboard/    ──► Dashboard.jsx (dashboard, 52 kB)
                      main.jsx               │
                                             ├─ pages/*.jsx
                                             ├─ charts/*.jsx
                                             └─ data/*.js
```

Two independent bundles. The only shared thing is `public/favicon.svg`, and the
only link between them is an `<a href>` in each direction.
