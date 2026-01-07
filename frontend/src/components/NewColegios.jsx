import { useState, useEffect } from 'react'
import axios from 'axios'
import './NewColegios.css'

function NewColegios({ apiUrl, year1, year2, product }) {
  const [newData, setNewData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    fetchNewColegios()
  }, [year1, year2, product])

  const fetchNewColegios = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/new-colegios`, {
        params: { year1, year2, product }
      })
      setNewData(response.data)
    } catch (err) {
      console.error('Error fetching new colegios:', err)
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
      <div className="new-colegios">
        <div className="section-header">
          <h2 className="section-title">Nuevos Colegios: {year1} → {year2}</h2>
        </div>
        <div className="loading-spinner">Cargando...</div>
      </div>
    )
  }

  if (!newData || newData.total_new === 0) {
    return (
      <div className="new-colegios">
        <div className="section-header">
          <h2 className="section-title">Nuevos Colegios: {year1} → {year2}</h2>
        </div>
        <div className="no-data-new">
          <p>No hay nuevos colegios entre {year1} y {year2}</p>
        </div>
      </div>
    )
  }

  const displayedColegios = newData.data.slice(0, limit)

  return (
    <div className="new-colegios">
      <div className="section-header">
        <h2 className="section-title">
          Nuevos Colegios: {year1} → {year2}
        </h2>
        <select
          className="limit-select"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
        >
          <option value={10}>Mostrar 10</option>
          <option value={20}>Mostrar 20</option>
          <option value={50}>Mostrar 50</option>
          <option value={newData.total_new}>Mostrar Todos ({newData.total_new})</option>
        </select>
      </div>

      <div className="new-summary">
        <div className="new-stat">
          <span className="new-stat-label">Total Colegios Nuevos:</span>
          <span className="new-stat-value success">{newData.total_new}</span>
        </div>
        <div className="new-stat">
          <span className="new-stat-label">Ingresos Nuevos en {year2}:</span>
          <span className="new-stat-value success">{formatCurrency(newData.total_revenue_new)}</span>
        </div>
      </div>

      <div className="new-colegios-list">
        {displayedColegios.map((colegio, index) => (
          <div key={index} className="new-colegio-item">
            <div className="new-icon">✨</div>
            <div className="new-colegio-info">
              <div className="new-colegio-name">{colegio.colegio}</div>
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
              <div className="new-revenue-info">
                Ingresos en {year2}: {formatCurrency(colegio.revenue_in_current_year)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {limit < newData.total_new && (
        <div className="show-more-info">
          Mostrando {displayedColegios.length} de {newData.total_new} colegios nuevos
        </div>
      )}
    </div>
  )
}

export default NewColegios
