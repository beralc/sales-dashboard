import { useState, useEffect } from 'react'
import { useApiData } from '../hooks/useApiData'
import PanelError from './PanelError'
import './TopColegios.css'

function TopColegios({ apiUrl, year, years, product }) {
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState(year)

  // Follow the dashboard-level year control. Without this the panel keeps
  // whatever year it mounted with and silently shows stale figures.
  useEffect(() => {
    setSelectedYear(year)
  }, [year])

  // While searching, pull a much larger pool: the search box implies it covers
  // every school, but it filters client-side, so with the default Top 10 a real
  // school outside the top 10 came back as "no results".
  const { data, loading, error, retry } = useApiData(
    `${apiUrl}/api/top-colegios`,
    { year: selectedYear, limit: searchTerm ? 1000 : limit, product }
  )
  const colegios = data?.data ?? []

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const matchingColegios = colegios.filter(colegio => {
    const searchLower = searchTerm.toLowerCase()
    return colegio.colegio.toLowerCase().includes(searchLower) ||
           (colegio.congregacion && colegio.congregacion.toLowerCase().includes(searchLower))
  })

  // The pool is inflated while searching; never render more than the chosen Top N.
  const visibleColegios = matchingColegios.slice(0, limit)

  return (
    <div className="top-colegios">
      <div className="section-header">
        <h2 className="section-title">Colegios con mayor facturación</h2>
        <div className="header-controls">
          <select
            className="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            className="limit-select"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar colegio o congregación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="clear-search">✕</button>
        )}
      </div>

      {error ? (
        <PanelError onRetry={retry} />
      ) : loading ? (
        <div className="loading-spinner">Cargando...</div>
      ) : (
        <div className="colegios-list">
          {visibleColegios.length === 0 ? (
            <div className="no-results">
              {searchTerm
                ? `No se encontraron resultados para "${searchTerm}"`
                : 'No hay datos para este año'}
            </div>
          ) : (
            visibleColegios.map((colegio, index) => (
            <div key={index} className="colegio-item">
              <div className="rank">{index + 1}</div>
              <div className="colegio-info">
                <div className="colegio-name">{colegio.colegio}</div>
                {colegio.congregacion && colegio.congregacion !== 'SIN CONGREGACION' && (
                  <div className="congregacion">{colegio.congregacion}</div>
                )}
              </div>
              <div className="colegio-revenue">
                {formatCurrency(colegio.total_neto)}
              </div>
            </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default TopColegios
