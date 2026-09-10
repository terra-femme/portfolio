import { useMemo, useState } from 'react';
import Panel, { Callout, Pill } from '../components/Panel';
import DataTable from '../components/DataTable';
import Sparkline from '../charts/Sparkline';
import { fmtCurrency, fmtSigned, daysUntil } from '../charts/primitives';
import { accounts } from '../data/clients';

const SEGMENTS = ['All', 'Enterprise', 'Mid-Market', 'SMB'];

/** Health bands. Kept as one function so the table, the pill and the meter
 *  can never disagree about what "at risk" means. */
function healthTone(score) {
  if (score < 40) return 'crit';
  if (score < 60) return 'warn';
  if (score < 80) return 'neutral';
  return 'ok';
}

export default function ClientAccounts() {
  const [segment, setSegment] = useState('All');
  const [riskOnly, setRiskOnly] = useState(false);

  const rows = useMemo(() => accounts.filter((a) => {
    if (segment !== 'All' && a.segment !== segment) return false;
    if (riskOnly && a.health >= 60) return false;
    return true;
  }), [segment, riskOnly]);

  const shownArr = rows.reduce((sum, a) => sum + a.arr, 0);

  return (
    <div className="panel-grid">
      {/* "named accounts": these 14 are the Enterprise/Mid-Market/SMB book in
          full. The remaining 54 of the 68 total are public-sector, reported in
          aggregate on the Portfolio page rather than line by line. */}
      <Panel
        span={12}
        title="Account book"
        subtitle={`${rows.length} of ${accounts.length} named accounts · ${fmtCurrency(shownArr)} ARR shown`}
        hint="Click any column to sort"
      >
        <div className="filter-bar">
          <div className="chip-group" role="group" aria-label="Filter by segment">
            {SEGMENTS.map((s) => (
              <button
                key={s}
                type="button"
                className={segment === s ? 'chip is-on' : 'chip'}
                onClick={() => setSegment(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={riskOnly} onChange={(e) => setRiskOnly(e.target.checked)} />
            <span>At-risk only (health &lt; 60)</span>
          </label>
        </div>

        {rows.length === 0 ? (
          <p className="empty-state">No accounts match this filter.</p>
        ) : (
          <DataTable
            defaultSort="arr"
            rows={rows}
            columns={[
              { key: 'name', label: 'Account', render: (r) => <span className="strong">{r.name}</span> },
              { key: 'segment', label: 'Segment' },
              { key: 'arr', label: 'ARR', align: 'right', render: (r) => fmtCurrency(r.arr) },
              {
                key: 'health',
                label: 'Health',
                align: 'right',
                render: (r) => (
                  <span className="inline-meter">
                    <span className={`inline-meter-fill is-${healthTone(r.health)}`} style={{ width: `${r.health}%` }} />
                    <em>{r.health}</em>
                  </span>
                ),
              },
              {
                key: 'trend',
                label: 'Trend',
                align: 'right',
                render: (r) => (
                  <span className={r.trend === 0 ? 'delta is-flat' : r.trend > 0 ? 'delta is-good' : 'delta is-bad'}>
                    {fmtSigned(r.trend, 0)}
                  </span>
                ),
              },
              {
                key: 'spark',
                label: 'Usage, 8q',
                render: (r) => (
                  <Sparkline
                    values={r.spark}
                    color={r.spark[7] >= r.spark[0] ? 'var(--c-ok)' : 'var(--c-crit)'}
                  />
                ),
              },
              { key: 'nps', label: 'NPS', align: 'right' },
              { key: 'tickets', label: 'Open tickets', align: 'right' },
              { key: 'lastTouch', label: 'Last touch', align: 'right', render: (r) => `${r.lastTouch}d` },
              {
                key: 'renewal',
                label: 'Renewal',
                align: 'right',
                render: (r) => {
                  const days = daysUntil(r.renewal);
                  return (
                    <span className={days <= 90 ? 'renewal is-soon' : 'renewal'}>
                      {r.renewal}
                      <em>{days}d</em>
                    </span>
                  );
                },
              },
              { key: 'owner', label: 'Owner' },
            ]}
          />
        )}

        <Callout>
          Sort by <strong>Trend</strong> and the pattern is unmistakable: every account
          losing health has both an open-ticket count above 4 and a last-touch older
          than 19 days. The usage sparkline turns down a full quarter before the health
          score does, which makes it the earliest signal in this table.
        </Callout>
      </Panel>

      <Panel span={12} title="Watch list" subtitle="Health below 60, or renewing within 90 days" tone="alert">
        <div className="watch-grid">
          {accounts
            .filter((a) => a.health < 60 || daysUntil(a.renewal) <= 90)
            .sort((a, b) => a.health - b.health)
            .map((a) => (
              <article className="watch-card" key={a.name}>
                <header>
                  <span className="watch-name">{a.name}</span>
                  <Pill tone={healthTone(a.health)}>{a.health}</Pill>
                </header>
                <div className="watch-arr">{fmtCurrency(a.arr)} ARR</div>
                <ul className="watch-facts">
                  <li><span>Renewal</span><strong>{daysUntil(a.renewal)} days</strong></li>
                  <li><span>Open tickets</span><strong>{a.tickets}</strong></li>
                  <li><span>Last touch</span><strong>{a.lastTouch} days ago</strong></li>
                  <li><span>NPS</span><strong>{a.nps}</strong></li>
                </ul>
                <Sparkline
                  values={a.spark}
                  width={200}
                  height={34}
                  color={a.spark[7] >= a.spark[0] ? 'var(--c-ok)' : 'var(--c-crit)'}
                />
              </article>
            ))}
        </div>
      </Panel>
    </div>
  );
}
