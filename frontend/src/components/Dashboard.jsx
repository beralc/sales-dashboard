import { useState, useEffect } from 'react'
import axios from 'axios'
import { useApiData } from '../hooks/useApiData'
import { getProductConfig } from '../productConfig'
import './Dashboard.css'
import TopColegios from './TopColegios'
import TopAsesores from './TopAsesores'
import MonthlyComparison from './MonthlyComparison'
import SummaryCards from './SummaryCards'
import DataCoverage from './DataCoverage'
import LostColegios from './LostColegios'
import NewColegios from './NewColegios'
import RetentionMetrics from './RetentionMetrics'
import AsesoresPerformance from './AsesoresPerformance'

function Dashboard({ years, apiUrl, products = [], selectedProducts = [], onProductsChange }) {
  // An empty selection means every product; the API takes a comma-separated list.
  const selectedProduct = selectedProducts.length ? selectedProducts.join(',') : undefined

  const toggleProduct = (slug) =>
    onProductsChange(
      selectedProducts.includes(slug)
        ? selectedProducts.filter((p) => p !== slug)
        : [...selectedProducts, slug]
    )

  const [selectedYear1, setSelectedYear1] = useState(years[years.length - 1] || 2025)
  const [selectedYear2, setSelectedYear2] = useState(years[years.length - 2] || 2024)
  const [summary, setSummary] = useState(null)
  const [baseSummary, setBaseSummary] = useState(null)
  const [congregacion, setCongregacion] = useState('')
  const { data: congregationData } = useApiData(`${apiUrl}/api/congregacion-list`, {})

  // Fetch both years so the summary cards can show the year-over-year change
  // against the same base year the rest of the dashboard compares to.
  useEffect(() => {
    let cancelled = false

    const fetchSummary = async () => {
      try {
        const [current, base] = await Promise.all([
          axios.get(`${apiUrl}/api/summary`, {
            params: { year: selectedYear1, product: selectedProduct, compare_year: selectedYear2, congregacion: congregacion || undefined }
          }),
          axios.get(`${apiUrl}/api/summary`, {
            params: { year: selectedYear2, product: selectedProduct, compare_year: selectedYear1, congregacion: congregacion || undefined }
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
  }, [apiUrl, selectedYear1, selectedYear2, selectedProduct, congregacion])

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
        <div className="control-group">
          <label htmlFor="congregacion">Congregación:</label>
          <select id="congregacion" value={congregacion} onChange={(e) => setCongregacion(e.target.value)}>
            <option value="">Todas</option>
            {(congregationData?.congregaciones ?? []).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
            <option value="__SIN__">Sin congregación</option>
          </select>
        </div>
      </div>

      {products.length > 1 && (
        <div className="product-filter">
          <span className="product-filter-label">Productos:</span>
          <button
            className={`chip${selectedProducts.length === 0 ? ' on' : ''}`}
            onClick={() => onProductsChange([])}
          >
            Todos
          </button>
          {products.map((slug) => (
            <button
              key={slug}
              className={`chip${selectedProducts.includes(slug) ? ' on' : ''}`}
              onClick={() => toggleProduct(slug)}
            >
              {getProductConfig(slug).name}
            </button>
          ))}
          {selectedProducts.length > 0 && (
            <button className="chip chip-clear" onClick={() => onProductsChange([])}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
      )}

      <DataCoverage
        apiUrl={apiUrl}
        currentYear={selectedYear1}
        baseYear={selectedYear2}
      />

      {summary && (
        <SummaryCards
          summary={summary}
          baseSummary={selectedYear1 === selectedYear2 ? null : baseSummary}
          year={selectedYear1}
          baseYear={selectedYear2}
        />
      )}

      {/* Shown for every product. Retention used to be hidden for transactional
          lines (dispositivos, ondemand); the team wants the asesor panels
          everywhere, reading "perdido" there as "did not buy again". */}
      <RetentionMetrics apiUrl={apiUrl} year1={selectedYear2} year2={selectedYear1} product={selectedProduct} />

      <AsesoresPerformance apiUrl={apiUrl} year1={selectedYear2} year2={selectedYear1} product={selectedProduct} />

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
            baseYear={selectedYear2}
            years={years}
            product={selectedProduct}
            congregacion={congregacion || undefined}
          />
        </div>

        <div className="dashboard-section">
          <TopAsesores
            apiUrl={apiUrl}
            year={selectedYear1}
            baseYear={selectedYear2}
            years={years}
            product={selectedProduct}
            congregacion={congregacion || undefined}
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
