import { useSort } from './hooks';

/**
 * Sortable table.
 *
 * Columns declare `key` (for sorting), `label`, optional `align`, and an
 * optional `render(row)` for cells that are more than text. Sorting always runs
 * against the raw `row[key]` value, never the rendered output -- sorting a
 * currency column by its formatted string puts "$9,800" above "$12,400"
 * because "9" sorts after "1".
 */
export default function DataTable({ columns, rows, defaultSort, caption, maxHeight }) {
  const { sort, toggle, apply } = useSort(defaultSort ?? columns[0].key);
  const sorted = apply(rows);

  return (
    <div className="table-wrap" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      <table className="data-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sort.key === col.key;
              return (
                <th
                  key={col.key}
                  className={col.align === 'right' ? 'is-right' : undefined}
                  aria-sort={active ? (sort.dir === 'desc' ? 'descending' : 'ascending') : 'none'}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <button
                    type="button"
                    className={active ? 'th-btn is-active' : 'th-btn'}
                    onClick={() => toggle(col.key)}
                  >
                    {col.label}
                    <span className={active ? `sort-caret is-${sort.dir}` : 'sort-caret'} aria-hidden="true" />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id ?? row.name ?? row.resource ?? row.model ?? i}>
              {columns.map((col) => (
                <td key={col.key} className={col.align === 'right' ? 'is-right' : undefined}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
