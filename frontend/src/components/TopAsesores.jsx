import { useState, useEffect } from 'react'
import axios from 'axios'
import './TopAsesores.css'

function TopAsesores({ apiUrl, year, years, product }) {
  const [asesores, setAsesores] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedYear, setSelectedYear] = useState(year)

  useEffect(() => {
    fetchAsesores()
  }, [selectedYear, limit, product])

  const fetchAsesores = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/top-asesores`, {
        params: { year: selectedYear, limit, product }
      })
      setAsesores(response.data.data)
    } catch (err) {
      console.error('Error fetching asesores:', err)
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

  const filteredAsesores = asesores.filter(asesor => {
    const searchLower = searchTerm.toLowerCase()
    return asesor.asesor.toLowerCase().includes(searchLower)
  })

  return (
    <div className="top-asesores">
      <div className="section-header">
        <h2 className="section-title">Mejores Asesores</h2>
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
          placeholder="Buscar asesor..."
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
        <div className="asesores-list">
          {filteredAsesores.length === 0 ? (
            <div className="no-results">No se encontraron resultados para "{searchTerm}"</div>
          ) : (
            filteredAsesores.map((asesor, index) => (
            <div key={index} className="asesor-item">
              <div className="rank">{index + 1}</div>
              <div className="asesor-info">
                <div className="asesor-name">{asesor.asesor}</div>
                <div className="asesor-label">Representante de Ventas</div>
              </div>
              <div className="asesor-revenue">
                {formatCurrency(asesor.total_neto)}
              </div>
            </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default TopAsesores
