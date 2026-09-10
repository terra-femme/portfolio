import Panel, { Callout, Pill } from '../components/Panel';
import KpiTile from '../components/KpiTile';
import LineChart from '../charts/LineChart';
import Donut from '../charts/Donut';
import HBar from '../charts/HBar';
import Gauge from '../charts/Gauge';
import { fmtCurrency, fmtCompact } from '../charts/primitives';
import {
  azureKpis, dailySpend, serviceMix, regions, sloGauges, incidents,
} from '../data/azure';

export default function AzureOverview() {
  return (
    <>
      <div className="kpi-row">
        {azureKpis.map((m, i) => <KpiTile key={m.id} metric={m} index={i} />)}
      </div>

      <div className="panel-grid">
        <Panel
          span={8}
          title="Daily spend"
          subtitle="Last 30 days, all subscriptions"
          hint="USD"
        >
          <LineChart
            rows={dailySpend}
            keys={['Spend']}
            colors={['var(--c-1)']}
            area
            height={280}
            yFormat={(v) => '$' + fmtCompact(v, 0)}
          />
          <Callout>
            The <strong>$1,180 peak on Aug 31</strong> is INC-2291 — capacity throttling on
            Azure OpenAI drove a client retry storm, and retries bill the same as
            first attempts. Roughly <strong>$680</strong> of that day was waste.
          </Callout>
        </Panel>

        <Panel span={4} title="Spend by service" subtitle="Month to date" hint="$22,640">
          <Donut
            slices={serviceMix}
            centerLabel="Total MTD"
            valueFormat={(v) => fmtCurrency(v)}
            size={190}
          />
        </Panel>

        <Panel span={4} title="Traffic by region" subtitle="Share of total requests">
          <HBar
            rows={regions.map((r) => ({ ...r, color: 'var(--c-2)' }))}
            valueFormat={(v) => v + '%'}
          />
          <Callout>
            East US carries <strong>42%</strong> of traffic on a single paired region.
            Worth a failover review before the next capacity event.
          </Callout>
        </Panel>

        <Panel span={8} title="Service level objectives" subtitle="Rolling 30-day window">
          <div className="gauge-row">
            {sloGauges.map((g) => <Gauge key={g.label} {...g} />)}
          </div>
          <Callout>
            All three SLOs are being met, but the error budget is down to
            <strong> 68%</strong> with three weeks left in the window — almost all of it
            spent in one incident.
          </Callout>
        </Panel>

        <Panel span={12} title="Recent incidents" subtitle="Last 45 days">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th><th>Date</th><th>Severity</th><th>Service</th>
                  <th>Summary</th><th>Duration</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td className="mono">{inc.id}</td>
                    <td>{inc.date}</td>
                    <td>
                      <Pill tone={inc.severity === 'Sev 2' ? 'crit' : inc.severity === 'Sev 3' ? 'warn' : 'neutral'}>
                        {inc.severity}
                      </Pill>
                    </td>
                    <td>{inc.service}</td>
                    <td className="cell-wide">{inc.summary}</td>
                    <td className="mono">{inc.duration}</td>
                    <td>
                      <Pill tone={inc.status === 'Resolved' ? 'ok' : 'warn'}>{inc.status}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
