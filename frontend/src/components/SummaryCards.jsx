import './SummaryCards.css'

function SummaryCards({ summary, year }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="summary-cards">
      <div className="summary-card primary">
        <div className="card-icon">€</div>
        <div className="card-content">
          <h3>Ingresos Totales ({year})</h3>
          <p className="card-value">{formatCurrency(summary.total_revenue)}</p>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">🏫</div>
        <div className="card-content">
          <h3>Colegios</h3>
          <p className="card-value">{summary.unique_colegios}</p>
          <span className="card-label">colegios únicos</span>
        </div>
      </div>

      <div className="summary-card">
        <div className="card-icon">👥</div>
        <div className="card-content">
          <h3>Asesores</h3>
          <p className="card-value">{summary.unique_asesores}</p>
          <span className="card-label">representantes</span>
        </div>
      </div>
    </div>
  )
}

export default SummaryCards
