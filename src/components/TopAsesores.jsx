import { useState, useEffect } from 'react'
import axios from 'axios'
import './TopAsesores.css'

function TopAsesores({ apiUrl, year }) {
  const [asesores, setAsesores] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)

  useEffect(() => {
    fetchAsesores()
  }, [year, limit])

  const fetchAsesores = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${apiUrl}/api/top-asesores`, {
        params: { year, limit }
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

  return (
    <div className="top-asesores">
      <div className="section-header">
        <h2 className="section-title">Top Asesores ({year})</h2>
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
        <div className="asesores-list">
          {asesores.map((asesor, index) => (
            <div key={index} className="asesor-item">
              <div className="rank">{index + 1}</div>
              <div className="asesor-info">
                <div className="asesor-name">{asesor.asesor}</div>
                <div className="asesor-label">Sales Representative</div>
              </div>
              <div className="asesor-revenue">
                {formatCurrency(asesor.total_neto)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TopAsesores
