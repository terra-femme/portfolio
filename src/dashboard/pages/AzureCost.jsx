import Panel, { Callout, Pill } from '../components/Panel';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import DataTable from '../components/DataTable';
import { fmtCompact, fmtCurrency, fmtNumber, fmtSigned } from '../charts/primitives';
import { monthlySpend, spendStack, topCostDrivers, modelUsage, quotas } from '../data/azure';

/** Quota utilisation bar. Turns amber at 75% and red at 90% of the limit. */
function QuotaBar({ q }) {
  const pct = q.used / q.limit;
  const tone = pct >= 0.9 ? 'crit' : pct >= 0.75 ? 'warn' : 'ok';
  return (
    <li className="quota-row">
      <div className="quota-head">
        <span className="quota-name">{q.name}</span>
        <span className={`quota-pct is-${tone}`}>{(pct * 100).toFixed(0)}%</span>
      </div>
      <span className="quota-track">
        <span className={`quota-fill is-${tone}`} style={{ width: `${pct * 100}%` }} />
      </span>
      <div className="quota-foot">
        {fmtNumber(q.used, q.used % 1 ? 1 : 0)} / {fmtNumber(q.limit)} {q.unit}
      </div>
    </li>
  );
}

export default function AzureCost() {
  return (
    <div className="panel-grid">
      <Panel span={7} title="Spend by month" subtitle="Trailing 12 months" hint="USD">
        <BarChart
          rows={monthlySpend}
          keys={['Spend']}
          colors={['var(--c-1)']}
          height={260}
          yFormat={(v) => '$' + fmtCompact(v, 0)}
        />
        <Callout>
          Spend is up <strong>59% year over year</strong> while token volume is up 63% —
          unit economics are improving slightly, mostly from the gpt-4o-mini shift.
        </Callout>
      </Panel>

      <Panel span={5} title="Composition over time" subtitle="Stacked, trailing 12 months">
        <LineChart
          rows={spendStack.rows}
          keys={spendStack.keys}
          colors={spendStack.colors}
          area
          stacked
          height={260}
          yFormat={(v) => '$' + fmtCompact(v, 0)}
        />
      </Panel>

      <Panel span={7} title="Top cost drivers" subtitle="Month to date, by resource">
        <DataTable
          defaultSort="cost"
          rows={topCostDrivers}
          columns={[
            { key: 'resource', label: 'Resource', render: (r) => <span className="mono">{r.resource}</span> },
            { key: 'service', label: 'Service' },
            { key: 'region', label: 'Region' },
            { key: 'cost', label: 'Cost', align: 'right', render: (r) => fmtCurrency(r.cost) },
            {
              key: 'change',
              label: 'Change',
              align: 'right',
              render: (r) => (
                // Inverted on purpose: spend going UP is bad news.
                <span className={r.change >= 0 ? 'delta is-bad' : 'delta is-good'}>
                  {fmtSigned(r.change)}
                </span>
              ),
            },
            {
              key: 'budget',
              label: 'Budget used',
              align: 'right',
              render: (r) => (
                <span className="inline-meter" title={`${(r.budget * 100).toFixed(0)}% of budget`}>
                  <span
                    className={r.budget >= 0.85 ? 'inline-meter-fill is-crit' : r.budget >= 0.7 ? 'inline-meter-fill is-warn' : 'inline-meter-fill'}
                    style={{ width: `${r.budget * 100}%` }}
                  />
                  <em>{(r.budget * 100).toFixed(0)}%</em>
                </span>
              ),
            },
          ]}
        />
        <Callout>
          <strong>speech-realtime-gw</strong> is at 94% of budget and up 21.8% month over
          month. It will breach before the period closes unless the cap is raised.
        </Callout>
      </Panel>

      <Panel span={5} title="Quota utilisation" subtitle="Against provisioned limits">
        <ul className="quota-list">
          {quotas.map((q) => <QuotaBar key={q.name} q={q} />)}
        </ul>
        <Callout>
          gpt-4o East US is at <strong>79% of TPM</strong>. This is the quota that
          throttled during INC-2291 — the retry storm was a symptom, not the cause.
        </Callout>
      </Panel>

      <Panel span={12} title="Model usage and unit cost" subtitle="Month to date">
        <DataTable
          defaultSort="cost"
          rows={modelUsage}
          columns={[
            { key: 'model', label: 'Model', render: (r) => <span className="mono">{r.model}</span> },
            { key: 'calls', label: 'Calls', align: 'right', render: (r) => fmtCompact(r.calls, 1) },
            { key: 'tokens', label: 'Tokens', align: 'right', render: (r) => r.tokens.toFixed(1) + 'M' },
            { key: 'cost', label: 'Cost', align: 'right', render: (r) => fmtCurrency(r.cost) },
            {
              key: 'p95',
              label: 'p95 latency',
              align: 'right',
              render: (r) => (
                <>
                  {fmtNumber(r.p95)}ms{' '}
                  {r.p95 > 1000 && <Pill tone="warn">slow</Pill>}
                </>
              ),
            },
            {
              key: 'share',
              label: 'Share of calls',
              align: 'right',
              render: (r) => (
                <span className="inline-meter">
                  <span className="inline-meter-fill" style={{ width: `${r.share * 100}%` }} />
                  <em>{(r.share * 100).toFixed(0)}%</em>
                </span>
              ),
            },
          ]}
        />
        <Callout>
          gpt-4o-mini handles <strong>45% of calls for 27% of the cost</strong> of gpt-4o.
          The routing work is paying for itself; the remaining gpt-4o traffic is worth
          auditing for prompts that could be downgraded.
        </Callout>
      </Panel>
    </div>
  );
}
