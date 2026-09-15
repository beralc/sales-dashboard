import { useState } from 'react'
import axios from 'axios'
import { useApiData } from '../hooks/useApiData'
import { getProductConfig } from '../productConfig'
import PanelError from './PanelError'
import Change from './Change'
import { formatCurrency } from '../utils/format'
import CongregacionRow from './CongregacionRow'
import './Congregaciones.css'

const SCOPES = [
  { id: 'todos', label: 'Todos' },
  { id: 'con', label: 'Solo Congregaciones' },
  { id: 'sin', label: 'Solo Sin Congregación' }
]

function Congregaciones({ apiUrl, currentYear, baseYear }) {
  const [scope, setScope] = useState('todos')
  const [selected, setSelected] = useState([])
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(false)

  const productsParam = selected.join(',')
  const { data, loading, error, retry } = useApiData(
    `${apiUrl}/api/congregaciones`,
    { year: currentYear, compare_year: baseYear, products: productsParam, scope, limit: 200 }
  )

  // Columns follow the current filter; the chip row must offer every product,
  // otherwise selecting one hides the rest and you can never pick a second.
  const columns = data?.products ?? []
  const allProducts = data?.all_products ?? columns
  const clearFilters = () => {
    setSelected([])
    setScope('todos')
  }

  const toggle = (slug) =>
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    )

  const exportCsv = async () => {
    setExporting(true)
    setExportError(false)
    try {
      const response = await axios.get(`${apiUrl}/api/congregaciones/export`, {
        params: { year: currentYear, compare_year: baseYear, products: productsParam, scope },
        responseType: 'blob'
      })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `congregaciones_${currentYear}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('Error exporting congregaciones:', err)
      setExportError(true)
    } finally {
      setExporting(false)
    }
  }

  if (error) {
    return (
      <div className="congregaciones">
        <h2 className="section-title">Congregaciones</h2>
        <PanelError onRetry={retry} />
      </div>
    )
  }

  const totals = data?.totals
  const con = totals?.con_congregacion ?? 0
  const sin = totals?.sin_congregacion ?? 0
  const share = con + sin > 0 ? (con / (con + sin)) * 100 : 0

  return (
    <div className="congregaciones">
      <div className="congr-controls">
        <button className="chip congr-export" onClick={exportCsv} disabled={exporting}>
          {exporting ? 'Exportando...' : 'Exportar a Excel'}
        </button>
        <div className="scope-switch" role="group" aria-label="Ámbito">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              className={scope === s.id ? 'active' : ''}
              onClick={() => setScope(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="product-chips">
          <span className="chips-label">Productos:</span>
          <button
            className={`chip${selected.length === 0 ? ' on' : ''}`}
            onClick={() => setSelected([])}
          >
            Todos
          </button>
          {allProducts.map((slug) => (
            <button
              key={slug}
              className={`chip${selected.includes(slug) ? ' on' : ''}`}
              onClick={() => toggle(slug)}
            >
              {getProductConfig(slug).name}
            </button>
          ))}
          {(selected.length > 0 || scope !== 'todos') && (
            <button className="chip chip-clear" onClick={clearFilters}>
              ✕ Limpiar filtros
            </button>
          )}
        </div>
        {exportError && <PanelError onRetry={exportCsv} />}
      </div>

      <div className="congr-kpis">
        <div className="congr-kpi">
          <h4>Congregaciones activas</h4>
          <p className="kpi-value">{data?.total_congregaciones ?? '—'}</p>
        </div>
        <div className="congr-kpi">
          <h4>Facturación en congregaciones</h4>
          <p className="kpi-value">{formatCurrency(con)}</p>
          <Change current={con} base={totals?.con_congregacion_base ?? 0} />
        </div>
        <div className="congr-kpi">
          <h4>Sin congregación</h4>
          <p className="kpi-value">{formatCurrency(sin)}</p>
          <Change current={sin} base={totals?.sin_congregacion_base ?? 0} />
        </div>
        <div className="congr-kpi">
          <h4>% del negocio en congregaciones</h4>
          <p className="kpi-value">{share.toFixed(0)}%</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Cargando...</div>
      ) : (
        <div className="congr-table-wrap">
          <table className="congr-table">
            <thead>
              <tr>
                <th>Congregación</th>
                <th className="num">Total</th>
                {columns.map((slug) => (
                  <th key={slug} className="num">{getProductConfig(slug).name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((row) => (
                <CongregacionRow
                  key={row.congregacion}
                  row={row}
                  products={columns}
                  apiUrl={apiUrl}
                  currentYear={currentYear}
                  baseYear={baseYear}
                  productsParam={productsParam}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Congregaciones
