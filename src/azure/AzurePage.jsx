import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Background3D from '../Background3D';
import ScrambleNav from '../ScrambleNav';
import ScrambleWord from '../ScrambleWord';
import { navLinks } from '../navLinks';
import DemoVideo from './DemoVideo';
import EmbedFrame from '../EmbedFrame';

const BASE = import.meta.env.BASE_URL;

const NAV_LINKS = navLinks('azure');

// Planned architecture. Each step is a real Azure or Power Platform service,
// but none of this is connected to an Azure resource yet.
const STEPS = [
  { name: 'Upload', note: 'Receipt image lands in Blob Storage' },
  { name: 'Trigger', note: 'Azure Function fires on the new blob' },
  { name: 'Extract', note: 'Document Intelligence receipt model returns fields' },
  { name: 'Review', note: 'Person approves or corrects before saving' },
  { name: 'Store', note: 'Approved rows written to the chosen sink' },
  { name: 'Report', note: 'Power BI reads the sink and refreshes' },
];

// How long the rail holds on each stop before moving to the next.
const RAIL_BEAT_MS = 900;

export default function AzurePage() {
  // Pipeline rail: `beat` counts ticks forever. `at` is the stop that glows
  // now, and `lap` counts full passes so the rail can reset cleanly.
  const [beat, setBeat] = useState(0);
  const at = beat % STEPS.length;
  const lap = Math.floor(beat / STEPS.length);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      console.log('[azure-page] reduced motion preferred, rail stays on first stop');
      return undefined;
    }
    console.log(`[azure-page] rail loop started, ${RAIL_BEAT_MS}ms per stop`);
    const id = setInterval(() => setBeat((b) => b + 1), RAIL_BEAT_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
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
            <div className="eyebrow">Azure, agentic workflow</div>
            <h1>Receipt to <ScrambleWord as="em" text="report." /></h1>
            <p>
              A receipt goes in, structured data comes out, a person approves it, and the approved
              rows feed a Power BI report. This is the planned architecture. The demo video uses
              synthetic data and is not connected to Azure.
            </p>
            <div className="scroll-hint">Scroll to explore</div>
          </header>

          <section className="section" id="pipeline">
            <div className="section-head">
              <span className="idx">01</span>
              <h2>The pipeline</h2>
              <span className="count">{STEPS.length} steps</span>
            </div>
            {/* The rail runs on its own loop. `key={lap}` remounts the track at
                the start of each lap, so the trail snaps back to the first stop
                instead of rewinding across the whole rail. */}
            <div className="rail-track" key={lap} aria-hidden="true">
              {STEPS.map((s, i) => (
                <span
                  key={s.name}
                  className={`rail-cell${i <= at ? ' on' : ''}${i === at ? ' head' : ''}`}
                />
              ))}
            </div>
            <ol className="flow">
              {STEPS.map((s, i) => (
                <li key={s.name} className={`flow-step${i === at ? ' is-lit' : ''}`}>
                  <span className="flow-name">{s.name}</span>
                  <span className="flow-note">{s.note}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="section" id="demo">
            <div className="section-head">
              <span className="idx">02</span>
              <h2>Demo video</h2>
              <span className="count">Synthetic data</span>
            </div>
            <DemoVideo />
          </section>

          <section className="section" id="sinks">
            <div className="section-head">
              <span className="idx">03</span>
              <h2>Where approved rows go</h2>
              <span className="count">Not chosen yet</span>
            </div>
            <div className="sinks">
              <div className="sink">
                <b>Dataverse</b>
                <p>Native to Power Apps and Power BI. Needs a Power Platform environment and licensing.</p>
              </div>
              <div className="sink">
                <b>Azure SQL</b>
                <p>Relational and easy to query. Needs a database and a small amount of schema work.</p>
              </div>
              <div className="sink">
                <b>Excel in OneDrive</b>
                <p>Simplest to share with non-technical users. Writes go through Logic Apps or Power Automate.</p>
              </div>
            </div>
          </section>

          <section className="section" id="interactive">
            <EmbedFrame
              src={`${BASE}demos/receipt-pipeline.html`}
              title="Receipt pipeline interactive demo, synthetic data"
            />
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
