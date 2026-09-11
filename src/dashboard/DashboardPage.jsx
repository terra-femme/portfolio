import { useEffect } from 'react';
import Lenis from 'lenis';
import Background3D from '../Background3D';
import ScrambleNav from '../ScrambleNav';
import { navLinks } from '../navLinks';
import Dashboard from './Dashboard';
import BankingDashboard from './BankingDashboard';

const NAV_LINKS = navLinks('dashboard');

/**
 * The work page that hosts running pieces.
 *
 * This is a separate HTML document from the portfolio, but deliberately not a
 * separate site: same nav, same Background3D, same type scale, same border
 * language. Only the profile sidebar is dropped, so a piece gets the full
 * measure to work in.
 *
 * The dashboard itself keeps its dark theme and sits inside a framed window.
 * That is the point of the frame: a dark panel floating on a light page reads
 * as an application being demonstrated, the same way a screenshot in a browser
 * chrome does, rather than as a section that forgot the stylesheet.
 *
 * Pieces are a flex column, so a second one is a second <section> below with no
 * layout work.
 */
export default function DashboardPage() {
  // Same smooth scroll as the home page. Without it the nav transition between
  // documents feels like a different site even when the pixels match.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
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
        <div className="piece-container">
          <header className="piece-intro" id="top">
            <div className="eyebrow">Interactive work</div>
            <h1>Dashboards</h1>
            <p>
              As an <strong>Azure AI Engineer</strong>, working closely with M365 and the
              <strong> Power Platform</strong> is inevitable and my skills with{' '}
              <strong>Power BI</strong> and data visualisation are constantly being refined.
            </p>
          </header>

          <section className="section" id="dashboards">
            <div className="section-head">
              <span className="idx">01</span>
              <h2>Analytics report</h2>
              <span className="count">6 pages &middot; live in the frame</span>
            </div>

            <div className="piece-frame">
              {/* Window chrome, so the dark interior reads as a running app. */}
              <div className="piece-chrome">
                <span className="piece-dots" aria-hidden="true">
                  <span /><span /><span />
                </span>
                <span className="piece-url">terra-femme.github.io/portfolio/dashboard</span>
                {/* New tab, so leaving the frame never loses the page you were
                    on inside it. ?full=1 renders the dashboard without the
                    portfolio chrome. */}
                <a
                  className="piece-open"
                  href="./dashboard.html?full=1"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open the dashboard full screen in a new tab"
                >
                  Open full screen
                </a>
              </div>

              {/* The piece scrolls inside its own frame. data-lenis-prevent hands
                  wheel events back to the browser while the cursor is over it,
                  the same trick the home page uses for the profile panel. */}
              <div className="piece-stage" data-lenis-prevent>
                <Dashboard embedded />
              </div>
            </div>

            <div className="piece-caption">
              <span><strong>Two reports</strong> Azure platform, client health</span>
              <span><strong>Charts</strong> hand-written SVG, no charting library</span>
              <span><strong>Data</strong> synthetic, derived from stated unit rates</span>
            </div>
          </section>

          <section className="section" id="coverage">
            <div className="section-head">
              <span className="idx">02</span>
              <h2>Client lifecycle</h2>
              <span className="count">3 pages &middot; onboarding, review, screening</span>
            </div>

            <p className="piece-lede">
              I am versed in utilizing industry accepted Tableau as well, for massive
              amounts of data. In investment banks with multiple lines like FIC, Markets
              and GTB, I need to visualize the health of each client relationship in the
              client&rsquo;s proprietary system.
            </p>

            {/* is-light: this piece is a white Tableau style worksheet, so the
                frame and its chrome invert too. */}
            <div className="piece-frame is-light">
              <div className="piece-chrome">
                <span className="piece-dots" aria-hidden="true">
                  <span /><span /><span />
                </span>
                <span className="piece-url">client lifecycle &middot; onboarding, review and screening</span>
                <a
                  className="piece-open"
                  href="./dashboard.html?full=1&amp;report=coverage"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open the coverage report full screen in a new tab"
                >
                  Open full screen
                </a>
              </div>

              <div className="piece-stage" data-lenis-prevent>
                <BankingDashboard />
              </div>
            </div>

            <div className="piece-caption">
              <span><strong>Workstreams</strong> onboarding, periodic review, emergency review, screening</span>
              <span><strong>Health</strong> scored down from a clean file, every deduction itemised</span>
              <span><strong>Slicers</strong> region, line, risk rating, cross-filtering every visual</span>
            </div>
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
