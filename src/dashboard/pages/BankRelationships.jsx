import { useState } from 'react';
import Lollipop from '../charts/Lollipop';
import { LINES, byClient, ragOf, healthOf, RAG_LABEL } from '../data/banking';

/**
 * The client scorecard: a RAG matrix of clients against lines of business.
 *
 * A crosstab with colour is the densest honest way to show this. Sixteen names
 * by five lines is eighty numbers, and no set of eighty bars is readable, but
 * the eye finds a row of red instantly. The number stays in the cell so the
 * colour never has to carry the value on its own.
 */
export default function BankRelationships({ facts, setSlicer }) {
  const clients = byClient(facts);
  const [open, setOpen] = useState(null);
  const detail = clients.find((c) => c.name === open);

  return (
    <div className="bank-grid">
      <section className="bank-card bank-span-12">
        <header className="bank-card-head">
          <div>
            <h2>Client scorecard</h2>
            <p>{clients.length} named relationships by line of business, coloured by health</p>
          </div>
          <span className="bank-legend-inline">
            {['ok', 'warn', 'crit'].map((r) => (
              <span key={r}><span className={`rag-dot is-${r}`} />{RAG_LABEL[r]}</span>
            ))}
          </span>
        </header>

        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="matrix-name">Client</th>
                <th>Region</th>
                <th>Tier</th>
                {LINES.map((l) => (
                  <th key={l.id} className="matrix-line">
                    <button type="button" onClick={() => setSlicer('line')(l.id)} title={l.full}>
                      {l.label}
                    </button>
                  </th>
                ))}
                <th className="is-right">Revenue</th>
                <th className="is-right">Health</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.name}
                  className={open === c.name ? 'is-open' : undefined}
                  onClick={() => setOpen(open === c.name ? null : c.name)}
                >
                  <td className="matrix-name"><strong>{c.name}</strong></td>
                  <td>{c.region}</td>
                  <td>{c.tier}</td>
                  {c.cells.map((cell, i) => {
                    if (!cell) return <td key={i} className="matrix-cell is-empty">–</td>;
                    // Per cell, breadth is 1: this is one line, on its own.
                    const cellHealth = healthOf(cell.wallet, cell.trend, 1);
                    return (
                      <td
                        key={i}
                        className={`matrix-cell is-${ragOf(cellHealth)}`}
                        title={`${c.name} · ${LINES[i].label}: ${cell.wallet}% wallet, ${cell.trend > 0 ? '+' : ''}${cell.trend}pp, $${cell.revenue}m`}
                      >
                        <span className="matrix-num">{cell.wallet}</span>
                        <span className="matrix-trend">{cell.trend > 0 ? '+' : ''}{cell.trend}</span>
                      </td>
                    );
                  })}
                  <td className="is-right mono">${c.revenue.toFixed(1)}m</td>
                  <td className="is-right">
                    <span className={`rag-badge is-${c.rag}`}>{c.health}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="bank-note">
          <strong>Read:</strong> cells are wallet share with year on year movement beneath.
          <strong> Blackwater Industrials</strong> is the fifth largest name in the book and
          every one of its five cells is red, which a revenue ranking would never surface.
          Click any row to drill through.
        </p>
      </section>

      {detail && (
        <section className="bank-card bank-span-12 bank-drill">
          <header className="bank-card-head">
            <div>
              <h2>{detail.name}</h2>
              <p>
                {detail.region} · {detail.tier} · covered since {detail.since} ·{' '}
                ${detail.revenue.toFixed(1)}m · {detail.breadth} of {LINES.length} lines above
                15% wallet
              </p>
            </div>
            <button type="button" className="bank-clear" onClick={() => setOpen(null)}>Close</button>
          </header>

          <Lollipop
            rows={detail.cells.map((cell, i) => ({
              id: LINES[i].id,
              label: LINES[i].label,
              value: cell ? cell.wallet : 0,
              color: LINES[i].color,
              target: 15,
              detail: cell ? `$${cell.revenue}m · ${cell.trend > 0 ? '+' : ''}${cell.trend}pp year on year` : 'No activity',
            }))}
            max={50}
            valueFormat={(v) => `${v}%`}
          />

          <p className="bank-note">
            <strong>Read:</strong> the tick at 15% is the threshold a line has to clear to
            count as a real product relationship rather than a token trade.
          </p>
        </section>
      )}
    </div>
  );
}
