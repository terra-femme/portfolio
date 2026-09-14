import { useState } from 'react';
import Lollipop from '../charts/Lollipop';
import {
  LOBS, UMBRELLAS, STATUS, clientsIn, RAG_LABEL, groupByUmbrella,
} from '../data/banking';

/**
 * The client book: every named file against every line of business.
 *
 * The cell is the file's STATUS on that line, not a number, because that is the
 * question the desk actually asks. "Can I trade this client on FICC today" has
 * a categorical answer, and forcing it into a number would invent precision
 * the underlying fact does not have.
 *
 * Rows arrive worst first. This is a work queue, not a league table, so the top
 * of the list should be what needs doing rather than what is biggest.
 */
export default function BankRelationships({ facts, setSlicer }) {
  const clients = clientsIn(facts);
  const [open, setOpen] = useState(null);
  const detail = clients.find((c) => c.name === open);
  const groups = groupByUmbrella(LOBS);

  const impaired = clients.filter((c) => c.rag === 'crit');
  const worst = impaired[0];

  return (
    <div className="bank-grid">
      <section className="bank-card bank-span-12">
        <header className="bank-card-head">
          <div>
            <h2>Client book</h2>
            <p>{clients.length} named files, worst first. Each cell is the file status on that line</p>
          </div>
          <span className="bank-legend-inline">
            {['ok', 'warn', 'crit'].map((r) => (
              <span key={r}><span className={`rag-dot is-${r}`} />{RAG_LABEL[r]}</span>
            ))}
          </span>
        </header>

        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr className="matrix-umbrella-row">
                <th colSpan={3} />
                {groups.map((g) => {
                  const u = UMBRELLAS.find((um) => um.id === g.umbrella);
                  return (
                    <th key={g.umbrella} colSpan={g.lobs.length} className="matrix-umbrella" title={u?.full}>
                      {u?.label}
                    </th>
                  );
                })}
                <th colSpan={4} />
              </tr>
              <tr>
                <th className="matrix-name">Client</th>
                <th>Risk</th>
                <th>Region</th>
                {LOBS.map((l) => (
                  <th key={l.id} className="matrix-line">
                    <button type="button" onClick={() => setSlicer('lob')(l.id)} title={l.full}>
                      <span className="lob-swatch" style={{ background: l.color }} aria-hidden="true" />
                      {l.label}
                    </button>
                  </th>
                ))}
                <th className="is-right">Review due</th>
                <th className="is-right">Alerts</th>
                <th className="is-right">Docs</th>
                <th className="is-right">Health</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.name}
                  className={open === c.name ? 'is-open' : undefined}
                  onClick={() => setOpen(open === c.name ? null : c.name)}
                >
                  <td className="matrix-name"><strong>{c.name}</strong></td>
                  <td><span className={`risk-tag is-${c.risk.toLowerCase()}`}>{c.risk}</span></td>
                  <td>{c.region}</td>
                  {LOBS.map((l) => {
                    const status = c.lobs[l.id];
                    const meta = STATUS[status];
                    return (
                      <td
                        key={l.id}
                        className={meta.rag ? `matrix-cell is-${meta.rag}` : 'matrix-cell is-empty'}
                        title={`${c.name} · ${l.full}: ${meta.label}`}
                      >
                        {status === 'none' ? 'n/a' : meta.label}
                      </td>
                    );
                  })}
                  <td className="is-right">
                    <span className={c.overdue ? 'due is-over' : c.dueSoon ? 'due is-soon' : 'due'}>
                      {c.overdue ? `${Math.abs(c.kycDueDays)}d over` : `${c.kycDueDays}d`}
                    </span>
                  </td>
                  <td className="is-right">
                    {c.openAlerts === 0 ? <span className="muted">0</span> : (
                      <span className={c.highAlerts ? 'rag-badge is-crit' : 'rag-badge is-warn'}>
                        {c.openAlerts}
                      </span>
                    )}
                  </td>
                  <td className="is-right">{c.docs === 0 ? <span className="muted">0</span> : c.docs}</td>
                  <td className="is-right">
                    <span className={`rag-badge is-${c.rag}`}>{c.health}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="bank-note">
          {worst ? (
            <>
              <strong>Read:</strong> <strong>{worst.name}</strong> scores {worst.health}.
              {worst.overdue ? ` Its periodic review is ${Math.abs(worst.kycDueDays)} days overdue,` : ''}
              {worst.highAlerts > 0 ? ` it carries ${worst.highAlerts} High severity alert${worst.highAlerts > 1 ? 's' : ''},` : ''}
              {worst.restrictedLobs.length > 0 ? ` and ${worst.restrictedLobs.length} of its lines are restricted,` : ''}
              {' '}so the desk cannot transact it. Click any row to drill through.
            </>
          ) : (
            <><strong>Read:</strong> no impaired files in this selection. Click any row to drill through.</>
          )}
        </p>
      </section>

      {detail && (
        <section className="bank-card bank-span-12 bank-drill">
          <header className="bank-card-head">
            <div>
              <h2>{detail.name}</h2>
              <p>
                {detail.region} · {detail.risk} risk · {detail.liveLobs.length} live,{' '}
                {detail.pendingLobs.length} onboarding, {detail.restrictedLobs.length} restricted ·{' '}
                {detail.outreach} outreach {detail.outreach === 1 ? 'attempt' : 'attempts'}
              </p>
            </div>
            <button type="button" className="bank-clear" onClick={() => setOpen(null)}>Close</button>
          </header>

          <div className="drill-split">
            <div>
              <h3 className="drill-h">What is outstanding</h3>
              <ul className="deduction-list">
                <Deduction
                  on={detail.overdue}
                  label={`Periodic review ${Math.abs(detail.kycDueDays)} days overdue`}
                  cost={Math.min(35, 10 + Math.abs(detail.kycDueDays) * 0.4)}
                />
                {detail.alerts.map((a) => (
                  <Deduction
                    key={a.type + a.ageDays}
                    on
                    label={`${a.type} alert, ${a.severity} severity, open ${a.ageDays} days`}
                    cost={a.severity === 'High' ? 18 : 8}
                  />
                ))}
                <Deduction
                  on={detail.docs > 0}
                  label={`${detail.docs} ${detail.docs === 1 ? 'document' : 'documents'} outstanding`}
                  cost={Math.min(20, detail.docs * 2.5)}
                />
                <Deduction
                  on={detail.restrictedLobs.length > 0}
                  label={`Restricted on ${detail.restrictedLobs.map((id) => LOBS.find((l) => l.id === id).label).join(', ')}`}
                  cost={15}
                />
                <Deduction
                  on={detail.outreach > 2}
                  label={`${detail.outreach} separate requests for the same documents`}
                  cost={Math.min(12, Math.max(0, detail.outreach - 2) * 3)}
                />
                {detail.slaBreach && (
                  <Deduction
                    on
                    label={`In onboarding ${detail.onboardingDays} days against a 45 day SLA`}
                    cost={0}
                  />
                )}
                {detail.health === 100 && (
                  <li className="deduction is-clean">Nothing outstanding. This file is clean.</li>
                )}
              </ul>
              <p className="drill-total">
                <span>Health</span>
                <strong className={`rag-badge is-${detail.rag}`}>{detail.health}</strong>
                <em>100 less the deductions above</em>
              </p>
            </div>

            <div>
              <h3 className="drill-h">Status by line of business</h3>
              <Lollipop
                rows={LOBS.map((l) => {
                  const status = detail.lobs[l.id] ?? 'none';
                  const value = status === 'live' ? 100
                    : status === 'pending' ? 55
                      : status === 'review' ? 40
                        : status === 'restricted' ? 15 : 0;
                  return {
                    id: l.id,
                    label: l.label,
                    value,
                    color: l.color,
                    detail: STATUS[status].label,
                  };
                })}
                max={100}
                valueFormat={() => ''}
                labelWidth={78}
              />
              <p className="bank-note">
                <strong>Read:</strong> a full stem is live and clear, a short one is restricted.
                Each line carries its own colour because each line owns its own file.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/** One line of the health deduction, so the score is auditable rather than asserted. */
function Deduction({ on, label, cost }) {
  if (!on) return null;
  return (
    <li className="deduction">
      <span>{label}</span>
      {cost > 0 && <em>-{Math.round(cost)}</em>}
    </li>
  );
}
