import { useState } from 'react'
import { useApiData } from '../hooks/useApiData'
import Change from './Change'
import { formatCurrency } from '../utils/format'
import PanelError from './PanelError'
import './OtrosClientes.css'

/**
 * Customers that are not schools: publishers, distributors, export accounts,
 * individuals.
 *
 * The ERP leaves Colegio empty for these, so every school-based panel drops
 * them. That made 4.5% of revenue invisible and left the summary card
 * disagreeing with the retention breakdown below it with no explanation. They
 * are shown by billing customer and business unit, which is how the team
 * recognises them.
 */
function OtrosClientes({ apiUrl, year, baseYear, product, congregacion }) {
  const [limit, setLimit] = useState(10)

  const { data, loading, error, retry } = useApiData(
    `${apiUrl}/api/otros-clientes`,
    { year, compare_year: baseYear, product, congregacion, limit: 100 }
  )

  const header = (
    <div className="section-header">
      <h2 className="section-title">Otros clientes (no colegios)</h2>
      {data && (
        <select
          className="limit-select"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
        >
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      )}
    </div>
  )

  if (error) {
    return <div className="otros-clientes">{header}<PanelError onRetry={retry} /></div>
  }

  if (loading) {
    return <div className="otros-clientes">{header}<div className="loading-spinner">Cargando...</div></div>
  }

  const rows = (data?.data ?? []).filter((r) => Math.round(r.total) !== 0)

  if (rows.length === 0) {
    return (
      <div className="otros-clientes">
        {header}
        <div className="no-data">No hay ventas fuera de colegios en este periodo.</div>
      </div>
    )
  }

  return (
    <div className="otros-clientes">
      {header}

      <p className="otros-intro">
        Ventas que no van a un colegio, por eso no aparecen en los rankings ni
        en el desglose de retención. Suman <strong>{formatCurrency(data.total)}</strong>
        {' '}en {year} entre {data.total_clientes} clientes.
      </p>

      {Object.keys(data.por_unidad ?? {}).length > 0 && (
        <div className="unidad-chips">
          {Object.entries(data.por_unidad).slice(0, 5).map(([unidad, valor]) => (
            <span key={unidad} className="unidad-chip">
              {unidad} <strong>{formatCurrency(valor)}</strong>
            </span>
          ))}
        </div>
      )}

      <div className="otros-list">
        {rows.slice(0, limit).map((row, index) => (
          <div key={row.cliente} className="otro-item">
            <div className="rank">{index + 1}</div>
            <div className="otro-info">
              <div className="otro-name">{row.cliente}</div>
              {row.unidad && <div className="otro-unidad">{row.unidad}</div>}
            </div>
            <div className="otro-revenue">
              {formatCurrency(row.total)}
              <Change current={row.total} base={row.base_total} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OtrosClientes
