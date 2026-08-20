import { useRef } from 'react';

// Text sits on its own layer, stacked above the media (z-index) and
// rendered inside a `preserve-3d` rotator with `backface-visibility:
// hidden`. At rest it fully covers the card; on hover/focus it flips
// away like a lid (rotateY), so during the transition it visibly
// floats above the media rather than swapping faces with it — the
// media itself never moves, it's just uncovered as the text rotates
// out of view. See .card-text-flip / .card-media in index.css.
//
// `p.plain` — no text layer, no border/hover chrome, video autoplays
// on loop instead of playing on hover. Still wrapped in a `.card` so
// it keeps its grid-slot sizing (aspect-ratio, tall/square placement)
// inside a bento row; see .card--plain in index.css.
// `p.static` — keeps the text layer, but it's always visible instead
// of hover-to-reveal; no flip animation. See .card-text-flip--static.
export default function Card({ p, onOpen }) {
  const vidRef = useRef();

  const isVideo = Boolean(p.video);
  const isImage = !isVideo && Boolean(p.image);
  const clickable = isVideo && onOpen && !p.plain;

  const onEnter = () => {
    if (p.plain || !vidRef.current) return;
    vidRef.current.play().catch(() => {});
  };
  const onLeave = () => {
    if (p.plain || !vidRef.current) return;
    vidRef.current.pause();
    vidRef.current.currentTime = 0;
  };

  return (
    <article
      className={`card${clickable ? ' is-clickable' : ''}${p.plain ? ' card--plain' : ''}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={clickable ? () => onOpen(p) : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter') onOpen(p); } : undefined}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      aria-label={clickable ? `Open ${p.title}` : undefined}
    >
      <div className="card-media">
        {isVideo ? (
          <div className="thumb thumb-video">
            <video
              ref={vidRef}
              src={p.video}
              poster={p.poster}
              muted
              loop
              playsInline
              preload="metadata"
              autoPlay={p.plain}
            />
          </div>
        ) : isImage ? (
          <div className="thumb thumb-image">
            <img src={p.image} alt={p.plain ? p.title : ''} loading="lazy" />
          </div>
        ) : (
          <div
            className="thumb"
            style={{ background: `linear-gradient(135deg, ${p.grad[0]}, ${p.grad[1]})` }}
          >
            {p.initial}
          </div>
        )}
      </div>

      {!p.plain && (
        <div className={`card-text-flip${p.static ? ' card-text-flip--static' : ''}`}>
          {clickable && <span className="play-badge" aria-hidden="true">▶</span>}
          <div className="card-text-float">
            <span className="tag">{p.tag}</span>
            <h3>{p.title}</h3>
            <p className="desc">{p.desc}</p>
          </div>
        </div>
      )}
    </article>
  );
}
