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
          yFormat={(v) => '$' + fmtCompact(v, 0)}
        />
        <Callout>
          Total spend is up <strong>57% year over year</strong>, but the total hides the
          shape of it: <strong>observability grew 176%</strong> while platform and data
          grew 24%. Inference is not what is scaling this bill.
        </Callout>
      </Panel>

      <Panel span={5} title="Composition over time" subtitle="Stacked, trailing 12 months">
        <LineChart
          rows={spendStack.rows}
          keys={spendStack.keys}
          colors={spendStack.colors}
          area
          stacked
          yFormat={(v) => '$' + fmtCompact(v, 0)}
        />
      </Panel>

      <Panel span={7} title="Top cost drivers" subtitle="Last 30 days, by resource">
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
          <strong>law-clinical-prod is the single largest line item</strong> at $5,244,
          more than Azure OpenAI and Cosmos DB combined, at 96% of budget and up 34%
          month over month. It is a Log Analytics workspace billed per GB ingested, and
          the pipeline is logging full prompts and responses at DEBUG level: 76 GB a day
          at $2.30/GB. Sampling non-error traces would cut roughly 60% of it without
          losing incident forensics.
        </Callout>
      </Panel>

      <Panel span={5} title="Quota utilisation" subtitle="Against provisioned limits">
        <ul className="quota-list">
          {quotas.map((q) => <QuotaBar key={q.name} q={q} />)}
        </ul>
        <Callout>
          The log workspace is at <strong>89% of its 85 GB daily cap</strong>. Hitting it
          drops telemetry silently, at exactly the moment you need it. The gpt-4o PTU
          reservation sits at 83%. That is the capacity that throttled during INC-2291, so
          the retry storm was a symptom, not the cause.
        </Callout>
      </Panel>

      <Panel span={12} title="Model usage and unit cost" subtitle="Last 30 days">
        <DataTable
          defaultSort="cost"
          rows={modelUsage}
          columns={[
            { key: 'model', label: 'Model', render: (r) => <span className="mono">{r.model}</span> },
            {
              key: 'billing',
              label: 'Billing',
              render: (r) => (
                <Pill tone={r.billing.startsWith('PTU') ? 'warn' : 'neutral'}>{r.billing}</Pill>
              ),
            },
            { key: 'calls', label: 'Calls', align: 'right', render: (r) => fmtCompact(r.calls, 1) },
            { key: 'tokens', label: 'Tokens', align: 'right', render: (r) => r.tokens.toFixed(1) + 'M' },
            { key: 'cost', label: 'Cost', align: 'right', render: (r) => fmtCurrency(r.cost) },
            {
              key: 'rate',
              label: '$ / M tokens',
              align: 'right',
              // Derived in the data module so the table and the callout can never
              // quote different rates.
              render: (r) => <span className="mono">${r.ratePerM.toFixed(2)}</span>,
            },
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
          Compare the rate column, not the cost column. gpt-4o on provisioned throughput
          works out to <strong>$9.08 per million tokens</strong> against{' '}
          <strong>$4.28 on standard</strong>. PTU is bought for latency guarantees and
          data residency, not for price, and at 83% utilisation it is not paying for
          itself yet. Meanwhile gpt-4o-mini serves 52% of all calls for $114, about 4% of
          the model bill. The entire inference line is{' '}
          <strong>12% of platform spend</strong>.
        </Callout>
      </Panel>
    </div>
  );
}
