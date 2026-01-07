import { useState, useEffect } from 'react'
import axios from 'axios'
import './TopColegios.css'

function TopColegios({ apiUrl, year }) {
  const [colegios, setColegios] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    fetchColegios()
  }, [year, limit])

  const fetchColegios = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/top-colegios`, {
        params: { year, limit }
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

  return (
    <div className="top-colegios">
      <div className="section-header">
        <h2 className="section-title">Top Colegios ({year})</h2>
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

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <div className="colegios-list">
          {colegios.map((colegio, index) => (
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
          ))}
        </div>
      )}
    </div>
  )
}

export default TopColegios
