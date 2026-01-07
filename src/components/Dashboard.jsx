import { useState, useEffect } from 'react'
import axios from 'axios'
import './Dashboard.css'
import TopColegios from './TopColegios'
import TopAsesores from './TopAsesores'
import MonthlyComparison from './MonthlyComparison'
import SummaryCards from './SummaryCards'

function Dashboard({ years, apiUrl }) {
  const [selectedYear1, setSelectedYear1] = useState(years[years.length - 1] || 2025)
  const [selectedYear2, setSelectedYear2] = useState(years[years.length - 2] || 2024)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    fetchSummary()
  }, [selectedYear1])

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/summary`, {
        params: { year: selectedYear1 }
      })
      setSummary(response.data)
    } catch (err) {
      console.error('Error fetching summary:', err)
    }
  }

  const handleYear1Change = (e) => {
    setSelectedYear1(parseInt(e.target.value))
  }

  const handleYear2Change = (e) => {
    setSelectedYear2(parseInt(e.target.value))
  }

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <div className="control-group">
          <label htmlFor="year1">Primary Year:</label>
          <select id="year1" value={selectedYear1} onChange={handleYear1Change}>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="year2">Comparison Year:</label>
          <select id="year2" value={selectedYear2} onChange={handleYear2Change}>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {summary && <SummaryCards summary={summary} year={selectedYear1} />}

      <div className="dashboard-grid">
        <div className="dashboard-section full-width">
          <MonthlyComparison
            apiUrl={apiUrl}
            year1={selectedYear1}
            year2={selectedYear2}
          />
        </div>

        <div className="dashboard-section">
          <TopColegios
            apiUrl={apiUrl}
            year={selectedYear1}
          />
        </div>

        <div className="dashboard-section">
          <TopAsesores
            apiUrl={apiUrl}
            year={selectedYear1}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
