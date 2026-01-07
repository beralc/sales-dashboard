import { useState, useEffect } from 'react'
import axios from 'axios'
import './LostColegios.css'

function LostColegios({ apiUrl, year1, year2, product }) {
  const [lostData, setLostData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    fetchLostColegios()
  }, [year1, year2, product])

  const fetchLostColegios = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/lost-colegios`, {
        params: { year1, year2, product }
      })
      setLostData(response.data)
    } catch (err) {
      console.error('Error fetching lost colegios:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="lost-colegios">
        <div className="section-header">
          <h2 className="section-title">Colegios Perdidos: {year1} → {year2}</h2>
        </div>
        <div className="loading-spinner">Cargando...</div>
      </div>
    )
  }

  if (!lostData || lostData.total_lost === 0) {
    return (
      <div className="lost-colegios">
        <div className="section-header">
          <h2 className="section-title">Colegios Perdidos: {year1} → {year2}</h2>
        </div>
        <div className="no-data">
          <p>✓ No se han perdido colegios entre {year1} y {year2}</p>
        </div>
      </div>
    )
  }

  const displayedColegios = lostData.data.slice(0, limit)

  return (
    <div className="lost-colegios">
      <div className="section-header">
        <h2 className="section-title">
          Colegios Perdidos: {year1} → {year2}
        </h2>
        <select
          className="limit-select"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
        >
          <option value={10}>Mostrar 10</option>
          <option value={20}>Mostrar 20</option>
          <option value={50}>Mostrar 50</option>
          <option value={lostData.total_lost}>Mostrar Todos ({lostData.total_lost})</option>
        </select>
      </div>

      <div className="lost-summary">
        <div className="lost-stat">
          <span className="lost-stat-label">Total Colegios Perdidos:</span>
          <span className="lost-stat-value warning">{lostData.total_lost}</span>
        </div>
        <div className="lost-stat">
          <span className="lost-stat-label">Ingresos Perdidos en {year1}:</span>
          <span className="lost-stat-value danger">{formatCurrency(lostData.total_revenue_lost)}</span>
        </div>
      </div>

      <div className="lost-colegios-list">
        {displayedColegios.map((colegio, index) => (
          <div key={index} className="lost-colegio-item">
            <div className="lost-icon">⚠️</div>
            <div className="lost-colegio-info">
              <div className="lost-colegio-name">{colegio.colegio}</div>
              {colegio.congregacion && colegio.congregacion !== 'SIN CONGREGACION' && (
                <div className="congregacion">{colegio.congregacion}</div>
              )}
              {colegio.asesor && (
                <div className="asesor-info-item">
                  <strong>Asesor:</strong> {colegio.asesor}
                </div>
              )}
              {colegio.coordinador && (
                <div className="coordinador-info-item">
                  <strong>Coordinador:</strong> {colegio.coordinador}
                </div>
              )}
              <div className="lost-revenue-info">
                Ingresos en {year1}: {formatCurrency(colegio.revenue_in_previous_year)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {limit < lostData.total_lost && (
        <div className="show-more-info">
          Mostrando {displayedColegios.length} de {lostData.total_lost} colegios perdidos
        </div>
      )}
    </div>
  )
}

export default LostColegios
