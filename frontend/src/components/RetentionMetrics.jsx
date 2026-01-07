import { useState, useEffect } from 'react'
import axios from 'axios'
import './RetentionMetrics.css'

function RetentionMetrics({ apiUrl, year1, year2, product }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [year1, year2, product])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/retention-metrics`, {
        params: { year1, year2, product }
      })
      setMetrics(response.data)
    } catch (err) {
      console.error('Error fetching retention metrics:', err)
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

  if (loading || !metrics) {
    return null
  }

  const { schools, revenue } = metrics

  return (
    <div className="retention-metrics">
      <h3 className="metrics-title">Análisis de Retención: {year1} → {year2}</h3>

      <div className="metrics-grid">
        {/* Retention Rate */}
        <div className="metric-card retention">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-label">Tasa de Retención</div>
            <div className="metric-value">{schools.retention_rate}%</div>
            <div className="metric-detail">
              {schools.retained} de {schools.year1_total} colegios
            </div>
          </div>
        </div>

        {/* Churn Rate */}
        <div className="metric-card churn">
          <div className="metric-icon">📉</div>
          <div className="metric-content">
            <div className="metric-label">Tasa de Abandono</div>
            <div className="metric-value danger">{schools.churn_rate}%</div>
            <div className="metric-detail">
              {schools.lost} colegios perdidos
            </div>
          </div>
        </div>

        {/* New Schools */}
        <div className="metric-card new-schools">
          <div className="metric-icon">✨</div>
          <div className="metric-content">
            <div className="metric-label">Colegios Nuevos</div>
            <div className="metric-value success">{schools.new}</div>
            <div className="metric-detail">
              {schools.year2_total > 0 ? Math.round((schools.new / schools.year2_total) * 100) : 0}% de {schools.year2_total} colegios
            </div>
          </div>
        </div>

        {/* Growth Rate */}
        <div className={`metric-card ${schools.growth_rate >= 0 ? 'growth-positive' : 'growth-negative'}`}>
          <div className="metric-icon">{schools.growth_rate >= 0 ? '📈' : '📉'}</div>
          <div className="metric-content">
            <div className="metric-label">Crecimiento Neto</div>
            <div className={`metric-value ${schools.growth_rate >= 0 ? 'success' : 'danger'}`}>
              {schools.growth_rate > 0 ? '+' : ''}{schools.growth_rate}%
            </div>
            <div className="metric-detail">
              {schools.year2_total - schools.year1_total > 0 ? '+' : ''}
              {schools.year2_total - schools.year1_total} colegios
            </div>
          </div>
        </div>

        {/* Revenue Growth */}
        <div className={`metric-card ${revenue.revenue_growth_rate >= 0 ? 'revenue-positive' : 'revenue-negative'}`}>
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Crecimiento de Ingresos</div>
            <div className={`metric-value ${revenue.revenue_growth_rate >= 0 ? 'success' : 'danger'}`}>
              {revenue.revenue_growth_rate > 0 ? '+' : ''}{revenue.revenue_growth_rate}%
            </div>
            <div className="metric-detail">
              {formatCurrency(revenue.year2_total - revenue.year1_total)}
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="metric-card revenue-breakdown">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Desglose de Ingresos {year2}</div>
            <div className="revenue-bars">
              <div className="revenue-bar-item">
                <span className="bar-label">Retenidos:</span>
                <div className="bar-container">
                  <div
                    className="bar bar-retained"
                    style={{width: `${(revenue.retained_year2 / revenue.year2_total * 100)}%`}}
                  ></div>
                </div>
                <span className="bar-value">{formatCurrency(revenue.retained_year2)}</span>
              </div>
              <div className="revenue-bar-item">
                <span className="bar-label">Nuevos:</span>
                <div className="bar-container">
                  <div
                    className="bar bar-new"
                    style={{width: `${(revenue.new_revenue / revenue.year2_total * 100)}%`}}
                  ></div>
                </div>
                <span className="bar-value">{formatCurrency(revenue.new_revenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetentionMetrics
