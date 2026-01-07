import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './MonthlyComparison.css'

function MonthlyComparison({ apiUrl, year1, year2 }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState('line')

  useEffect(() => {
    fetchMonthlyData()
  }, [year1, year2])

  const fetchMonthlyData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/monthly-comparison`, {
        params: { year1, year2 }
      })
      setData(response.data.data)
    } catch (err) {
      console.error('Error fetching monthly comparison:', err)
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          {payload.length === 2 && (
            <p className="tooltip-diff">
              Difference: {formatCurrency(payload[0].value - payload[1].value)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="monthly-comparison">
      <div className="section-header">
        <h2 className="section-title">Monthly Comparison: {year1} vs {year2}</h2>
        <div className="chart-controls">
          <button
            className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Line Chart
          </button>
          <button
            className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey={`year${year1}`}
                stroke="#2563eb"
                strokeWidth={3}
                name={`${year1}`}
                dot={{ fill: '#2563eb', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey={`year${year2}`}
                stroke="#f59e0b"
                strokeWidth={3}
                name={`${year2}`}
                dot={{ fill: '#f59e0b', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey={`year${year1}`} fill="#2563eb" name={`${year1}`} />
              <Bar dataKey={`year${year2}`} fill="#f59e0b" name={`${year2}`} />
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default MonthlyComparison
