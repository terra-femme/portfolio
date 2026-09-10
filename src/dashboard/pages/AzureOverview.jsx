import Panel, { Callout, Pill } from '../components/Panel';
import KpiTile from '../components/KpiTile';
import LineChart from '../charts/LineChart';
import Donut from '../charts/Donut';
import HBar from '../charts/HBar';
import Gauge from '../charts/Gauge';
import RegionMap from '../charts/RegionMap';
import { fmtCurrency, fmtCompact } from '../charts/primitives';
import {
  azureKpis, dailySpend, serviceMix, regions, trafficFlows, sloGauges, incidents,
  SPEND_30D, REQUESTS_30D_M,
} from '../data/azure';

export default function AzureOverview() {
  const primary = regions.reduce((a, b) => (a.value > b.value ? a : b));
  const observability = serviceMix[0];

  // Derived, not typed. The daily series is rescaled to match the headline
  // spend, so any hard-coded peak figure in the prose below would silently go
  // stale the moment a usage assumption changed.
  const peak = dailySpend.reduce((a, b) => (a.value > b.value ? a : b));
  const peakIndex = dailySpend.indexOf(peak);
  const excess = peak.value - dailySpend[peakIndex - 2].value;

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
          hint={fmtCurrency(SPEND_30D)}
        >
          <LineChart
            rows={dailySpend}
            keys={['Spend']}
            colors={['var(--c-1)']}
            area
            yFormat={(v) => '$' + fmtCompact(v, 0)}
          />
          <Callout>
            The <strong>{fmtCurrency(peak.value)} peak on {peak.label}</strong> is
            INC-2291. PTU capacity throttling drove a client retry storm, and retries
            bill the same as first attempts. About <strong>{fmtCurrency(excess)}</strong>{' '}
            of that day was waste.
          </Callout>
        </Panel>

        <Panel span={4} title="Spend by service" subtitle="Last 30 days">
          <Donut
            slices={serviceMix}
            centerLabel="Total spend"
            valueFormat={(v) => fmtCurrency(v)}
            size={172}
          />
          <Callout>
            <strong>Observability is the largest line item</strong> at{' '}
            {Math.round((observability.value / SPEND_30D) * 100)}%, ahead of every AI
            service. Model inference is 12%.
          </Callout>
        </Panel>

        {/* The map is a supporting panel, not the hero: it answers "where", which
            is one question among several on this page. The KPI strip above it
            carries the numbers a reader wants without hovering anything, and the
            bars below give the exact ranking a bubble chart cannot. */}
        <Panel span={4} title="Global footprint" subtitle="Traffic by Azure region">
          <ul className="mini-kpis">
            <li><span>Regions</span><strong>{regions.length}</strong></li>
            <li><span>Requests 30d</span><strong>{REQUESTS_30D_M.toFixed(1)}<em>M</em></strong></li>
            <li><span>In {primary.label}</span><strong>{primary.value}<em>%</em></strong></li>
          </ul>

          <RegionMap regions={regions} flows={trafficFlows} maxHeight={124} legend={false} />

          <HBar
            rows={regions.map((r) => ({ label: r.label, value: r.value, color: 'var(--c-2)' }))}
            valueFormat={(v) => v + '%'}
          />

          <Callout>
            Four of five flows originate in <strong>East US</strong>. That is the
            single-region concentration behind INC-2291. The other regions had nowhere to
            fail over to.
          </Callout>
        </Panel>

        <Panel span={8} title="Service level objectives" subtitle="Rolling 30-day window">
          <div className="gauge-row">
            {/* Sized up so three gauges genuinely fill the row height this panel
                inherits from its taller neighbour, rather than floating in it. */}
            {sloGauges.map((g) => <Gauge key={g.label} {...g} size={150} />)}
          </div>
          <Callout>
            All three SLOs are being met, but the error budget is down to
            <strong> 68%</strong> with three weeks left in the window, almost all of it spent
            in one incident.
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
