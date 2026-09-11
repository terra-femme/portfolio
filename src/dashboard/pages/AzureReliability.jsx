import Panel, { Callout, Pill } from '../components/Panel';
import LineChart from '../charts/LineChart';
import HBar from '../charts/HBar';
import Heatmap from '../charts/Heatmap';
import { fmtCompact, fmtNumber } from '../charts/primitives';
import {
  latencyDaily, errorTaxonomy, errorRateHeatmap, incidents,
  ERRORS_30D, ERR_PER_10K, WORST_HOUR_PER_10K, REQUESTS_30D_M,
} from '../data/azure';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export default function AzureReliability() {
  // Derived so the prose and the bars can never quote different shares.
  const topShare = Math.round((errorTaxonomy[0].value / ERRORS_30D) * 100);
  const errorRatePct = (ERRORS_30D / (REQUESTS_30D_M * 1e6)) * 100;

  return (
    <div className="panel-grid">
      <Panel
        span={12}
        title="Latency percentiles"
        subtitle="Inference endpoints, last 30 days"
        hint="milliseconds"
      >
        <LineChart
          rows={latencyDaily.rows}
          keys={latencyDaily.keys}
          colors={latencyDaily.colors}
          yFormat={(v) => fmtNumber(v) + 'ms'}
        />
        <Callout>
          p50 barely moved during the incident (248ms &rarr; 598ms) while p99 went
          <strong> 2.9x</strong>. That gap is the signature of a queue backing up, not a
          model getting slower. The median request was still being served fine.
        </Callout>
      </Panel>

      {/* A "Failure share" donut used to sit on this page showing errorTaxonomy a
          second time. Two panels of identical data is not two insights, and the
          donut left half its panel empty -- so the bars (which carry exact counts
          AND proportions) kept the slot, and the KPI strip fills the space with
          figures the bars cannot show. */}
      <Panel span={5} title="Error taxonomy" subtitle="Last 30 days, by response code">
        <ul className="mini-kpis">
          <li><span>Total errors</span><strong>{fmtCompact(ERRORS_30D, 1)}</strong></li>
          <li><span>Error rate</span><strong>{errorRatePct.toFixed(3)}<em>%</em></strong></li>
          <li><span>Worst hour</span><strong>{WORST_HOUR_PER_10K}<em>/10k</em></strong></li>
        </ul>

        <HBar rows={errorTaxonomy} valueFormat={(v) => fmtNumber(v)} showPercent />

        <Callout>
          <strong>429s are {topShare}% of all errors.</strong> These are self-inflicted:
          capacity, not correctness. At {ERR_PER_10K.toFixed(1)} per 10k requests overall
          the platform is comfortably inside its SLO; the problem is that the failures
          are concentrated rather than spread.
        </Callout>
      </Panel>

      <Panel span={7} title="Error rate by hour" subtitle="Errors per 10k requests, last 7 days">
        <Heatmap
          rows={errorRateHeatmap.rows}
          rowLabels={errorRateHeatmap.days}
          colLabels={HOURS}
          valueLabel="per 10k"
          ramp="var(--c-crit)"
        />
        <Callout>
          Monday 09:00 to 11:00 UTC is the hot band: the incident, but also the standing
          weekly peak at {WORST_HOUR_PER_10K} per 10k. Scheduled batch jobs and
          interactive traffic are colliding.
        </Callout>
      </Panel>

      <Panel span={12} title="Incident log" subtitle="Severity, duration, and status">
        <div className="incident-list">
          {incidents.map((inc) => (
            <article className="incident" key={inc.id}>
              <div className="incident-top">
                <span className="mono incident-id">{inc.id}</span>
                <Pill tone={inc.severity === 'Sev 2' ? 'crit' : inc.severity === 'Sev 3' ? 'warn' : 'neutral'}>
                  {inc.severity}
                </Pill>
                <Pill tone={inc.status === 'Resolved' ? 'ok' : 'warn'}>{inc.status}</Pill>
                <span className="incident-date">{inc.date}</span>
              </div>
              <p className="incident-summary">{inc.summary}</p>
              <div className="incident-meta">
                <span>{inc.service}</span>
                <span className="mono">{inc.duration}</span>
              </div>
            </article>
          ))}
        </div>
      </Panel>
    </div>
  );
}
