import { useEffect, useState } from 'react';

// Scripted demo video. It plays four scenes in order and does not take input
// from the visitor. Every value is synthetic and typed by hand; nothing is read
// from a real receipt or a real Azure resource.

// Hand-typed sample receipt. `amount` is the line total.
const SAMPLE = {
  merchant: 'Harbor Coffee Co.',
  date: '2026-10-02',
  items: [
    { name: 'Latte, large', qty: 2, amount: 9.5 },
    { name: 'Blueberry muffin', qty: 1, amount: 3.75 },
    { name: 'Sales tax', qty: 1, amount: 1.0 },
  ],
  total: 14.25,
};

const STEPS = [
  { name: 'Upload', note: 'Receipt image lands in Blob Storage' },
  { name: 'Trigger', note: 'Azure Function fires on the new blob' },
  { name: 'Extract', note: 'Document Intelligence receipt model returns fields' },
  { name: 'Review', note: 'Person approves or corrects before saving' },
  { name: 'Store', note: 'Approved rows written to the chosen sink' },
  { name: 'Report', note: 'Power BI reads the sink and refreshes' },
];

const REPORT_ROWS = [
  { label: 'Coffee and drinks', value: 9.5 },
  { label: 'Bakery', value: 3.75 },
  { label: 'Tax', value: 1.0 },
];

const SCENES = [
  { name: 'Receipt', ms: 4000 },
  { name: 'Pipeline steps', ms: 4600 },
  { name: 'Workflow', ms: 4200 },
  { name: 'Report', ms: 4200 },
];

const STEP_MS = 680;
const money = (v) => `$${v.toFixed(2)}`;

// Scene 1: the receipt prints line by line.
function ReceiptScene() {
  return (
    <div className="dv-receipt">
      <div className="dv-receipt-head dv-in">
        <b>{SAMPLE.merchant}</b>
        <span>{SAMPLE.date}</span>
      </div>
      {SAMPLE.items.map((it, i) => (
        <div key={it.name} className="dv-receipt-line dv-in" style={{ animationDelay: `${400 + i * 450}ms` }}>
          <span>{it.qty} x {it.name}</span>
          <span>{money(it.amount)}</span>
        </div>
      ))}
      <div className="dv-receipt-total dv-in" style={{ animationDelay: '1900ms' }}>
        <span>Total</span>
        <span>{money(SAMPLE.total)}</span>
      </div>
    </div>
  );
}

// Scene 2: the rail lights each stop in turn, with its note underneath.
function StepsScene() {
  const [at, setAt] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setAt((x) => Math.min(x + 1, STEPS.length - 1)), STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="dv-steps">
      <div className="rail-track dv-rail" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s.name} className={`rail-cell${i <= at ? ' on' : ''}${i === at ? ' head' : ''}`} />
        ))}
      </div>
      <div className="dv-caption dv-in" key={at}>
        <b>{STEPS[at].name}</b>
        <span>{STEPS[at].note}</span>
      </div>
    </div>
  );
}

// Scene 3: extracted fields are checked, approved, then written to the sink.
function WorkflowScene() {
  return (
    <div className="dv-workflow">
      {SAMPLE.items.map((it, i) => (
        <div key={it.name} className="dv-field dv-in" style={{ animationDelay: `${i * 400}ms` }}>
          <span>{it.name}</span>
          <span>{money(it.amount)}</span>
        </div>
      ))}
      <div className="dv-badge dv-in" style={{ animationDelay: '1900ms' }}>Reviewed and approved</div>
      <div className="dv-sink dv-in" style={{ animationDelay: '2700ms' }}>
        Approved rows written to the sink
      </div>
    </div>
  );
}

// Scene 4: the report, with bars growing from zero.
function FinalScene() {
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setGrown(true), 150);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="dv-final">
      <div className="dv-kpi dv-in">
        <span>Spend on this receipt</span>
        <b>{money(SAMPLE.total)}</b>
      </div>
      <dl className="demo-bars">
        {REPORT_ROWS.map((r, i) => (
          <div key={r.label} className="demo-bar-row dv-in" style={{ animationDelay: `${300 + i * 250}ms` }}>
            <dt>{r.label}</dt>
            <dd>
              <span className="demo-bar" style={{ width: grown ? `${(r.value / 10) * 100}%` : '0%' }} />
            </dd>
            <dd className="num">{money(r.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="dv-caption dv-in" style={{ animationDelay: '1400ms' }}>
        The report refreshes from the sink, so every approved receipt shows up without a manual export.
      </div>
    </div>
  );
}

const SCENE_VIEW = [ReceiptScene, StepsScene, WorkflowScene, FinalScene];

export default function DemoVideo() {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Reduced motion: skip straight to the finished report.
  const [scene, setScene] = useState(reduced ? SCENES.length : 0);
  const finished = scene >= SCENES.length;

  useEffect(() => {
    if (finished) {
      console.log('[azure-demo] video finished');
      return undefined;
    }
    console.log(`[azure-demo] scene ${scene + 1} of ${SCENES.length}: ${SCENES[scene].name}`);
    const t = setTimeout(() => setScene((s) => s + 1), SCENES[scene].ms);
    return () => clearTimeout(t);
  }, [scene, finished]);

  const View = finished ? FinalScene : SCENE_VIEW[scene];
  const shown = finished ? SCENES.length - 1 : scene;

  return (
    <div className="dv">
      <div className="dv-bar" aria-hidden="true">
        <span style={{ width: `${((finished ? SCENES.length : scene) / SCENES.length) * 100}%` }} />
      </div>
      <div className="dv-meta">
        <span>Scene {shown + 1} of {SCENES.length}: {SCENES[shown].name}</span>
        {finished && (
          <button type="button" className="demo-run dv-replay" onClick={() => setScene(0)}>
            Replay
          </button>
        )}
      </div>
      <div className="dv-stage" aria-live="polite">
        <View key={shown} />
      </div>
    </div>
  );
}
