import Panel, { Callout, Pill } from '../components/Panel';
import LineChart from '../charts/LineChart';
import HBar from '../charts/HBar';
import Heatmap from '../charts/Heatmap';
import Donut from '../charts/Donut';
import { fmtNumber } from '../charts/primitives';
import { latencyDaily, errorTaxonomy, errorRateHeatmap, incidents } from '../data/azure';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

export default function AzureReliability() {
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
          height={300}
          yFormat={(v) => fmtNumber(v) + 'ms'}
        />
        <Callout>
          p50 barely moved during the incident (248ms &rarr; 598ms) while p99 went
          <strong> 2.9x</strong>. That gap is the signature of a queue backing up, not a
          model getting slower — the median request was still being served fine.
        </Callout>
      </Panel>

      <Panel span={5} title="Error taxonomy" subtitle="Last 30 days, by response code">
        <HBar rows={errorTaxonomy} valueFormat={(v) => fmtNumber(v)} showPercent />
        <Callout>
          <strong>429s are 56% of all errors.</strong> These are self-inflicted —
          capacity, not correctness.
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
          Monday 09:00–11:00 UTC is the hot band — the incident, but also the standing
          weekly peak. Scheduled batch jobs and interactive traffic are colliding.
        </Callout>
      </Panel>

      <Panel span={5} title="Failure share" subtitle="Proportion of total errors">
        <Donut
          slices={errorTaxonomy}
          centerLabel="Total errors"
          valueFormat={(v) => fmtNumber(v)}
          size={190}
        />
      </Panel>

      <Panel span={7} title="Incident log" subtitle="Severity, duration, and status">
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
