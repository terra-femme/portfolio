import Lollipop from '../charts/Lollipop';
import PetalGauge from '../charts/PetalGauge';
import LineChart from '../charts/LineChart';
import Donut from '../charts/Donut';
import { fmtCompact } from '../charts/primitives';
import {
  LINES, byLine, byClient, headline, FRANCHISE, REVENUE_TREND, RAG_LABEL,
} from '../data/banking';

const HEALTH_TARGET = 62; // the Healthy threshold, drawn on every lollipop

function Tile({ icon, label, value, unit, delta, goodWhen = 'up', foot }) {
  const rising = delta >= 0;
  const healthy = goodWhen === 'up' ? rising : !rising;
  return (
    <article className="bank-tile">
      <header>
        <span className="bank-tile-icon" aria-hidden="true">{icon}</span>
        <span className="bank-tile-label">{label}</span>
      </header>
      <div className="bank-tile-value">
        {value}{unit && <em>{unit}</em>}
        {delta !== undefined && (
          <span className={healthy ? 'bank-pill is-good' : 'bank-pill is-bad'}>
            {rising ? '▲' : '▼'} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {foot && <p className="bank-tile-foot">{foot}</p>}
    </article>
  );
}

export default function BankCoverage({ facts, slicers, setSlicer }) {
  const lines = byLine(facts).filter((l) => l.revenue > 0);
  const clients = byClient(facts);
  const h = headline(facts);

  const worst = [...lines].sort((a, b) => a.health - b.health)[0];
  const best = [...lines].sort((a, b) => b.health - a.health)[0];
  const franchiseHealth = Math.round(
    lines.reduce((s, l) => s + l.health * l.revenue, 0) / (h.revenue || 1)
  );

  const tierMix = ['Tier 1', 'Tier 2', 'Tier 3'].map((t, i) => ({
    label: t,
    value: clients.filter((c) => c.tier === t).reduce((s, c) => s + c.revenue, 0),
    color: ['var(--t-1)', 'var(--t-4)', 'var(--t-6)'][i],
  })).filter((s) => s.value > 0);

  // Trend rows honour the Line slicer, so the chart agrees with the lollipops.
  const shownLines = slicers.line === 'All' ? LINES : LINES.filter((l) => l.id === slicers.line);
  const trendRows = REVENUE_TREND.labels.map((label, i) => ({
    label,
    values: shownLines.map((l) => REVENUE_TREND.series[l.id][i]),
  }));

  return (
    <div className="bank-grid">
      <div className="bank-tiles">
        <Tile
          icon={<svg viewBox="0 0 16 16"><path d="M8 1.5v13" /><path d="M11.5 4.5A2.6 2.6 0 0 0 9 3H7a2.2 2.2 0 0 0 0 4.4h2a2.2 2.2 0 0 1 0 4.4H7a2.6 2.6 0 0 1-2.5-1.5" /></svg>}
          label="Revenue, named"
          value={`$${h.revenue.toFixed(0)}`}
          unit="m"
          delta={6.4}
          foot={`${(FRANCHISE.namedShare * 100).toFixed(0)}% of $${FRANCHISE.revenueYtd}bn franchise`}
        />
        <Tile
          icon={<svg viewBox="0 0 16 16"><circle cx="6" cy="5.5" r="2.4" /><path d="M1.8 13.4a4.4 4.4 0 0 1 8.4 0" /><path d="M11 3.8a2.4 2.4 0 0 1 0 4.6" /></svg>}
          label="Wallet share"
          value={h.wallet.toFixed(1)}
          unit="%"
          delta={0.8}
          foot={`Revenue weighted across ${h.clients} names`}
        />
        <Tile
          icon={<svg viewBox="0 0 16 16"><path d="M8 2.5 14 13H2z" /><path d="M8 6.8v3" /><path d="M8 11.4h.01" /></svg>}
          label="Revenue at risk"
          value={`$${h.atRiskRevenue.toFixed(0)}`}
          unit="m"
          delta={18.2}
          goodWhen="down"
          foot={`${h.atRisk} of ${h.clients} relationships rated At risk`}
        />
        <Tile
          icon={<svg viewBox="0 0 16 16"><path d="M2 12.5 6 7l3 3 5-6.5" /></svg>}
          label="Cross-sell breadth"
          value={h.avgBreadth.toFixed(2)}
          unit={`/${LINES.length}`}
          delta={2.1}
          foot="Lines held above 15% wallet"
        />
      </div>

      {/* The centrepiece. One lollipop per line of business, which is the mark
          this comparison wants: five categories, one measure, a target to beat. */}
      <section className="bank-card bank-span-8">
        <header className="bank-card-head">
          <div>
            <h2>Relationship health by line of business</h2>
            <p>Wallet share, movement and breadth, weighted by revenue</p>
          </div>
          <span className="bank-chip">Target {HEALTH_TARGET}</span>
        </header>

        <Lollipop
          rows={lines.map((l) => ({
            id: l.id,
            label: l.label,
            value: l.health,
            color: l.rag === 'ok' ? 'var(--c-ok)' : l.rag === 'warn' ? 'var(--c-warn)' : 'var(--c-crit)',
            target: HEALTH_TARGET,
            detail: `${l.full} · $${l.revenue.toFixed(1)}m · ${l.wallet}% wallet · ${l.trend > 0 ? '+' : ''}${l.trend}pp`,
          }))}
          selected={slicers.line === 'All' ? null : slicers.line}
          onSelect={(id) => setSlicer('line')(id ?? 'All')}
        />

        <p className="bank-note">
          <strong>Read:</strong> {best.label} leads at {best.health} and {worst.label} trails at{' '}
          {worst.health}, {HEALTH_TARGET - worst.health} points under target. Click a lollipop to
          filter the whole report to that line.
        </p>
      </section>

      <section className="bank-card bank-span-4">
        <header className="bank-card-head">
          <div>
            <h2>Franchise health</h2>
            <p>Revenue weighted across lines</p>
          </div>
        </header>
        <div className="bank-gauge-wrap">
          <PetalGauge
            value={franchiseHealth}
            label="Composite"
            color={franchiseHealth >= 62 ? 'var(--c-ok)' : franchiseHealth >= 42 ? 'var(--c-warn)' : 'var(--c-crit)'}
          />
        </div>
        <ul className="bank-legend">
          {['ok', 'warn', 'crit'].map((r) => (
            <li key={r}>
              <span className={`rag-dot is-${r}`} />
              <span>{RAG_LABEL[r]}</span>
              <em>{lines.filter((l) => l.rag === r).length} lines</em>
            </li>
          ))}
        </ul>
      </section>

      <section className="bank-card bank-span-8">
        <header className="bank-card-head">
          <div>
            <h2>Revenue by line</h2>
            <p>Trailing 12 months, $m</p>
          </div>
        </header>
        <LineChart
          rows={trendRows}
          keys={shownLines.map((l) => l.label)}
          colors={shownLines.map((l) => l.color)}
          height={228}
          yFormat={(v) => '$' + fmtCompact(v, 0) + 'm'}
        />
        <p className="bank-note">
          <strong>Read:</strong> GTB has compounded while Advisory has been flat for four
          quarters, which is why their health scores sit at opposite ends above.
        </p>
      </section>

      <section className="bank-card bank-span-4">
        <header className="bank-card-head">
          <div>
            <h2>Revenue by tier</h2>
            <p>Named accounts</p>
          </div>
        </header>
        <Donut
          slices={tierMix}
          centerLabel="Named"
          valueFormat={(v) => '$' + v.toFixed(0) + 'm'}
          size={158}
        />
      </section>
    </div>
  );
}
