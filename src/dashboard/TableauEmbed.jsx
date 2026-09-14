import { useEffect, useRef, useState } from 'react';

const HOST = 'https://public.tableau.com';

/**
 * A Tableau Public viz filling the piece stage.
 *
 * Tableau's "Share > Embed Code" snippet is an <object class="tableauViz"> full
 * of <param> tags plus an inline <script> that pulls viz_v1.js, which then swaps
 * the object for an <iframe>. That snippet cannot be dropped into JSX: inline
 * scripts never execute when React renders markup, and the script would be
 * mutating DOM that React owns. Its end state is just an iframe, so this renders
 * that iframe directly and carries the <param> values as URL parameters, which
 * is the embed path Tableau Public documents for iframes.
 *
 *   :showVizHome=no   the viz alone, not Tableau Public's page around it
 *   :embed=y          embed mode, Tableau's own site header trimmed
 *   :tabs=no          hide the worksheet tab strip, as the snippet did
 *   :toolbar=yes      keep Tableau's toolbar (undo, download, share, full screen)
 *   :language=en-US   same as the snippet
 *
 * Sizing. A dashboard published at a fixed size (this one is 2100 x 1227, the
 * minWidth/minHeight the snippet's script sets) does not reflow to a smaller
 * iframe; Tableau clips it, so a frame narrower than the dashboard silently
 * loses the right hand side with no scrollbar. So the iframe is rendered at the
 * published size and CSS transformed down to fit the stage, contain style, with
 * a ResizeObserver keeping the scale right as the frame changes. Transforms keep
 * pointer mapping intact, so filters and tooltips still work at any scale. If
 * the dashboard is ever republished with Automatic sizing this still holds: it
 * fills the 2100 x 1227 iframe and is scaled the same way.
 *
 * `name` is the snippet's <param name="name"> value, workbook/sheet. `poster` is
 * the snippet's static_image URL: Tableau's own PNG render of the same view,
 * shown until the live viz has loaded so the frame is never a white void.
 *
 * The iframe is lazy loaded. This piece sits a long way down the page and
 * Tableau's runtime is heavy, so nothing is fetched until the frame is near the
 * viewport.
 */
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
        {/* After the iframe in the DOM so it paints on top, then fades out. */}
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
