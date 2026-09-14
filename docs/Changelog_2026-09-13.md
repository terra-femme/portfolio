# Changelog 2026-09-13

## Embed the Tableau Public salaries dashboard on the dashboards page

### Title
Add a third framed piece to `dashboard.html`: the Data Science Salaries (2026)
dashboard, published on Tableau Public, embedded live.

### Error / Issue
1. Tableau's Share > Embed Code snippet (an `<object>` plus an inline
   `<script>` that loads `viz_v1.js`) cannot be pasted into a React component:
   inline scripts do not run from JSX and the script mutates DOM React owns.
2. First attempt used a plain 100% width iframe. The dashboard was published at
   a fixed 2100 x 1227 px, and Tableau clips rather than scrolls a fixed size
   viz in a smaller iframe. In a 1230 px frame the right 870 px were
   unreachable, with no scrollbar and no error.
3. Tableau's worksheet tab strip appeared across the top of the viz.

### Root Cause
1. The snippet's script only exists to produce an `<iframe>`; the object and
   params are a data carrier for it.
2. Fixed size dashboards do not reflow. Embed mode has no scroll container.
3. The snippet passes `tabs=no` as a `<param>`; the iframe URL needs the
   equivalent `:tabs=no` parameter or Tableau shows the tabs.

### Fix
New `src/dashboard/TableauEmbed.jsx`: renders the iframe the script would have
produced, at the published size, scaled to fit the stage with a
`ResizeObserver`, with Tableau's own static PNG as a poster until the iframe
loads.

```jsx
const src = `${HOST}/views/${name}?:showVizHome=no&:embed=y&:tabs=no&:toolbar=yes&:language=en-US`;

const next = Math.min(w / width, h / height, 1);   // contain fit, never enlarge
```

```jsx
<div className="piece-scale-inner"
     style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}>
  <iframe className="piece-embed" src={src} width={width} height={height} loading="lazy" ... />
  <img className={loaded ? 'piece-poster is-hidden' : 'piece-poster'} src={poster} alt="" />
</div>
```

`DashboardPage.jsx` gains section 03 in the `is-light` frame with the URL label,
an "Open on Tableau Public" link, and a caption. `src/index.css` gains the
`.piece-scale`, `.piece-scale-inner`, `.piece-embed` and `.piece-poster` rules
beside the other frame rules.

Verified in Chrome against `vite preview`: viz loads live, poster fades, tab
strip gone, whole 2100 x 1227 dashboard visible at scale 0.559 in a 1230 x 684
stage, `elementFromPoint` over the viz resolves to the iframe. Lint and build
clean. Tableau's own click response (filters, tooltips) could not be observed
through the browser automation and needs a real mouse check.

### Education
**Read what a vendor snippet does before pasting it.** Embed snippets are
usually a bootstrap for something simpler. Reproducing the end state (one
iframe) instead of the bootstrap removes a third party script from the page
and keeps React in charge of its own DOM.

**Transforms preserve layout and hit testing.** `scale()` shrinks pixels, not
the box model. The iframe still lays out at 2100 px, Tableau renders as
published, and the browser maps pointer events through the transform. This is
why scaling a fixed size embed is safe where resizing it is not.

**Log the silent zero.** A `0 x 0` stage would give `scale = 0` and an
invisible viz with no error. The fit function warns and keeps the last scale.

### Best Practices
* Keep the `name`, `poster`, `width` and `height` props in sync with a fresh
  embed snippet whenever the dashboard is republished.
* Prefer republishing the dashboard with Size: Automatic in Tableau so it
  reflows; the scaling still works after that, it just has less to do.
* Vendor content in an iframe is third party content: say so anywhere the site
  claims otherwise.

### Notes
* `docs/Dashboard/ds_salaries_dashboard.twb` and `docs/ds_salaries_2026_updated.csv`
  are untracked in the main checkout and were not touched. The local `.twb`
  has the seven worksheets but no dashboard sheet; the published version on
  Tableau Public is ahead of it. `~ds_salaries_dashboard__30480.twbr` is a
  Tableau recovery file, not source.
* The embedded report 1 rewrites the hash to `#/azure/overview` on load, so
  `dashboard.html#tableau` does not deep link. Pre-existing; `#coverage` is
  affected the same way.
* Branch: `feat/tableau-embed`, worktree `.claude/worktrees/claude-2026-09-13-tableau`.

---

## Replace the live Tableau embed with a linked screenshot

### Title
After a rendered preview, the live embed was swapped for a tight screenshot of
the dashboard that links out to the live viz on Tableau Public. Heading
capitalised as "Data Science Salaries" to match the dashboard title.

### Error / Issue
The scaled live viz showed the whole 2100 x 1227 published canvas, and the
dashboard content only occupies roughly the top left 1527 x 790 of it, so the
frame showed dead cream space on the left and right of the charts.

### Root Cause
Dashboard content and dashboard canvas size are set separately in Tableau. The
canvas was published larger than the content. The embed can only show what
Tableau serves, and cropping the iframe to the content rectangle would break
the moment the dashboard is edited.

### Fix
`public/screenshots/tableau-ds-salaries.png` (1527 x 790, the user's own
screenshot) is the stage, wrapped in a link to the live viz. The frame takes a
new `is-image` modifier so its height follows the picture, no letterbox:

```jsx
<div className="piece-frame is-light is-image">
  ...
  <a className="piece-stage piece-shot" href="https://public.tableau.com/views/ds_salaries_dashboard/Dashboard1" ...>
    <img src={`${BASE}screenshots/tableau-ds-salaries.png`} width="1527" height="790" alt="..." loading="lazy" />
  </a>
</div>
```

```css
.piece-frame.is-image { height: auto; }
.piece-shot { display: block; flex: none; }
.piece-shot img { display: block; width: 100%; height: auto; }
```

`TableauEmbed.jsx`, its educational companion and the `.piece-scale` CSS were
removed rather than left as dead code. Commit `0e12f17` has them if a live
embed is wanted again.

### Education
**A static image is a legitimate choice when the vendor's own layout is the
problem.** The live embed was technically correct and visually worse. What the
frame is for is a first impression; the live version is one click away.

**Let the frame take the content's proportions.** The other pieces have a fixed
frame height because they scroll inside it. A picture does not scroll, so a
fixed height would force a letterbox or a crop. `height: auto` on the modifier
and `width: 100%; height: auto` on the image make the frame exactly as tall as
the picture at every viewport width.

### Best Practices
* If the live embed is ever wanted back, first fix the canvas in Tableau:
  Dashboard > Size, either Automatic or a fixed size that matches the content,
  then republish. The dead space is a Tableau setting, not a site problem.
* Re-export the screenshot whenever the dashboard changes, same file name, so
  nothing on the site needs editing.
* `width` and `height` attributes on the image reserve its space before it
  loads, so the page does not jump.

### Notes
* The original screenshot lives at `docs/Dashboard/Tableau_ds_screenshot.png`
  in the main checkout, untracked. The copy under `public/screenshots/` is the
  one the site serves.
