import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import Background3D from '../Background3D';
import Card from '../Card';
import ScrambleNav from '../ScrambleNav';
import ScrambleWord from '../ScrambleWord';
import { navLinks } from '../navLinks';
import { caseStudies } from '../caseStudies';

// Same nav, background, card hover, and smooth scroll as the home page, so
// this reads as a page of the same site rather than a different one.
const NAV_LINKS = navLinks('projects');

// Embedded demo frame. The demo posts its own content height, so the frame
// fits the content at any width instead of cutting it off or scrolling inside.
// Only the height number crosses the frame boundary; the sandbox still blocks
// the demo from reading this page.
function EmbedFrame({ src, title, ratio }) {
  const ref = useRef(null);
  const [height, setHeight] = useState(null);

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== ref.current?.contentWindow) return;
      if (e.data?.type !== 'demo-height') return;
      console.log(`[projects-page] ${title} reports height ${e.data.height}px`);
      setHeight(e.data.height);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [title]);

  const style = height
    ? { height, aspectRatio: 'auto' }
    : ratio
      ? { aspectRatio: ratio }
      : undefined;

  return (
    <iframe
      ref={ref}
      className="cs-embed"
      src={src}
      title={title}
      loading="lazy"
      sandbox="allow-scripts"
      style={style}
    />
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
          <header className="hero" id="top">
            <div className="eyebrow">Engineering projects</div>
            <h1>Systems built for <ScrambleWord as="em" text="real work." /></h1>
            <p>
              Each project covers the problem, what the system does, the stack, and where it stands
              today. Sample data shown is synthetic or public.
            </p>
            <div className="scroll-hint">Scroll to explore</div>
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
