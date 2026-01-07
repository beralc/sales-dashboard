import { useState, useEffect } from 'react'
import axios from 'axios'
import './AsesoresPerformance.css'

function AsesoresPerformance({ apiUrl, year1, year2, product }) {
  const [performanceData, setPerformanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    fetchPerformance()
  }, [year1, year2, product])

  const fetchPerformance = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/asesores-performance`, {
        params: { year1, year2, product }
      })
      setPerformanceData(response.data)
    } catch (err) {
      console.error('Error fetching asesores performance:', err)
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

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="asesores-performance">
        <div className="section-header">
          <h2 className="section-title">Rendimiento de Asesores: {year1} → {year2}</h2>
        </div>
        <div className="loading-spinner">Cargando...</div>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className="asesores-performance">
        <div className="section-header">
          <h2 className="section-title">Rendimiento de Asesores: {year1} → {year2}</h2>
        </div>
        <div className="no-data">No hay datos disponibles</div>
      </div>
    )
  }

  const { top_retention, top_new, top_lost } = performanceData

  return (
    <div className="asesores-performance">
      <div className="section-header">
        <h2 className="section-title">
          Rendimiento de Asesores: {year1} → {year2}
        </h2>
        <select
          className="limit-select"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value))}
        >
          <option value={5}>Mostrar 5</option>
          <option value={10}>Mostrar 10</option>
          <option value={20}>Mostrar 20</option>
          <option value={100}>Mostrar Todos</option>
        </select>
      </div>

      <div className="performance-sections">
        {/* Top Retention Section */}
        <div className="performance-section retention-section">
          <h3 className="subsection-title">🏆 Asesores con Mejor Retención</h3>
          <div className="asesores-list">
            {top_retention.slice(0, limit).map((asesor, index) => (
              <div key={index} className="asesor-item retention-item">
                <div className="asesor-rank">#{index + 1}</div>
                <div className="asesor-info">
                  <div className="asesor-name">{asesor.asesor}</div>
                  <div className="asesor-stats">
                    <div className="stat-group">
                      <span className="stat-label">Tasa de Retención:</span>
                      <span className="stat-value success-text">{formatPercentage(asesor.retention_rate)}</span>
                    </div>
                    <div className="stat-group">
                      <span className="stat-label">Colegios Retenidos:</span>
                      <span className="stat-value">{asesor.retained_count}</span>
                    </div>
                    <div className="stat-group">
                      <span className="stat-label">Ingresos Retenidos:</span>
                      <span className="stat-value">{formatCurrency(asesor.revenue_retained)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top New Acquisitions Section */}
        <div className="performance-section new-section">
          <h3 className="subsection-title">✨ Asesores con Más Colegios Nuevos</h3>
          <div className="asesores-list">
            {top_new.slice(0, limit).map((asesor, index) => (
              <div key={index} className="asesor-item new-item">
                <div className="asesor-rank">#{index + 1}</div>
                <div className="asesor-info">
                  <div className="asesor-name">{asesor.asesor}</div>
                  <div className="asesor-stats">
                    <div className="stat-group">
                      <span className="stat-label">Colegios Nuevos:</span>
                      <span className="stat-value success-text">{asesor.new_count}</span>
                    </div>
                    <div className="stat-group">
                      <span className="stat-label">Ingresos Nuevos:</span>
                      <span className="stat-value">{formatCurrency(asesor.revenue_new)}</span>
                    </div>
                    <div className="stat-group">
                      <span className="stat-label">Tasa de Retención:</span>
                      <span className="stat-value">{formatPercentage(asesor.retention_rate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Lost Section */}
        <div className="performance-section lost-section">
          <h3 className="subsection-title">⚠️ Asesores con Más Colegios Perdidos</h3>
          <div className="asesores-list">
            {top_lost.slice(0, limit).map((asesor, index) => (
              <div key={index} className="asesor-item lost-item">
                <div className="asesor-rank">#{index + 1}</div>
                <div className="asesor-info">
                  <div className="asesor-name">{asesor.asesor}</div>
                  <div className="asesor-stats">
                    <div className="stat-group">
                      <span className="stat-label">Colegios Perdidos:</span>
                      <span className="stat-value danger-text">{asesor.lost_count}</span>
                    </div>
                    <div className="stat-group">
                      <span className="stat-label">Ingresos Perdidos:</span>
                      <span className="stat-value">{formatCurrency(asesor.revenue_lost)}</span>
                    </div>
                    <div className="stat-group">
                      <span className="stat-label">Tasa de Retención:</span>
                      <span className="stat-value">{formatPercentage(asesor.retention_rate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AsesoresPerformance
