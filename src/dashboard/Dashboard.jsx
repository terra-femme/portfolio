import { useCallback, useEffect, useState } from 'react';
import AzureOverview from './pages/AzureOverview';
import AzureCost from './pages/AzureCost';
import AzureReliability from './pages/AzureReliability';
import ClientOverview from './pages/ClientOverview';
import ClientAccounts from './pages/ClientAccounts';
import ClientEngagement from './pages/ClientEngagement';
import { useElapsed } from './components/hooks';
import { LAST_INGEST } from './data/azure';
import { LAST_SYNC } from './data/clients';

/* --------------------------------------------------------------- icons */
/* Inline so the whole dashboard ships with zero icon-font or SVG-sprite
   requests. Each is a 20x20 stroked glyph inheriting currentColor. */
const Icon = {
  gauge: (
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 15a7 7 0 1 1 14 0" /><path d="M10 15l3.5-5" /></svg>
  ),
  cost: (
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14" /><path d="M13.5 6.5a3 3 0 0 0-3-2h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 1 0 5h-1a3 3 0 0 1-3-2" /></svg>
  ),
  pulse: (
    <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2 10h3l2.5-6 4 12L14 10h4" /></svg>
  ),
  people: (
    <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="7.5" cy="7" r="2.8" /><path d="M2.5 16.5a5 5 0 0 1 10 0" /><path d="M13.5 5.2a2.8 2.8 0 0 1 0 5.4" /><path d="M14.5 12.2a5 5 0 0 1 3 4.3" /></svg>
  ),
  table: (
    <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2" /><path d="M2.5 8h15" /><path d="M8 8v8.5" /></svg>
  ),
  grid: (
    <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="2.5" width="6" height="6" rx="1.5" /><rect x="11.5" y="2.5" width="6" height="6" rx="1.5" /><rect x="2.5" y="11.5" width="6" height="6" rx="1.5" /><rect x="11.5" y="11.5" width="6" height="6" rx="1.5" /></svg>
  ),
};

/* ------------------------------------------------------------- structure */
const REPORTS = [
  {
    id: 'azure',
    label: 'Azure Platform',
    blurb: 'Cost, usage and reliability across the AI estate',
    sync: LAST_INGEST,
    syncLabel: 'Azure Monitor ingest',
    pages: [
      { id: 'overview', label: 'Overview', icon: Icon.gauge, Component: AzureOverview, title: 'Platform overview', sub: 'Spend, traffic and service levels at a glance' },
      { id: 'cost', label: 'Cost & usage', icon: Icon.cost, Component: AzureCost, title: 'Cost and usage', sub: 'Where the money goes, and which quotas are close to the edge' },
      { id: 'reliability', label: 'Reliability', icon: Icon.pulse, Component: AzureReliability, title: 'Reliability', sub: 'Latency distribution, error taxonomy and incident history' },
    ],
  },
  {
    id: 'clients',
    label: 'Client Health',
    blurb: 'Retention, engagement and renewal risk',
    sync: LAST_SYNC,
    syncLabel: 'CRM sync',
    pages: [
      { id: 'portfolio', label: 'Portfolio', icon: Icon.grid, Component: ClientOverview, title: 'Portfolio health', sub: 'ARR, retention and where the churn risk is concentrated' },
      { id: 'accounts', label: 'Accounts', icon: Icon.table, Component: ClientAccounts, title: 'Accounts', sub: 'The full book, sortable and filterable' },
      { id: 'engagement', label: 'Engagement', icon: Icon.people, Component: ClientEngagement, title: 'Engagement', sub: 'Coverage, satisfaction and the interventions in flight' },
    ],
  },
];

const DEFAULT_ROUTE = { report: 'azure', page: 'overview' };

/**
 * Parse `#/report/page` into a route, falling back to the default for anything
 * unrecognised. Using the hash rather than pathname is deliberate: GitHub Pages
 * serves static files with no rewrite rules, so a real path like
 * /portfolio/dashboard/azure/cost would 404 on refresh or on a shared link.
 * Everything after the # is never sent to the server, so the deep link works.
 */
function parseHash(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const report = REPORTS.find((r) => r.id === parts[0]);
  if (!report) return DEFAULT_ROUTE;
  const page = report.pages.find((p) => p.id === parts[1]);
  return { report: report.id, page: page ? page.id : report.pages[0].id };
}

export default function Dashboard() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const [navOpen, setNavOpen] = useState(false);

  // Listen for hash changes so browser back/forward move between pages.
  useEffect(() => {
    const onHash = () => {
      const next = parseHash(window.location.hash);
      console.log('[dashboard] route ->', next.report + '/' + next.page);
      setRoute(next);
      setNavOpen(false);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Normalise the address bar on first load so the URL always reflects what is
  // actually shown -- otherwise a bare /dashboard.html shows the overview while
  // claiming no route at all, and a copied link loses the page.
  useEffect(() => {
    const canonical = `#/${route.report}/${route.page}`;
    if (window.location.hash !== canonical) {
      window.history.replaceState(null, '', canonical);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback((reportId, pageId) => {
    window.location.hash = `#/${reportId}/${pageId}`;
  }, []);

  const report = REPORTS.find((r) => r.id === route.report);
  const page = report.pages.find((p) => p.id === route.page);
  const PageComponent = page.Component;
  const elapsed = useElapsed(report.sync);

  // Scroll back to the top when the page changes -- landing halfway down a new
  // report because the previous one was long is disorienting.
  useEffect(() => {
    const main = document.querySelector('.dash-main');
    if (main) main.scrollTo({ top: 0, behavior: 'auto' });
  }, [route.report, route.page]);

  return (
    <div className={navOpen ? 'dash is-nav-open' : 'dash'}>
      {/* ------------------------------------------------------- sidebar */}
      <aside className="dash-nav" id="dash-nav">
        <a className="dash-brand" href="./" aria-label="Back to Terra Femme portfolio">
          <span className="brand-mark"><span>TERRA</span>FEMME</span>
          <span className="brand-sub">Analytics</span>
        </a>

        <nav className="nav-groups" aria-label="Reports">
          {REPORTS.map((r) => (
            <div className="nav-group" key={r.id}>
              <div className="nav-group-head">
                <span className="nav-group-label">{r.label}</span>
                <span className="nav-group-blurb">{r.blurb}</span>
              </div>
              <ul>
                {r.pages.map((p) => {
                  const current = r.id === route.report && p.id === route.page;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={current ? 'nav-item is-current' : 'nav-item'}
                        aria-current={current ? 'page' : undefined}
                        onClick={() => go(r.id, p.id)}
                      >
                        <span className="nav-icon">{p.icon}</span>
                        {p.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="nav-foot">
          <a className="nav-back" href="./">&larr; Back to portfolio</a>
          <p className="nav-note">
            Demonstration report. All figures are synthetic — no real customer,
            patient or billing data appears anywhere in this dashboard.
          </p>
        </div>
      </aside>

      {/* Click-catcher behind the drawer on mobile. */}
      <button
        type="button"
        className="nav-scrim"
        aria-label="Close navigation"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />

      {/* ---------------------------------------------------------- main */}
      <div className="dash-main">
        <header className="dash-top">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-controls="dash-nav"
            onClick={() => setNavOpen((v) => !v)}
          >
            <span /><span /><span />
            <em className="sr-only">Toggle navigation</em>
          </button>

          <div className="dash-title">
            <span className="crumb">{report.label}</span>
            <h1>{page.title}</h1>
            <p>{page.sub}</p>
          </div>

          <div className="dash-status">
            <span className="live-dot" aria-hidden="true" />
            <span className="status-text">
              <strong>{report.syncLabel}</strong>
              <em>{elapsed}</em>
            </span>
          </div>
        </header>

        {/* Sits OUTSIDE the keyed <main> below, so it doesn't replay its
            entrance animation on every page change -- it is standing context,
            not page content. Rendered on all six pages rather than only the
            landing one, because every page here is independently deep-linkable
            and a visitor may well arrive on any of them. */}
        <section className="dash-intro">
          <p>
            As an <strong>Azure AI Engineer</strong>, working closely with M365 and the
            <strong> Power Platform</strong> is inevitable &mdash; and my skills with{' '}
            <strong>Power BI</strong> and data visualisation are constantly being refined.
          </p>
        </section>

        {/* key forces a remount on navigation so every counter and chart
            replays its entrance animation instead of silently swapping data */}
        <main className="dash-canvas" key={`${route.report}/${route.page}`}>
          <PageComponent />
        </main>

        <footer className="dash-foot">
          <span>&copy; 2026 Terra Femme Tech LLC</span>
          <span>Synthetic data · Hand-built SVG charts · No BI vendor runtime</span>
        </footer>
      </div>
    </div>
  );
}
