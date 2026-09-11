import { useMemo, useState } from 'react';
import BankCoverage from './pages/BankCoverage';
import BankRelationships from './pages/BankRelationships';
import BankPipeline from './pages/BankPipeline';
import { useElapsed } from './components/hooks';
import {
  FACTS, LOBS, REGIONS, RISK_RATINGS, applySlicers, LAST_REFRESH,
} from './data/banking';

const TABS = [
  { id: 'coverage', label: 'Lifecycle', Component: BankCoverage, title: 'Client lifecycle health' },
  { id: 'relationships', label: 'Client book', Component: BankRelationships, title: 'Client book' },
  { id: 'pipeline', label: 'Queues', Component: BankPipeline, title: 'Queues and ageing' },
];

const icons = {
  coverage: <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" /></svg>,
  relationships: <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="6" cy="5.5" r="2.4" /><path d="M1.8 13.4a4.4 4.4 0 0 1 8.4 0" /><path d="M11 3.8a2.4 2.4 0 0 1 0 4.6" /><path d="M12 9.8a4.2 4.2 0 0 1 2.4 3.6" /></svg>,
  pipeline: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4h8" /><path d="M2 8h11" /><path d="M2 12h6" /></svg>,
};

/**
 * The second report: institutional client coverage.
 *
 * Built around cross-filtering, which is the interaction the first report does
 * not have. Every slicer and every clickable mark narrows ONE shared row set,
 * and every visual on the page is a pure function of that row set. Nothing
 * recomputes a private copy, so nothing can disagree with anything else.
 *
 * That is also why the filter state lives here rather than in the pages: a
 * slicer set on Coverage is still set when you move to Relationships, which is
 * what a real report does and what makes the two pages feel like one document.
 */
export default function BankingDashboard() {
  const [tab, setTab] = useState('coverage');
  const [slicers, setSlicers] = useState({ region: 'All', lob: 'All', risk: 'All' });

  const facts = useMemo(() => applySlicers(FACTS, slicers), [slicers]);
  const elapsed = useElapsed(LAST_REFRESH);

  const active = TABS.find((t) => t.id === tab);
  const PageComponent = active.Component;

  const set = (key) => (value) => setSlicers((s) => ({ ...s, [key]: value }));
  const filtered = slicers.region !== 'All' || slicers.lob !== 'All' || slicers.risk !== 'All';
  const clearAll = () => setSlicers({ region: 'All', lob: 'All', risk: 'All' });

  return (
    <div className="bank">
      <header className="bank-top">
        <span className="bank-brand">
          <span className="bank-logo" aria-hidden="true" />
          Client<em>Lifecycle</em>
        </span>

        <nav className="bank-tabs" aria-label="Report pages">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={t.id === tab ? 'bank-tab is-on' : 'bank-tab'}
              aria-current={t.id === tab ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              <span className="bank-tab-icon">{icons[t.id]}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <span className="bank-sync">
          <span className="live-dot" aria-hidden="true" />
          {elapsed}
        </span>
      </header>

      <div className="bank-body">
        <div className="bank-titlerow">
          <h1>{active.title}</h1>

          {/* Slicers. Power BI calls them slicers, Tableau calls them quick
              filters; either way they narrow the shared row set rather than
              each visual filtering itself. */}
          <div className="bank-slicers">
            <Slicer label="Region" value={slicers.region} options={REGIONS} onChange={set('region')} />
            <Slicer label="Line" value={slicers.lob} options={LOBS.map((l) => l.id)}
              display={(id) => LOBS.find((l) => l.id === id)?.label ?? id}
              swatch={(id) => LOBS.find((l) => l.id === id)?.color}
              onChange={set('lob')} />
            <Slicer label="Risk" value={slicers.risk} options={RISK_RATINGS} onChange={set('risk')} />
            {filtered && (
              <button type="button" className="bank-clear" onClick={clearAll}>
                Clear filters
              </button>
            )}
          </div>
        </div>

        {facts.length === 0 ? (
          <p className="bank-empty">No rows match these filters. <button type="button" onClick={clearAll}>Clear them</button>.</p>
        ) : (
          <PageComponent facts={facts} slicers={slicers} setSlicer={set} />
        )}
      </div>
    </div>
  );
}

/** One slicer: a row of pills, "All" plus each value. */
function Slicer({ label, value, options, onChange, display = (v) => v, swatch }) {
  return (
    <div className="slicer" role="group" aria-label={label}>
      <span className="slicer-label">{label}</span>
      <div className="slicer-pills">
        {['All', ...options].map((opt) => (
          <button
            key={opt}
            type="button"
            className={opt === value ? 'slicer-pill is-on' : 'slicer-pill'}
            aria-pressed={opt === value}
            onClick={() => onChange(opt)}
          >
            {opt !== 'All' && swatch && (
              <span className="slicer-swatch" style={{ background: swatch(opt) }} aria-hidden="true" />
            )}
            {opt === 'All' ? 'All' : display(opt)}
          </button>
        ))}
      </div>
    </div>
  );
}
