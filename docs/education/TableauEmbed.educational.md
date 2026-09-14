# TableauEmbed.jsx

`src/dashboard/TableauEmbed.jsx` renders a Tableau Public dashboard inside the
portfolio's framed piece stage. It is the third section on `dashboard.html`,
after the two hand built reports.

## The file

```jsx
import { useEffect, useRef, useState } from 'react';

const HOST = 'https://public.tableau.com';

export default function TableauEmbed({ name, poster, title, width, height }) {
  const [loaded, setLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const stageRef = useRef(null);

  // Written out rather than built with URLSearchParams, which would percent
  // encode the leading colons Tableau uses to mark its own parameters.
  const src = `${HOST}/views/${name}?:showVizHome=no&:embed=y&:tabs=no&:toolbar=yes&:language=en-US`;

  useEffect(() => {
    console.log('[TableauEmbed] mounted', { name, src, width, height });
  }, [name, src, width, height]);

  // Fit the published size inside whatever the stage currently is.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const fit = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      if (!w || !h) {
        console.warn('[TableauEmbed] stage has no size yet, skipping fit', { w, h });
        return;
      }
      const next = Math.min(w / width, h / height, 1);
      console.debug('[TableauEmbed] fit', { stage: { w, h }, scale: next.toFixed(3) });
      setScale(next);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const onLoad = () => {
    console.log('[TableauEmbed] iframe load event', { name });
    setLoaded(true);
  };

  return (
    <div className="piece-scale" ref={stageRef}>
      <div
        className="piece-scale-inner"
        style={{ width, height, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <iframe
          className="piece-embed"
          src={src}
          title={title}
          width={width}
          height={height}
          loading="lazy"
          allowFullScreen
          onLoad={onLoad}
        />
        {poster && (
          <img
            className={loaded ? 'piece-poster is-hidden' : 'piece-poster'}
            src={poster}
            alt=""
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}
```

Used from `DashboardPage.jsx` as:

```jsx
<TableauEmbed
  name="ds_salaries_dashboard/Dashboard1"
  poster="https://public.tableau.com/static/images/ds/ds_salaries_dashboard/Dashboard1/1.png"
  title="Data science salaries dashboard on Tableau Public"
  width={2100}
  height={1227}
/>
```

## What Tableau actually gave us

The Share > Embed Code snippet from Tableau Public looks like this, trimmed:

```html
<div class='tableauPlaceholder' id='viz1789344973731'>
  <noscript><a href='#'><img src='.../Dashboard1/1_rss.png' /></a></noscript>
  <object class='tableauViz' style='display:none;'>
    <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' />
    <param name='name' value='ds_salaries_dashboard/Dashboard1' />
    <param name='tabs' value='no' />
    <param name='toolbar' value='yes' />
    <param name='static_image' value='.../Dashboard1/1.png' />
    ...
  </object>
</div>
<script type='text/javascript'>
  var divElement = document.getElementById('viz1789344973731');
  var vizElement = divElement.getElementsByTagName('object')[0];
  if (divElement.offsetWidth > 800) {
    vizElement.style.minWidth = '2100px'; vizElement.style.minHeight = '1227px'; ...
  } ...
  var scriptElement = document.createElement('script');
  scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
  vizElement.parentNode.insertBefore(scriptElement, vizElement);
</script>
```

Three things are going on:

1. An `<object>` holds the configuration as `<param>` tags. Browsers do not
   render it (`display:none`); it is a data carrier.
2. An inline `<script>` sizes the object, then injects `viz_v1.js`.
3. `viz_v1.js` finds every `object.tableauViz`, reads the params, and replaces
   the object with an `<iframe>` pointing at
   `https://public.tableau.com/views/<name>?<params>`.

So the end state is an iframe. Everything else is scaffolding to produce it.

## Why the snippet cannot be pasted into a React page

* JSX is not HTML. `class` must be `className`, `<param>` and `<object>` are
  awkward in JSX, and `&#47;` entities in attribute values are not decoded.
* Inline `<script>` tags inside JSX do not execute. React creates the element
  but the browser only runs scripts that arrive in the initial HTML parse or are
  inserted through `document.createElement('script')`.
* Even if the script ran, it would replace a DOM node React owns. On the next
  render React would not know the object is gone and could throw or leave a
  duplicate.

Two honest options remain: replicate the script's DOM surgery inside a
`useEffect`, or render the iframe it would have produced. The second is less
code, has no third party script on the page, and is the embed path Tableau
Public documents for iframes, so that is what this file does.

## Line by line

**`const src = ...`**
Builds the same URL `viz_v1.js` would. The `<param>` names map to URL
parameters with a leading colon: `tabs=no` becomes `:tabs=no`. The two extra
ones, `:showVizHome=no` and `:embed=y`, tell Tableau Public to serve the viz on
its own without the site page around it. The string is written out literally
because `URLSearchParams` would encode `:` as `%3A`; Tableau would probably
decode it, but "probably" is not a reason to add a moving part.

**First `useEffect` (mount log)**
Dev mode logging at the component boundary, with every input, so a blank frame
in production can be traced to the exact URL that was requested.

**Second `useEffect` (fit)**
Measures the stage, computes `min(stageW / width, stageH / height, 1)`, and
stores it as the scale. `Math.min(..., 1)` stops the viz being enlarged past
its published size on a huge monitor, which would blur Tableau's raster layers
(the map tiles especially). `ResizeObserver` re-runs the fit whenever the stage
changes size: window resize, sidebar toggle, mobile rotation. The cleanup
disconnects it so an unmounted component never calls `setState`.

The warning branch handles the one silent failure: a stage measured at
`0 x 0` (display none, or measured before layout) would produce `scale = 0`
and an invisible viz with no error anywhere. Logging it as a warning and
keeping the previous scale is the difference between a five minute fix and an
afternoon.

**`onLoad`**
The iframe's `load` event fires once the Tableau document has loaded, even
cross origin (the event is on our element, not their document). It flips
`loaded`, which fades the poster.

**The JSX**
`.piece-scale` is the measured box, absolutely filling the stage with
`overflow: hidden`. `.piece-scale-inner` is a box at the published size,
centred with `translate(-50%, -50%)` and shrunk with `scale()`. Transforms are
purely visual: the iframe still believes it is 2100 px wide, so Tableau lays
the dashboard out exactly as published, and the browser maps pointer events
through the transform so clicks land on the right pixel.

The `<img>` poster comes after the iframe so it paints on top. `alt=""` and
`aria-hidden` because it is decoration; the iframe's `title` is the accessible
name. `pointer-events: none` in CSS means even while visible it never
intercepts a click meant for the viz.

`loading="lazy"` on the iframe defers the whole Tableau runtime (several
megabytes) until the frame is near the viewport. On this page the piece is the
third section down, so most visits never pay for it unless they scroll to it.

## Why scale rather than scroll

The first version was a plain 100% iframe. Tableau rendered the fixed size
dashboard inside it and clipped the overflow: the right 870 px of the dashboard
were simply gone, with no scrollbar. Fixed size dashboards do not reflow, and
Tableau's embed mode does not scroll. Two fixes exist:

* Republish from Tableau with Dashboard > Size set to Automatic. Then the viz
  reflows to whatever iframe it lands in. This is the better long term fix and
  is entirely on the Tableau side.
* Render at the published size and scale down. Works today with the dashboard
  as published, and still works if it is later republished as Automatic
  (it then fills the 2100 x 1227 iframe and gets scaled the same way).

The component does the second so the site is never blocked on a republish.

## Pitfalls

* **Renaming the workbook or sheet on Tableau Public breaks the embed.** The
  `name` prop is the URL. Tableau Public's "static_image" URL also embeds the
  workbook name (`/ds/ds_salaries_dashboard/...`), so both props change together.
* **Publishing at a new size without updating `width` / `height`.** The scale
  is computed from the props, not measured from Tableau. Read the new
  `minWidth` / `minHeight` from a fresh embed snippet and update the call site.
* **Third party content inside your page.** Tableau Public sets its own
  cookies and loads its own scripts inside the iframe. The iframe boundary keeps
  it out of the portfolio's DOM, but a privacy policy that says "no third party
  content" would no longer be true.
* **Tiny on phones.** At a 360 px wide stage the scale is roughly 0.17. The
  dashboard is complete but unreadable; the "Open on Tableau Public" link in
  the frame chrome is the intended path there.
* **Hash routing on this page.** The embedded report 1 normalises the URL hash
  to `#/azure/overview` on load, so `dashboard.html#tableau` does not deep link
  to this section. That predates this file and affects `#coverage` the same way.

## ELI5

Tableau gave you a recipe card that says "build a picture frame, then call our
robot to hang the picture". Our page is built by a different robot (React) that
does not like other robots moving its furniture. So we looked at what Tableau's
robot would have hung on the wall (a window showing their website) and hung
that window ourselves. The picture Tableau painted is bigger than the frame, so
we shrink the whole window until it fits, and until the window finishes
loading we tape a photo of the picture over it so nobody sees an empty wall.

## Where it sits

```
dashboard.html
  src/dashboard/main.jsx
    DashboardPage.jsx           framed page: nav, three sections, footer
      section 01  Dashboard.jsx        hand built, dark, Power BI style
      section 02  BankingDashboard.jsx hand built, white, Tableau style
      section 03  TableauEmbed.jsx     real Tableau, from Tableau Public   <- this file
```

Styling for `.piece-scale`, `.piece-scale-inner`, `.piece-embed` and
`.piece-poster` lives in `src/index.css` beside the other `.piece-*` frame
rules, because they describe the frame, not the dashboard.
