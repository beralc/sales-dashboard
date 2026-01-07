import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './MonthlyRetentionTrend.css'

function MonthlyRetentionTrend({ apiUrl, year1, year2 }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState('retention') // 'retention' or 'volume'

  useEffect(() => {
    fetchData()
  }, [year1, year2])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/monthly-retention`, {
        params: { year1, year2 }
      })
      setData(response.data.data)
    } catch (err) {
      console.error('Error fetching monthly retention:', err)
    } finally {
      setLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label"><strong>{label}</strong></p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}{viewType === 'retention' ? '%' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="monthly-retention-trend">
        <h3 className="section-title">Tendencia Mensual de Retención</h3>
        <div className="loading-spinner">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="monthly-retention-trend">
      <div className="section-header">
        <h3 className="section-title">Tendencia Mensual: {year1} vs {year2}</h3>
        <div className="view-controls">
          <button
            className={`view-btn ${viewType === 'retention' ? 'active' : ''}`}
            onClick={() => setViewType('retention')}
          >
            % Retención
          </button>
          <button
            className={`view-btn ${viewType === 'volume' ? 'active' : ''}`}
            onClick={() => setViewType('volume')}
          >
            Volumen
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        {viewType === 'retention' ? (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="retention_rate"
              stroke="#2563eb"
              strokeWidth={3}
              name="Tasa de Retención"
              dot={{ fill: '#2563eb', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="retained" fill="#2563eb" name="Retenidos" />
            <Bar dataKey="new" fill="#10b981" name="Nuevos" />
            <Bar dataKey="lost" fill="#ef4444" name="Perdidos" />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Best/Worst months summary */}
      <div className="months-summary">
        {(() => {
          const sortedByRetention = [...data].sort((a, b) => b.retention_rate - a.retention_rate)
          const best = sortedByRetention[0]
          const worst = sortedByRetention[sortedByRetention.length - 1]

          return (
            <>
              <div className="month-highlight best">
                <span className="highlight-label">Mejor Mes:</span>
                <span className="highlight-value">{best?.month} ({best?.retention_rate}%)</span>
              </div>
              <div className="month-highlight worst">
                <span className="highlight-label">Peor Mes:</span>
                <span className="highlight-value">{worst?.month} ({worst?.retention_rate}%)</span>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}

export default MonthlyRetentionTrend
