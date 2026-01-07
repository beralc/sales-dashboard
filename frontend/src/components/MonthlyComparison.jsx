import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './MonthlyComparison.css'

function MonthlyComparison({ apiUrl, years, product }) {
  const [selectedYears, setSelectedYears] = useState([])
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [chartType, setChartType] = useState('line')

  // Initialize with the last 2 years
  useEffect(() => {
    if (years && years.length > 0) {
      const defaultYears = years.slice(-2)
      setSelectedYears(defaultYears)
    }
  }, [years])

  useEffect(() => {
    if (selectedYears.length > 0) {
      fetchMonthlyData()
    }
  }, [selectedYears, product])

  const fetchMonthlyData = async () => {
    if (selectedYears.length === 0) return

    setLoading(true)
    try {
      // Fetch data for all selected years
      const promises = selectedYears.map(year =>
        axios.get(`${apiUrl}/api/monthly-revenue`, {
          params: { year, product }
        })
      )

      const responses = await Promise.all(promises)

      // Combine data from all years
      const monthsMap = {}

      responses.forEach((response, index) => {
        const year = selectedYears[index]
        response.data.data.forEach(item => {
          if (!monthsMap[item.month]) {
            monthsMap[item.month] = { month: item.month }
          }
          monthsMap[item.month][`year${year}`] = item.revenue
        })
      })

      // Convert to array and sort by month
      const combinedData = Object.values(monthsMap).sort((a, b) => {
        const monthOrder = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
      })

      setData(combinedData)
    } catch (err) {
      console.error('Error fetching monthly comparison:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleYear = (year) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        // Don't allow deselecting if it's the only one selected
        if (prev.length === 1) return prev
        return prev.filter(y => y !== year)
      } else {
        return [...prev, year].sort((a, b) => a - b)
      }
    })
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
        </div>
      )
    }
    return null
  }

  // Color palette for different years
  const yearColors = {
    2017: '#64748b',
    2018: '#94a3b8',
    2019: '#cbd5e1',
    2020: '#06b6d4',
    2021: '#0ea5e9',
    2022: '#3b82f6',
    2023: '#6366f1',
    2024: '#f59e0b',
    2025: '#fbbf24',
  }

  return (
    <div className="monthly-comparison">
      <div className="section-header">
        <h2 className="section-title">Comparación Mensual por Año</h2>
        <div className="chart-controls">
          <button
            className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Líneas
          </button>
          <button
            className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Barras
          </button>
        </div>
      </div>

      <div className="year-selector">
        <span className="selector-label">Seleccionar años:</span>
        <div className="year-checkboxes">
          {years.map(year => (
            <label key={year} className="year-checkbox">
              <input
                type="checkbox"
                checked={selectedYears.includes(year)}
                onChange={() => toggleYear(year)}
              />
              <span className="checkbox-label" style={{
                color: selectedYears.includes(year) ? yearColors[year] : '#64748b',
                fontWeight: selectedYears.includes(year) ? '600' : '400'
              }}>
                {year}
              </span>
            </label>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Cargando...</div>
      ) : data.length === 0 ? (
        <div className="no-data">Selecciona al menos un año para ver la comparación</div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          {chartType === 'line' ? (
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedYears.map(year => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={`year${year}`}
                  stroke={yearColors[year] || '#64748b'}
                  strokeWidth={3}
                  name={`${year}`}
                  dot={{ fill: yearColors[year] || '#64748b', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {selectedYears.map(year => (
                <Bar
                  key={year}
                  dataKey={`year${year}`}
                  fill={yearColors[year] || '#64748b'}
                  name={`${year}`}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}

export default MonthlyComparison
