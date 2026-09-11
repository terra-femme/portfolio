import Lollipop from '../charts/Lollipop';
import PetalGauge from '../charts/PetalGauge';
import LineChart from '../charts/LineChart';
import Donut from '../charts/Donut';
import HBar from '../charts/HBar';
import {
  WORKSTREAMS, byLob, clientsIn, headline, FRANCHISE, FUNNEL, ALERT_MIX,
  CASE_TREND, RAG_LABEL,
} from '../data/banking';

const HEALTH_TARGET = 75; // the Good standing threshold, drawn on every lollipop

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
  const lobs = byLob(facts).filter((l) => l.clients > 0);
  const clients = clientsIn(facts);
  const h = headline(facts);

  const worst = [...lobs].sort((a, b) => a.health - b.health)[0];
  const best = [...lobs].sort((a, b) => b.health - a.health)[0];
  const bookHealth = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.health, 0) / clients.length)
    : 0;

  const trendRows = CASE_TREND.labels.map((label, i) => ({
    label,
    values: WORKSTREAMS.map((w) => CASE_TREND.series[w.id][i]),
  }));

  return (
    <div className="bank-grid">
      <div className="bank-tiles">
        <Tile
          icon={<svg viewBox="0 0 16 16"><path d="M8 2v12" /><path d="M2 8h12" /></svg>}
          label="In onboarding"
          value={h.inOnboarding}
          delta={4.2}
          goodWhen="down"
          foot={`${h.slaBreaches} past the ${WORKSTREAMS[0].sla} day SLA`}
        />
        <Tile
          icon={<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" /><path d="M8 4.5V8l2.4 1.6" /></svg>}
          label="Reviews overdue"
          value={h.overdue}
          delta={12.5}
          goodWhen="down"
          foot={`${h.dueSoon} more fall due inside 30 days`}
        />
        <Tile
          icon={<svg viewBox="0 0 16 16"><path d="M8 2.5 14 13H2z" /><path d="M8 6.8v3" /><path d="M8 11.4h.01" /></svg>}
          label="Open alerts"
          value={h.openAlerts}
          delta={8.1}
          goodWhen="down"
          foot={`${h.highAlerts} rated High, requiring escalation`}
        />
        <Tile
          icon={<svg viewBox="0 0 16 16"><path d="M3 8.5 6.5 12 13 4.5" /></svg>}
          label="Clear to trade"
          value={clients.length ? Math.round((h.clearToTrade / clients.length) * 100) : 0}
          unit="%"
          delta={-3.4}
          foot={`${h.clearToTrade} of ${h.clients} files in good standing`}
        />
      </div>

      {/* The ask: one lollipop per line of business, because each line carries
          its own book and its own onboarding queue, and they fail differently. */}
      <section className="bank-card bank-span-8">
        <header className="bank-card-head">
          <div>
            <h2>Relationship health by line of business</h2>
            <p>Mean file health: review currency, open alerts, documents, restrictions, outreach</p>
          </div>
          <span className="bank-chip">Target {HEALTH_TARGET}</span>
        </header>

        <Lollipop
          rows={lobs.map((l) => ({
            id: l.id,
            label: l.label,
            value: l.health,
            color: l.color,
            target: HEALTH_TARGET,
            detail: `${l.clients} files · ${l.live} live · ${l.pending} onboarding · ${l.blocked} blocked · ${l.overdue} overdue · ${l.alerts} alerts`,
          }))}
          selected={slicers.lob === 'All' ? null : slicers.lob}
          onSelect={(id) => setSlicer('lob')(id ?? 'All')}
        />

        <p className="bank-note">
          <strong>Read:</strong> {best.label} leads at {best.health} and {worst.label} trails at{' '}
          {worst.health}, carrying {worst.blocked} blocked {worst.blocked === 1 ? 'file' : 'files'} and{' '}
          {worst.overdue} overdue {worst.overdue === 1 ? 'review' : 'reviews'}. Each line is coloured
          separately because they share no queue. Click one to filter the report.
        </p>
      </section>

      <section className="bank-card bank-span-4">
        <header className="bank-card-head">
          <div>
            <h2>Book health</h2>
            <p>Mean across {clients.length} files</p>
          </div>
        </header>
        <div className="bank-gauge-wrap">
          <PetalGauge
            value={bookHealth}
            label="Composite"
            color={bookHealth >= 75 ? 'var(--c-ok)' : bookHealth >= 50 ? 'var(--c-warn)' : 'var(--c-crit)'}
          />
        </div>
        <ul className="bank-legend">
          {['ok', 'warn', 'crit'].map((r) => (
            <li key={r}>
              <span className={`rag-dot is-${r}`} />
              <span>{RAG_LABEL[r]}</span>
              <em>{clients.filter((c) => c.rag === r).length} files</em>
            </li>
          ))}
        </ul>
      </section>

      <section className="bank-card bank-span-5">
        <header className="bank-card-head">
          <div>
            <h2>Onboarding funnel</h2>
            <p>Open cases by stage, median days to reach it</p>
          </div>
        </header>
        {/* One hue, not the line-of-business palette. Funnel stages are
            SEQUENTIAL, and giving each its own categorical colour would imply
            the stages are unrelated categories, which is the opposite of what a
            funnel says. Lightness carries the ordering instead. */}
        <HBar
          rows={FUNNEL.map((f, i) => ({
            label: f.stage,
            value: f.cases,
            color: `color-mix(in oklab, var(--t-1) ${100 - i * 13}%, #ffffff)`,
          }))}
          valueFormat={(v) => String(v)}
        />
        <p className="bank-note">
          <strong>Read:</strong> the biggest fall is between KYC pack issued and documents
          received, {FUNNEL[1].cases - FUNNEL[2].cases} cases, and it is the stage the bank
          does not control. That gap is what repeat outreach is trying to close.
        </p>
      </section>

      <section className="bank-card bank-span-4">
        <header className="bank-card-head">
          <div>
            <h2>Open screening alerts</h2>
            <p>By alert type, franchise wide</p>
          </div>
        </header>
        <Donut
          slices={ALERT_MIX}
          centerLabel="Open alerts"
          valueFormat={(v) => String(v)}
          size={158}
        />
      </section>

      <section className="bank-card bank-span-3">
        <header className="bank-card-head">
          <div>
            <h2>Scale</h2>
            <p>Franchise, year to date</p>
          </div>
        </header>
        <ul className="stat-list">
          <li><span>Active clients</span><strong>{FRANCHISE.activeClients.toLocaleString('en-US')}</strong></li>
          <li><span>Cases handled</span><strong>{FRANCHISE.casesYtd.toLocaleString('en-US')}</strong></li>
          <li><span>Alerts screened</span><strong>{FRANCHISE.alertsScreenedYtd}M</strong></li>
          <li><span>Docs outstanding</span><strong className="is-bad">{h.docsOutstanding}</strong></li>
        </ul>
      </section>

      <section className="bank-card bank-span-12">
        <header className="bank-card-head">
          <div>
            <h2>Case volume by queue</h2>
            <p>Trailing 12 months, open cases</p>
          </div>
        </header>
        <LineChart
          rows={trendRows}
          keys={WORKSTREAMS.map((w) => w.label)}
          colors={['var(--t-1)', 'var(--t-4)', 'var(--c-crit)', 'var(--t-2)']}
          height={220}
          yFormat={(v) => String(Math.round(v))}
        />
        <p className="bank-note">
          <strong>Read:</strong> emergency reviews are up 161% over the year while periodic
          reviews fall. Unplanned work is displacing planned work, and that is the mechanism
          that pushes files past their review date in the first place.
        </p>
      </section>
    </div>
  );
}
