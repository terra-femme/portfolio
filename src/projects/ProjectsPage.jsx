import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import Background3D from '../Background3D';
import Card from '../Card';
import EmbedFrame from '../EmbedFrame';
import ScrambleNav from '../ScrambleNav';
import ScrambleWord from '../ScrambleWord';
import { navLinks } from '../navLinks';
import { caseStudies, programNote } from '../caseStudies';

// Same nav, background, card hover, and smooth scroll as the home page, so
// this reads as a page of the same site rather than a different one.
const NAV_LINKS = navLinks('projects');

// Sticky note from caseStudies.js (programNote). Rendered in the left column so
// it lines up with the text of the case study that follows it.
// Draggable with mouse, touch, or the arrow keys (Shift for bigger steps). The
// position lives in React state only, so a reload puts the note back in place.
const TILT = -1.2;

function StickyNote({ note }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    console.log(`[projects-page] sticky note mounted in hero, ${note.paragraphs.length} paragraphs`);
  }, [note]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, origX: offset.x, origY: offset.y };
    setDragging(true);
    console.log(`[projects-page] sticky note drag start x=${offset.x} y=${offset.y}`);
  };

  const onPointerMove = (e) => {
    if (!drag.current) return;
    setOffset({
      x: drag.current.origX + e.clientX - drag.current.startX,
      y: drag.current.origY + e.clientY - drag.current.startY,
    });
  };

  const endDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    console.log('[projects-page] sticky note drag end');
  };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? 40 : 10;
    const moves = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setOffset((o) => ({ x: o.x + m[0], y: o.y + m[1] }));
    console.log(`[projects-page] sticky note moved by keyboard key=${e.key}`);
  };

  return (
    <div className="hero-note">
      <aside
        className={`sticky-note${dragging ? ' is-dragging' : ''}`}
        aria-label={`${note.label} note. Drag to move, or use the arrow keys.`}
        title="Drag to move this note"
        tabIndex={0}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) rotate(${TILT}deg)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
      >
        <svg className="drag-arrow" viewBox="0 0 70 50" aria-hidden="true" focusable="false">
          <path d="M4 6 C 26 -2, 50 12, 62 38" />
          <path d="M55 35 L62 38 L59 31" />
        </svg>
        <span className="sticky-note-label">{note.label}</span>
        {note.paragraphs.map((t) => <p key={t}>{t}</p>)}
        <span className="sticky-note-footer">drag me</span>
      </aside>
    </div>
  );
}

function CaseStudy({ p, flip }) {
  return (
    <article
      className={`cs${flip ? ' cs--flip' : ''}${p.layout === 'top' ? ' cs--top' : ''}`}
      id={p.id}
    >
      <div className="cs-media">
        {p.embed ? (
          <EmbedFrame src={p.embed} title={p.embedTitle} ratio={p.embedRatio} />
        ) : (
          <Card p={p} />
        )}
      </div>

      <div className="cs-body">
        <span className={`cs-status cs-status--${p.statusTone}`}>{p.status}</span>
        <h3>{p.title}</h3>

        <h4>The problem</h4>
        <p>{p.problem}</p>

        <h4>What it does</h4>
        <p>{p.does}</p>

        {p.metrics.length > 0 && (
          <dl className="cs-metrics">
            {p.metrics.map((m) => (
              <div key={m.value}>
                <dt>{m.value}</dt>
                <dd>{m.label}</dd>
              </div>
            ))}
          </dl>
        )}

        <h4>Stack</h4>
        <ul className="cs-stack">
          {p.stack.map((s) => <li key={s}>{s}</li>)}
        </ul>

        {p.note && <p className="cs-note">{p.note}</p>}

        <p className="cs-repo">
          {p.repo
            ? <a href={p.repo} target="_blank" rel="noreferrer">{p.repo.replace('https://', '')}</a>
            : 'Not on GitHub yet.'}
        </p>
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  useEffect(() => {
    console.log(`[projects-page] rendering ${caseStudies.length} case studies`);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.09 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <>
      <Background3D />
      <nav className="nav">
        <a
          className="mark"
          href="https://github.com/terra-femme"
          target="_blank"
          rel="noreferrer"
          aria-label="Terra Femme on GitHub"
        >
          <span>TERRA</span>FEMME
        </a>
        <div className="links">
          <ScrambleNav links={NAV_LINKS} />
        </div>
      </nav>

      <main className="content">
        <div className="cs-wrap">
          <header className="hero hero--note" id="top">
            <div className="eyebrow">Engineering projects</div>
            <h1>Systems built for <ScrambleWord as="em" text="real work." /></h1>
            <p>
              Each project covers the problem, what the system does, the stack, and where it stands
              today. Sample data shown is synthetic or public.
            </p>
            <div className="scroll-hint">Scroll to explore</div>
            <StickyNote note={programNote} />
          </header>

          <section className="section" id="cases">
            <div className="section-head">
              <span className="idx">01</span>
              <h2>What&rsquo;s Possible?</h2>
              <span className="count">{caseStudies.length} projects</span>
            </div>
            {caseStudies.map((p, i) => <CaseStudy key={p.id} p={p} flip={i % 2 === 1} />)}
          </section>

          <footer className="footer" id="contact">
            <div className="meta">
              &copy; 2026 Terra Femme Tech LLC &middot; Built with React Three Fiber
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
