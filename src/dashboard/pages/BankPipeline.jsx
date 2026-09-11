import HBar from '../charts/HBar';
import { LINES, MANDATES, byClient } from '../data/banking';

const WEEKS = 26;
const MONTH_TICKS = [0, 4, 9, 13, 17, 22, 26];
const MONTH_LABELS = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
// Ordered from least to most committed, so the bars read as a funnel.
const STAGES = ['Pitch', 'Diligence', 'Structuring', 'Documentation', 'Onboarding', 'Execution'];

/**
 * Mandate timeline: a Gantt of live deals across the next two quarters.
 *
 * Position and length carry start and duration, colour carries the line of
 * business so it ties back to the lollipops, and bar width is deliberately NOT
 * used for deal value. Encoding two different measures in one bar's geometry is
 * how timelines start lying; value stays as a number in the row.
 */
export default function BankPipeline({ facts, slicers }) {
  const clientSet = new Set(byClient(facts).map((c) => c.name));
  const rows = MANDATES
    .filter((m) => clientSet.has(m.client))
    .filter((m) => slicers.line === 'All' || m.line === slicers.line)
    .sort((a, b) => a.start - b.start);

  const total = rows.reduce((s, m) => s + m.value, 0);
  const pct = (w) => (w / WEEKS) * 100;

  return (
    <div className="bank-grid">
      <section className="bank-card bank-span-12">
        <header className="bank-card-head">
          <div>
            <h2>Live mandates</h2>
            <p>{rows.length} active, ${total}m aggregate value, next two quarters</p>
          </div>
          <span className="bank-legend-inline">
            {LINES.map((l) => (
              <span key={l.id}>
                <span className="rag-dot" style={{ background: l.color }} />{l.label}
              </span>
            ))}
          </span>
        </header>

        {rows.length === 0 ? (
          <p className="bank-empty">No mandates match these filters.</p>
        ) : (
          <div className="gantt">
            <div className="gantt-axis" aria-hidden="true">
              {MONTH_TICKS.map((w, i) => (
                <span key={w} className="gantt-tick" style={{ left: `${pct(w)}%` }}>
                  {MONTH_LABELS[i]}
                </span>
              ))}
            </div>

            <ul className="gantt-rows">
              {rows.map((m) => {
                const line = LINES.find((l) => l.id === m.line);
                return (
                  <li className="gantt-row" key={m.client + m.name}>
                    <div className="gantt-label">
                      <strong>{m.name}</strong>
                      <span>{m.client}</span>
                    </div>
                    <div className="gantt-track">
                      {MONTH_TICKS.map((w) => (
                        <span key={w} className="gantt-gridline" style={{ left: `${pct(w)}%` }} />
                      ))}
                      <span
                        className="gantt-bar"
                        style={{
                          left: `${pct(m.start)}%`,
                          width: `${pct(m.end - m.start)}%`,
                          background: line.color,
                        }}
                        title={`${m.name} · ${line.label} · ${m.stage} · $${m.value}m`}
                      >
                        <em>{m.stage}</em>
                      </span>
                    </div>
                    <div className="gantt-value mono">${m.value}m</div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <p className="bank-note">
          <strong>Read:</strong> bar length is duration, not deal size. Value stays a number in
          the last column, because encoding two measures in one bar's geometry is how a
          timeline starts misreporting.
        </p>
      </section>

      <section className="bank-card bank-span-6">
        <header className="bank-card-head">
          <div>
            <h2>Value by line</h2>
            <p>Aggregate mandate value, $m</p>
          </div>
        </header>
        <HBar
          rows={LINES.map((l) => ({
            label: l.label,
            value: rows.filter((m) => m.line === l.id).reduce((s, m) => s + m.value, 0),
            color: l.color,
          })).filter((r) => r.value > 0)}
          valueFormat={(v) => '$' + v + 'm'}
          showPercent
        />
      </section>

      <section className="bank-card bank-span-6">
        <header className="bank-card-head">
          <div>
            <h2>By stage</h2>
            <p>Where the book sits today</p>
          </div>
        </header>
        <HBar
          rows={STAGES.map((stage, i) => ({
            label: stage,
            value: rows.filter((m) => m.stage === stage).reduce((s, m) => s + m.value, 0),
            color: `var(--t-${i + 1})`,
          })).filter((r) => r.value > 0)}
          valueFormat={(v) => '$' + v + 'm'}
        />
        <p className="bank-note">
          <strong>Read:</strong> ${rows.filter((m) => m.stage === 'Pitch').reduce((s, m) => s + m.value, 0)}m
          is still at Pitch, which is the least certain stage and the largest single band.
        </p>
      </section>
    </div>
  );
}
