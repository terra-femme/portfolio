import Panel, { Callout } from '../components/Panel';
import KpiTile from '../components/KpiTile';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import Donut from '../charts/Donut';
import HBar from '../charts/HBar';
import { fmtCompact } from '../charts/primitives';
import {
  clientKpis, segmentMix, healthDistribution, npsTrend, renewalPipeline, churnDrivers,
} from '../data/clients';

export default function ClientOverview() {
  return (
    <>
      <div className="kpi-row">
        {clientKpis.map((m, i) => <KpiTile key={m.id} metric={m} index={i} />)}
      </div>

      <div className="panel-grid">
        <Panel span={5} title="ARR by segment" subtitle="Annual recurring revenue" hint="$4.82M">
          <Donut
            slices={segmentMix}
            centerLabel="Total ARR"
            valueFormat={(v) => '$' + fmtCompact(v, 2)}
            size={190}
          />
        </Panel>

        <Panel span={7} title="Health score distribution" subtitle="All 68 accounts">
          <HBar rows={healthDistribution} valueFormat={(v) => v + ' accounts'} showPercent />
          <Callout>
            Ten accounts sit below 60. That is <strong>15% of the book</strong> and it is
            where the entire $412k of at-risk ARR lives.
          </Callout>
        </Panel>

        <Panel span={7} title="Net promoter score" subtitle="Trailing 12 months">
          <LineChart
            rows={npsTrend}
            keys={['NPS']}
            colors={['var(--c-2)']}
            area
            height={250}
            baselineZero={false}
            yFormat={(v) => String(Math.round(v))}
          />
          <Callout>
            The <strong>13-point slide from June to August</strong> is not broad —
            it is two enterprise accounts responding to the same support backlog.
            September&rsquo;s partial recovery followed the first exec recovery call.
          </Callout>
        </Panel>

        <Panel span={5} title="Churn risk drivers" subtitle="Share of at-risk accounts">
          <HBar rows={churnDrivers} valueFormat={(v) => v + '%'} />
          <Callout>
            The top two drivers are both <strong>things we control</strong>, not market
            conditions.
          </Callout>
        </Panel>

        <Panel span={12} title="Renewal pipeline" subtitle="Next four quarters, by commitment stage">
          <BarChart
            rows={renewalPipeline.rows}
            keys={renewalPipeline.keys}
            colors={renewalPipeline.colors}
            stacked
            height={280}
            yFormat={(v) => '$' + fmtCompact(v, 0)}
          />
          <Callout>
            <strong>Q4 26 carries every dollar of concentrated risk</strong> — $412k, and
            $412k of it is one account. Q1 27 onward is comparatively clean, so the next
            90 days decide the year.
          </Callout>
        </Panel>
      </div>
    </>
  );
}
