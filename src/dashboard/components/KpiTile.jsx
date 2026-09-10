import { useCountUp } from './hooks';
import { fmtNumber } from '../charts/primitives';

/**
 * Headline metric tile.
 *
 * `goodWhen` exists because a rising number is not automatically good news.
 * Spend up 5.9% and tokens up 5.4% are the same arrow pointing the same way,
 * and colouring both green would actively mislead. Each metric declares which
 * direction is healthy and the tile colours the delta accordingly.
 */
export default function KpiTile({ metric, index = 0 }) {
  const { label, value, prefix = '', suffix = '', decimals = 0, delta, deltaLabel, goodWhen = 'up' } = metric;

  // Stagger the counters slightly so a row of four tiles cascades instead of
  // all landing on the same frame.
  const animated = useCountUp(value, { duration: 950, delay: index * 90 });

  const rising = delta >= 0;
  const healthy = goodWhen === 'up' ? rising : !rising;

  return (
    <article className="kpi">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {prefix}
        {fmtNumber(animated, decimals)}
        {suffix && <em className="kpi-suffix">{suffix}</em>}
      </span>
      {delta !== undefined && (
        <span className={healthy ? 'kpi-delta is-good' : 'kpi-delta is-bad'}>
          <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
            {/* one triangle, flipped by CSS transform, so the two arrows are
                guaranteed to be the same shape */}
            <path d="M6 2 L11 9 L1 9 Z" fill="currentColor" transform={rising ? undefined : 'rotate(180 6 6)'} />
          </svg>
          {/* a 0.04pp beat against an SLO is meaningful; "0.0%" is not */}
          {Math.abs(delta).toFixed(Math.abs(delta) < 0.1 ? 2 : 1)}%
          <span className="kpi-delta-label">{deltaLabel}</span>
        </span>
      )}
    </article>
  );
}
