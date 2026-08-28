import { useState, useEffect } from 'react'
import axios from 'axios'
import './Dashboard.css'
import TopColegios from './TopColegios'
import TopAsesores from './TopAsesores'
import MonthlyComparison from './MonthlyComparison'
import SummaryCards from './SummaryCards'
import LostColegios from './LostColegios'
import NewColegios from './NewColegios'
import RetentionMetrics from './RetentionMetrics'
import AsesoresPerformance from './AsesoresPerformance'

function Dashboard({ years, apiUrl, selectedProduct }) {
  const [selectedYear1, setSelectedYear1] = useState(years[years.length - 1] || 2025)
  const [selectedYear2, setSelectedYear2] = useState(years[years.length - 2] || 2024)
  const [summary, setSummary] = useState(null)
  const [baseSummary, setBaseSummary] = useState(null)

  // Products that don't have retention metrics (transactional, not subscription-based)
  const nonRetentionProducts = ['dispositivos', 'ondemand']
  const showRetentionMetrics = !nonRetentionProducts.includes(selectedProduct?.toLowerCase())

  // Fetch both years so the summary cards can show the year-over-year change
  // against the same base year the rest of the dashboard compares to.
  useEffect(() => {
    let cancelled = false

    const fetchSummary = async () => {
      try {
        const [current, base] = await Promise.all([
          axios.get(`${apiUrl}/api/summary`, {
            params: { year: selectedYear1, product: selectedProduct }
          }),
          axios.get(`${apiUrl}/api/summary`, {
            params: { year: selectedYear2, product: selectedProduct }
          })
        ])
        if (cancelled) return
        setSummary(current.data)
        setBaseSummary(base.data)
      } catch (err) {
        console.error('Error fetching summary:', err)
      }
    }

    fetchSummary()

    // Filters can change faster than the requests resolve; ignore stale replies.
    return () => { cancelled = true }
  }, [apiUrl, selectedYear1, selectedYear2, selectedProduct])

  const handleYear1Change = (e) => {
    const newYear1 = parseInt(e.target.value)
    setSelectedYear1(newYear1)
    // If the new "actual" year is less than base year, adjust base year
    if (newYear1 < selectedYear2) {
      setSelectedYear2(newYear1)
    }
  }

  const handleYear2Change = (e) => {
    const newYear2 = parseInt(e.target.value)
    setSelectedYear2(newYear2)
    // If the new base year is greater than "actual" year, adjust "actual" year
    if (newYear2 > selectedYear1) {
      setSelectedYear1(newYear2)
    }
  }

  // Filter years for "Año a Comparar" to only show years >= selectedYear2
  const availableYear1Options = years.filter(year => year >= selectedYear2)

  // Filter years for "Año Base" to only show years <= selectedYear1
  const availableYear2Options = years.filter(year => year <= selectedYear1)

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <div className="control-group">
          <label htmlFor="year2">Año Base (anterior):</label>
          <select id="year2" value={selectedYear2} onChange={handleYear2Change}>
            {availableYear2Options.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="year1">Año a Comparar (actual):</label>
          <select id="year1" value={selectedYear1} onChange={handleYear1Change}>
            {availableYear1Options.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <SummaryCards
          summary={summary}
          baseSummary={selectedYear1 === selectedYear2 ? null : baseSummary}
          year={selectedYear1}
          baseYear={selectedYear2}
        />
      )}

      {showRetentionMetrics && (
        <RetentionMetrics apiUrl={apiUrl} year1={selectedYear2} year2={selectedYear1} product={selectedProduct} />
      )}

      {showRetentionMetrics && (
        <AsesoresPerformance apiUrl={apiUrl} year1={selectedYear2} year2={selectedYear1} product={selectedProduct} />
      )}

      <div className="dashboard-grid">
        <div className="dashboard-section full-width">
          <MonthlyComparison
            apiUrl={apiUrl}
            years={years}
            product={selectedProduct}
          />
        </div>

        <div className="dashboard-section">
          <TopColegios
            apiUrl={apiUrl}
            year={selectedYear1}
            years={years}
            product={selectedProduct}
          />
        </div>

        <div className="dashboard-section">
          <TopAsesores
            apiUrl={apiUrl}
            year={selectedYear1}
            years={years}
            product={selectedProduct}
          />
        </div>

        <div className="dashboard-section full-width">
          <NewColegios
            apiUrl={apiUrl}
            year1={selectedYear2}
            year2={selectedYear1}
            product={selectedProduct}
          />
        </div>

        <div className="dashboard-section full-width">
          <LostColegios
            apiUrl={apiUrl}
            year1={selectedYear2}
            year2={selectedYear1}
            product={selectedProduct}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
