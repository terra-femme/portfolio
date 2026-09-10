import Panel, { Callout, Pill } from '../components/Panel';
import Heatmap from '../charts/Heatmap';
import HBar from '../charts/HBar';
import Gauge from '../charts/Gauge';
import DataTable from '../components/DataTable';
import { engagementHeatmap, csatBySegment, playbooks, accounts } from '../data/clients';
import { daysUntil } from '../charts/primitives';

export default function ClientEngagement() {
  // Coverage: how many top accounts have gone cold. Derived here rather than
  // hard-coded so it stays true if the account data is edited.
  const cold = accounts.filter((a) => a.lastTouch > 20).length;
  const coverage = ((accounts.length - cold) / accounts.length) * 100;

  return (
    <div className="panel-grid">
      <Panel span={12} title="Engagement coverage" subtitle="Touchpoints per week, last 12 weeks">
        <Heatmap
          rows={engagementHeatmap.rows}
          rowLabels={engagementHeatmap.days}
          colLabels={engagementHeatmap.cols}
          valueLabel="touchpoints"
        />
        <Callout>
          Read the <strong>Exec sync</strong> row left to right: 4, 3, 5, 2 … then 1, 0, 1.
          Support calls climbed over the same twelve weeks. We replaced proactive
          relationship time with reactive firefighting, and the health scores followed
          about a quarter later.
        </Callout>
      </Panel>

      <Panel span={4} title="Account coverage" subtitle="Touched within 20 days">
        <div className="gauge-row is-single">
          <Gauge
            label="Coverage"
            value={Number(coverage.toFixed(1))}
            target={85}
            floor={50}
            max={100}
            unit="%"
            size={150}
          />
        </div>
        <Callout>
          {cold} of {accounts.length} named accounts have had no contact in over
          20 days.
        </Callout>
      </Panel>

      <Panel span={4} title="CSAT by segment" subtitle="Rolling 90-day average, out of 5">
        <HBar
          rows={csatBySegment.map((c) => ({
            label: c.label,
            value: c.value,
            color: c.value >= 4.5 ? 'var(--c-ok)' : c.value >= 4.2 ? 'var(--c-1)' : 'var(--c-warn)',
          }))}
          valueFormat={(v) => v.toFixed(1)}
        />
        <Callout>
          SMB scores lowest but costs least to serve — the gap is self-service
          documentation, not headcount.
        </Callout>
      </Panel>

      <Panel span={4} title="Response time" subtitle="First reply to a support request">
        <ul className="stat-list">
          <li><span>Median</span><strong>1h 12m</strong></li>
          <li><span>p90</span><strong>6h 48m</strong></li>
          <li><span>Breached SLA</span><strong className="is-bad">14</strong></li>
          <li><span>Reopened</span><strong className="is-bad">9</strong></li>
        </ul>
        <Callout>
          The median is healthy; the p90 is not. A small tail of tickets is waiting
          most of a working day for a first reply.
        </Callout>
      </Panel>

      <Panel span={12} title="Active playbooks" subtitle="Interventions in flight">
        <DataTable
          defaultSort="account"
          rows={playbooks}
          columns={[
            { key: 'account', label: 'Account', render: (r) => <span className="strong">{r.account}</span> },
            { key: 'play', label: 'Playbook' },
            { key: 'owner', label: 'Owner' },
            { key: 'due', label: 'Due' },
            {
              key: 'status',
              label: 'Status',
              render: (r) => (
                <Pill tone={r.status === 'Overdue' ? 'crit' : r.status === 'In progress' ? 'ok' : 'neutral'}>
                  {r.status}
                </Pill>
              ),
            },
          ]}
        />
        <Callout>
          One playbook is overdue, and it is a <strong>renewal outreach dated Sep 15</strong> on
          an account that renews in {daysUntil('2026-10-09')} days. That is the sequencing
          error worth fixing today.
        </Callout>
      </Panel>
    </div>
  );
}
