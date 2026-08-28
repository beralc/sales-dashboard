import { useState, useEffect } from 'react'
import axios from 'axios'
import './TopColegios.css'

function TopColegios({ apiUrl, year, years, product }) {
  const [colegios, setColegios] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState(year)

  // Follow the dashboard-level year control. Without this the panel keeps
  // whatever year it mounted with and silently shows stale figures.
  useEffect(() => {
    setSelectedYear(year)
  }, [year])

  useEffect(() => {
    fetchColegios()
  }, [selectedYear, limit, product])

  const fetchColegios = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/top-colegios`, {
        params: { year: selectedYear, limit, product }
      })
      setColegios(response.data.data)
    } catch (err) {
      console.error('Error fetching colegios:', err)
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

  const filteredColegios = colegios.filter(colegio => {
    const searchLower = searchTerm.toLowerCase()
    return colegio.colegio.toLowerCase().includes(searchLower) ||
           (colegio.congregacion && colegio.congregacion.toLowerCase().includes(searchLower))
  })

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

      {loading ? (
        <div className="loading-spinner">Cargando...</div>
      ) : (
        <div className="colegios-list">
          {filteredColegios.length === 0 ? (
            <div className="no-results">No se encontraron resultados para "{searchTerm}"</div>
          ) : (
            filteredColegios.map((colegio, index) => (
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
