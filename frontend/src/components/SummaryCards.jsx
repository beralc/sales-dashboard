import './SummaryCards.css'

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat('es-ES').format(value)
}

/**
 * Year-over-year change between two values.
 *
 * Returns null when there is nothing meaningful to show, so the card renders
 * without a delta rather than printing "Infinity%" or a misleading 0%.
 */
function getDelta(current, base) {
  if (base === null || base === undefined || current === null || current === undefined) {
    return null
  }

  const diff = current - base

  // No base to grow from: a percentage would be meaningless (division by zero).
  if (base === 0) {
    return diff === 0 ? null : { diff, pct: null, direction: 'up' }
  }

  const pct = (diff / Math.abs(base)) * 100
  let direction = 'flat'
  if (diff > 0) direction = 'up'
  else if (diff < 0) direction = 'down'

  return { diff, pct, direction }
}

function DeltaBadge({ delta, baseYear, format }) {
  if (!delta) return null

  const { pct, direction } = delta
  const arrow = direction === 'up' ? '▲' : direction === 'down' ? '▼' : '■'

  const label = pct === null
    ? 'nuevo'
    : `${pct > 0 ? '+' : ''}${pct.toFixed(1).replace('.', ',')}%`

  return (
    <span className={`card-delta card-delta-${direction}`}>
      <span className="delta-arrow" aria-hidden="true">{arrow}</span>
      {label}
      <span className="delta-base">
        vs {baseYear}
        {pct !== null && ` (${format(Math.abs(delta.diff))})`}
      </span>
    </span>
  )
}

function SummaryCards({ summary, baseSummary, year, baseYear }) {
  const revenueDelta = getDelta(summary.total_revenue, baseSummary?.total_revenue)
  const colegiosDelta = getDelta(summary.unique_colegios, baseSummary?.unique_colegios)
  const asesoresDelta = getDelta(summary.unique_asesores, baseSummary?.unique_asesores)

  return (
    <div className="summary-cards">
      <div className="summary-card primary">
        <div className="card-icon">€</div>
        <div className="card-content">
          <h3>Ingresos Totales ({year})</h3>
          <p className="card-value">{formatCurrency(summary.total_revenue)}</p>
          <DeltaBadge delta={revenueDelta} baseYear={baseYear} format={formatCurrency} />
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">🏫</div>
        <div className="card-content">
          <h3>Colegios</h3>
          <p className="card-value">{formatNumber(summary.unique_colegios)}</p>
          <span className="card-label">colegios únicos</span>
          <DeltaBadge delta={colegiosDelta} baseYear={baseYear} format={formatNumber} />
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">👥</div>
        <div className="card-content">
          <h3>Asesores</h3>
          <p className="card-value">{formatNumber(summary.unique_asesores)}</p>
          <span className="card-label">representantes</span>
          <DeltaBadge delta={asesoresDelta} baseYear={baseYear} format={formatNumber} />
        </div>
      </div>
    </div>
  )
}

export default SummaryCards
