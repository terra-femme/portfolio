import { useEffect, useState } from 'react';
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

const NAV_LINKS = [
  { href: '#td', label: 'TouchDesigner' },
  { href: '#contact', label: 'Audio Visual Artist' },
];

export default function App() {
  const [active, setActive] = useState(null); // currently expanded video

  useEffect(() => {
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
        <div className="mark"><span>TERRA</span>FEMME</div>
        <div className="links">
          <ScrambleNav links={NAV_LINKS} />
        </div>
      </nav>

      <main className="content">
        <div className="page-container">
          <aside className="profile-panel">
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
