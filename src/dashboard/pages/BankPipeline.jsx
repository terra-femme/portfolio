import HBar from '../charts/HBar';
import { WORKSTREAMS, QUEUES, LOBS, clientsIn, byLob } from '../data/banking';

/**
 * The queues: open work, ageing, and where the SLA is being missed.
 *
 * Ageing is shown as a share of cases past SLA rather than as an average age.
 * An average hides the tail, and the tail is the whole problem: a queue with a
 * median of 27 days and an oldest case of 118 is not a queue that is slightly
 * slow, it is a queue with files nobody has touched in four months.
 */
export default function BankPipeline({ facts }) {
  const clients = clientsIn(facts);
  const lobs = byLob(facts).filter((l) => l.clients > 0);

  const totalOpen = QUEUES.reduce((s, q) => s + q.open, 0);
  const totalBreached = QUEUES.reduce((s, q) => s + q.breached, 0);

  // Named files currently sitting in onboarding, oldest first.
  const inFlight = clients
    .filter((c) => c.onboardingDays != null)
    .sort((a, b) => b.onboardingDays - a.onboardingDays);

  const maxDays = Math.max(120, ...inFlight.map((c) => c.onboardingDays));
  const SLA = WORKSTREAMS[0].sla;

  return (
    <div className="bank-grid">
      <section className="bank-card bank-span-12">
        <header className="bank-card-head">
          <div>
            <h2>Open work by queue</h2>
            <p>
              {totalOpen.toLocaleString('en-US')} open cases, {totalBreached} past SLA,{' '}
              {Math.round((totalBreached / totalOpen) * 100)}% of the book
            </p>
          </div>
        </header>

        <div className="queue-grid">
          {QUEUES.map((q) => {
            const meta = WORKSTREAMS.find((w) => w.id === q.id);
            const pct = (q.breached / q.open) * 100;
            const tone = pct >= 20 ? 'crit' : pct >= 12 ? 'warn' : 'ok';
            return (
              <article className="queue-card" key={q.id}>
                <header>
                  <span className="queue-name">{meta.label}</span>
                  <span className={q.trend >= 0 ? 'bank-pill is-bad' : 'bank-pill is-good'}>
                    {q.trend >= 0 ? '▲' : '▼'} {Math.abs(q.trend)}%
                  </span>
                </header>
                <div className="queue-open">{q.open}<em>open</em></div>
                <div className="queue-bar">
                  <span className={`queue-fill is-${tone}`} style={{ width: `${pct}%` }} />
                </div>
                <ul className="queue-facts">
                  <li><span>Past {meta.sla}d SLA</span><strong className={`is-${tone}`}>{q.breached}</strong></li>
                  <li><span>Median age</span><strong>{q.medianDays}d</strong></li>
                  <li><span>Oldest</span><strong className={q.oldestDays > meta.sla * 2 ? 'is-bad' : undefined}>{q.oldestDays}d</strong></li>
                </ul>
              </article>
            );
          })}
        </div>

        <p className="bank-note">
          <strong>Read:</strong> emergency reviews are the smallest queue and the fastest
          growing, up 11.4%. They are unplanned by definition, so every one of them is taken
          out of the capacity that was supposed to clear periodic reviews.
        </p>
      </section>

      <section className="bank-card bank-span-7">
        <header className="bank-card-head">
          <div>
            <h2>Named files in onboarding</h2>
            <p>Days elapsed against a {SLA} day SLA</p>
          </div>
          <span className="bank-chip">{inFlight.length} in flight</span>
        </header>

        {inFlight.length === 0 ? (
          <p className="bank-empty">No named files in onboarding for this selection.</p>
        ) : (
          <ul className="age-rows">
            {inFlight.map((c) => {
              const over = c.onboardingDays > SLA;
              return (
                <li className="age-row" key={c.name}>
                  <div className="age-label">
                    <strong>{c.name}</strong>
                    <span>{c.pendingLobs.map((id) => LOBS.find((l) => l.id === id).label).join(', ') || 'No line pending'}</span>
                  </div>
                  <div className="age-track">
                    {/* SLA marker sits behind the bar, so an overrun is visibly
                        past a line rather than merely long. */}
                    <span className="age-sla" style={{ left: `${(SLA / maxDays) * 100}%` }} />
                    <span
                      className={over ? 'age-bar is-over' : 'age-bar'}
                      style={{ width: `${(c.onboardingDays / maxDays) * 100}%` }}
                    />
                  </div>
                  <div className="age-value">
                    <strong className={over ? 'is-bad' : undefined}>{c.onboardingDays}d</strong>
                    <span>{c.docs} docs, {c.outreach} asks</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="bank-note">
          <strong>Read:</strong> the vertical rule is the {SLA} day SLA. The longest running
          file has been open {inFlight[0]?.onboardingDays ?? 0} days and has been asked for
          documents {inFlight[0]?.outreach ?? 0} times, which is the point at which a client
          stops answering.
        </p>
      </section>

      <section className="bank-card bank-span-5">
        <header className="bank-card-head">
          <div>
            <h2>Blocked files by line</h2>
            <p>Restricted or under review</p>
          </div>
        </header>
        <HBar
          rows={lobs.map((l) => ({ label: l.label, value: l.blocked, color: l.color }))}
          valueFormat={(v) => String(v)}
        />
        <p className="bank-note">
          <strong>Read:</strong> each line is a separate colour throughout this report because
          each line runs its own onboarding queue. A file blocked on FICC is not blocked on GTB,
          and the two teams clear them independently.
        </p>
      </section>
    </div>
  );
}
