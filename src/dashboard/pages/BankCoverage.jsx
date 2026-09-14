import RadialRings from '../charts/RadialRings';
import PetalGauge from '../charts/PetalGauge';
import Donut from '../charts/Donut';
import HBar from '../charts/HBar';
import {
  WORKSTREAMS, byLob, clientsIn, headline, FRANCHISE, FUNNEL, ALERT_MIX, RAG_LABEL,
  UMBRELLAS, groupByUmbrella,
} from '../data/banking';

/** "A", "A and B", or "A, B and C": grammatical whether one line ties or four do. */
function listJoin(items) {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

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

/**
 * One radial card per line of business.
 *
 * Three concentric rings, one per population, each carrying the RAG colour of
 * the band it measures so amber reads as amber. The line's own colour stays on
 * the header swatch, the slicer pill and the matrix header, where it identifies
 * the line rather than a condition.
 *
 * A distribution rather than a mean, because a mean hides the shape: ten clean
 * files and two impaired ones average the same as twelve mediocre ones, and
 * those are completely different mornings.
 */
function LobCard({ lob, scaleMax, selected, onSelect }) {
  const rings = [
    { label: RAG_LABEL.ok, short: 'Good', value: lob.good, color: 'var(--c-ok)' },
    { label: RAG_LABEL.warn, short: 'Attention', value: lob.attention, color: 'var(--c-warn)' },
    { label: RAG_LABEL.crit, short: 'Impaired', value: lob.impaired, color: 'var(--c-crit)' },
  ];

  return (
    <button
      type="button"
      className={selected ? 'lob-card is-on' : 'lob-card'}
      aria-pressed={selected}
      onClick={() => onSelect(selected ? null : lob.id)}
      title={`${lob.full}: ${lob.clients} files`}
    >
      <span className="lob-card-head">
        <span className="lob-swatch" style={{ background: lob.color }} aria-hidden="true" />
        <span className="lob-name">{lob.label}</span>
        <span className={`rag-badge is-${lob.rag}`}>{lob.health}</span>
      </span>

      <RadialRings
        rings={rings}
        max={scaleMax}
        center={lob.clients}
        centerLabel="files"
      />

      <span className="lob-counts">
        {rings.map((r) => (
          <span key={r.label}>
            <span className="rag-dot" style={{ background: r.color }} />
            {r.value}
          </span>
        ))}
      </span>

      <span className="lob-sub">
        {lob.blocked} blocked · {lob.overdue} overdue
      </span>
    </button>
  );
}

export default function BankCoverage({ facts, slicers, setSlicer }) {
  const lobs = byLob(facts).filter((l) => l.clients > 0);
  const clients = clientsIn(facts);
  const h = headline(facts);

  // Not a superlative: four lines tie on impaired count, so naming one "the
  // worst" would be false precision. The interesting fact is WHY they tie.
  // One scale for every card: rings are only comparable if they share a max.
  const scaleMax = Math.max(1, ...lobs.map((l) => l.clients));
  const impairedClients = clients.filter((c) => c.rag === 'crit');
  const cleanLines = lobs.filter((l) => l.impaired === 0);
  const bookHealth = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.health, 0) / clients.length)
    : 0;

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

      <section className="bank-card bank-span-12">
        <header className="bank-card-head">
          <div>
            <h2>Relationship health by line of business</h2>
            <p>Rings are populations on a shared scale, so a shorter ring is a smaller group</p>
          </div>
          <span className="bank-legend-inline">
            {['ok', 'warn', 'crit'].map((r) => (
              <span key={r}><span className={`rag-dot is-${r}`} />{RAG_LABEL[r]}</span>
            ))}
          </span>
        </header>

        <div className="lob-groups">
          {groupByUmbrella(lobs).map((g) => {
            const u = UMBRELLAS.find((um) => um.id === g.umbrella);
            return (
              <div key={g.umbrella} className="lob-group" style={{ '--n': g.lobs.length }}>
                <span className="lob-group-label" title={u?.full}>
                  {u?.label}
                </span>
                <div className="lob-group-cards">
                  {g.lobs.map((lob) => (
                    <LobCard
                      key={lob.id}
                      lob={lob}
                      scaleMax={scaleMax}
                      selected={slicers.lob === lob.id}
                      onSelect={(id) => setSlicer('lob')(id ?? 'All')}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="bank-note">
          <strong>Read:</strong> every line except{' '}
          {cleanLines.length ? listJoin(cleanLines.map((l) => l.label)) : 'none'} carries the
          same impaired count, because it is the same{' '}
          {impairedClients.length} {impairedClients.length === 1 ? 'name' : 'names'} on each of
          them: {listJoin(impairedClients.map((c) => c.name))}.
          {cleanLines.length > 0 && ` ${listJoin(cleanLines.map((l) => l.label))} ${cleanLines.length === 1 ? 'is' : 'are'} clear only because neither is onboarded to ${cleanLines.length === 1 ? 'it' : 'them'}.`}{' '}
          A lapsed review blocks a client on every line at once, so these counts move together
          rather than independently. Click any line to filter the report to it.
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
            <p>Open cases by stage, franchise wide</p>
          </div>
        </header>
        {/* One hue, not the line of business palette. Funnel stages are
            SEQUENTIAL, and a categorical colour per stage would imply the stages
            are unrelated. Lightness carries the ordering instead. */}
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

      <section className="bank-card bank-span-3">
        <header className="bank-card-head">
          <div>
            <h2>Open alerts</h2>
            <p>By type</p>
          </div>
        </header>
        <Donut
          slices={ALERT_MIX}
          centerLabel="Open"
          valueFormat={(v) => String(v)}
          size={140}
          legend={false}
        />
        <ul className="bank-legend">
          {ALERT_MIX.map((a) => (
            <li key={a.label}>
              <span className="rag-dot" style={{ background: a.color }} />
              <span>{a.label}</span>
              <em>{a.value}</em>
            </li>
          ))}
        </ul>
      </section>

      <section className="bank-card bank-span-12">
        <header className="bank-card-head">
          <div>
            <h2>Scale</h2>
            <p>Franchise, year to date. The named book above is the top {Math.round(FRANCHISE.namedShare * 100)}%</p>
          </div>
        </header>
        <ul className="stat-list is-row">
          <li><span>Active clients</span><strong>{FRANCHISE.activeClients.toLocaleString('en-US')}</strong></li>
          <li><span>Cases processed</span><strong>{FRANCHISE.casesYtd.toLocaleString('en-US')}</strong></li>
          <li><span>Alerts generated</span><strong>{FRANCHISE.alertsScreenedYtd}M</strong></li>
          <li><span>Docs outstanding</span><strong className="is-bad">{h.docsOutstanding}</strong></li>
          <li><span>Repeat outreach</span><strong className={h.repeatOutreach ? 'is-bad' : undefined}>{h.repeatOutreach} files</strong></li>
        </ul>
      </section>
    </div>
  );
}
