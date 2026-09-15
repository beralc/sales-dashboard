import { useState } from 'react'
import Congregaciones from './Congregaciones'
import CongregacionAsesores from './CongregacionAsesores'
import DataCoverage from './DataCoverage'
import './Dashboard.css'

/**
 * The congregation view, with its own year controls.
 *
 * It deliberately reuses the sales dashboard's controls and coverage banner so
 * both views read as one product, and so the same-period rule is applied and
 * explained identically in both.
 */
function CongregacionesPage({ years, apiUrl }) {
  const [currentYear, setCurrentYear] = useState(years[years.length - 1] ?? 2026)
  const [baseYear, setBaseYear] = useState(years[years.length - 2] ?? 2025)

  const handleCurrent = (e) => {
    const value = parseInt(e.target.value)
    setCurrentYear(value)
    if (value < baseYear) setBaseYear(value)
  }

  const handleBase = (e) => {
    const value = parseInt(e.target.value)
    setBaseYear(value)
    if (value > currentYear) setCurrentYear(value)
  }

  return (
    <div className="dashboard">
      <div className="dashboard-controls">
        <div className="control-group">
          <label htmlFor="congr-year2">Año Base (anterior):</label>
          <select id="congr-year2" value={baseYear} onChange={handleBase}>
            {years.filter((y) => y <= currentYear).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label htmlFor="congr-year1">Año a Comparar (actual):</label>
          <select id="congr-year1" value={currentYear} onChange={handleCurrent}>
            {years.filter((y) => y >= baseYear).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <DataCoverage apiUrl={apiUrl} currentYear={currentYear} baseYear={baseYear} />

      <Congregaciones
        apiUrl={apiUrl}
        currentYear={currentYear}
        baseYear={baseYear}
      />
      <CongregacionAsesores
        apiUrl={apiUrl}
        currentYear={currentYear}
        baseYear={baseYear}
      />
    </div>
  )
}

export default CongregacionesPage
