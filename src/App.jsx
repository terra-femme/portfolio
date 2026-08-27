import { useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import Background3D from './Background3D';
import Card from './Card';
import Lightbox from './Lightbox';
import SocialLinks from './SocialLinks';
import LeafSprout from './LeafSprout';
import ScrambleNav from './ScrambleNav';
import ScrambleWord from './ScrambleWord';
import { tdProjects, tdLayout } from './projects';
import profileImg from './prof_thumbnail.png';

// An item without an href renders as plain text, not a link. "Audio Visual
// Artist" is a descriptor rather than a destination -- it only ever jumped to
// the copyright footer, which read as a dead link.
const NAV_LINKS = [
  { href: '#td', label: 'TouchDesigner' },
  { label: 'Audio Visual Artist' },
];

export default function App() {
  const [active, setActive] = useState(null); // currently expanded video
  const panelRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const lenis = new Lenis({ smoothWheel: true, lerp: 0.09 });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // Lenis hijacks the wheel globally, so the sticky profile panel would never
  // scroll under the cursor on its own. data-lenis-prevent tells Lenis to leave
  // wheel events inside the panel alone, handing them back to the browser's
  // native scrolling for that box. Combined with overscroll-behavior: contain,
  // hovering the panel scrolls the panel; moving off it scrolls the page again.
  //
  // Applied only while the panel actually overflows -- otherwise hovering it
  // would be a dead zone where the wheel does nothing at all.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const sync = () => {
      const overflows = panel.scrollHeight > panel.clientHeight + 1;
      panel.toggleAttribute('data-lenis-prevent', overflows);
      if (import.meta.env.DEV) {
        console.log('[profile-panel] overflows=%s scrollH=%d clientH=%d',
          overflows, panel.scrollHeight, panel.clientHeight);
      }
    };

    // pointerenter is the trigger that matters: it re-decides the instant the
    // cursor arrives, so the answer is never stale. A ResizeObserver alone was
    // unreliable here -- it reported the pre-layout height and left the panel
    // trapping the wheel after it had stopped overflowing.
    sync();
    panel.addEventListener('pointerenter', sync);
    window.addEventListener('resize', sync);
    return () => {
      panel.removeEventListener('pointerenter', sync);
      window.removeEventListener('resize', sync);
    };
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
        <div className="page-container">
          <aside className="profile-panel" ref={panelRef}>
            <img className="profile-photo" src={profileImg} alt="Portrait" />
            <p className="profile-caption">Founder of Terra Femme Tech</p>
            <hr />
            <SocialLinks />
            <LeafSprout />
            <p className="sidebar-cta">Let&rsquo;s build something.</p>
            <hr />

            <section className="how-i-build">
              <h2>How I build</h2>

              <p>
                <strong>Agentic, on Azure.</strong> I design systems where AI agents do
                real work inside a pipeline &mdash; orchestration, evaluation, structured
                extraction &mdash; not chat bolted onto a form. Microsoft Certified:{' '}
                <strong>Azure AI Engineer Associate (AI-102)</strong>.
              </p>

              <p>
                <strong>Human-in-the-loop by default.</strong> The interesting question
                isn&rsquo;t how much a model can do alone, it&rsquo;s where a person
                belongs in the loop and what the handoff should feel like. I build for
                collaboration, with the seams visible on purpose.
              </p>

              <p>
                <strong>Governance as design, not paperwork.</strong> Provenance,
                escalation paths, and knowing what a system should refuse are architecture
                decisions. I write and teach this &mdash; see{' '}
                <a
                  href="https://github.com/terra-femme/AI_Enablement"
                  target="_blank"
                  rel="noreferrer"
                >
                  AI_Enablement
                </a>
                . <strong>IAPP AI Governance Professional (AIGP) in progress.</strong>
              </p>

              <p>
                <strong>Workflows and apps.</strong> Most of what I ship is the
                unglamorous middle &mdash; the pipeline, the scheduler, the thing that
                reconciles four APIs that disagree.
              </p>

              <p>
                <strong>Digital media assets.</strong> Motion, 3D, and visual work that
                unleashes creativity for education or marketing &mdash; same rigor,
                pointed at the things people actually want to look at.
              </p>
            </section>
          </aside>

          <div className="frames">
            <header className="hero" id="top">
              <div className="eyebrow">Creative Coder, Digital Artist &middot; Full-Stack Developer</div>
              <h1>Interfaces &amp;<br /><ScrambleWord as="em" text="dimensional" /> work.</h1>
              <p>
                I design and build apps, to websites, to interactive 3D art — from
                triage dashboards to anatomical explainers. Selected art below.
              </p>
              <div className="scroll-hint">Scroll to explore</div>
            </header>

            <section className="section" id="td">
              <div className="section-head">
                <span className="idx">01</span>
                <h2>TouchDesigner</h2>
                <span className="count">{tdProjects.length} clips</span>
              </div>
              {tdLayout.map((row) => {
                if (row.type === 'wide') {
                  const p = row.items[0];
                  return (
                    <div className="grid grid-bento-wide" key={p.title}>
                      <video className="wide-media" src={p.video} poster={p.poster} autoPlay muted loop playsInline />
                    </div>
                  );
                }
                const rowClass = row.type === 'trio-reverse' ? 'grid-bento-reverse' : 'grid-bento';
                return (
                  <div
                    className={`grid ${rowClass}${row.cropHero ? ' grid-bento--crop-hero' : ''}`}
                    key={row.items[0].title}
                  >
                    {row.items.map((p) => <Card key={p.title} p={p} onOpen={setActive} />)}
                  </div>
                );
              })}
            </section>

            <footer className="footer" id="contact">
              <div className="meta">
                &copy; 2026 Terra Femme Tech LLC &middot; Built with React Three Fiber
              </div>
            </footer>
          </div>
        </div>
      </main>

      <Lightbox item={active} onClose={() => setActive(null)} />
    </>
  );
}
