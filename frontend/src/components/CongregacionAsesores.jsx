import { useApiData } from '../hooks/useApiData'
import PanelError from './PanelError'
import Change from './Change'
import { formatCurrency } from '../utils/format'
import './CongregacionAsesores.css'

function CongregacionAsesores({ apiUrl, currentYear, baseYear, products, congregacion }) {
  const { data, loading, error, retry } = useApiData(
    `${apiUrl}/api/congregacion-asesores`,
    { year: currentYear, compare_year: baseYear, products, congregacion }
  )

  if (error) {
    return (
      <div className="congregacion-asesores dashboard-section">
        <h2 className="section-title">Asesores con mayor facturación</h2>
        <PanelError onRetry={retry} />
      </div>
    )
  }

  return (
    <div className="congregacion-asesores dashboard-section">
      <div className="section-header">
        <h2 className="section-title">Asesores con mayor facturación</h2>
      </div>
      {loading ? (
        <div className="loading-spinner">Cargando...</div>
      ) : (
        <div className="asesores-list">
          {(data?.data ?? []).length === 0 ? (
            <div className="no-results">No hay datos para este año</div>
          ) : (
            data.data.map((asesor, index) => (
              <div key={asesor.asesor} className="asesor-item">
                <div className="rank">{index + 1}</div>
                <div className="asesor-info">
                  <div className="asesor-name">{asesor.asesor}</div>
                  <div className="asesor-label">
                    {asesor.colegios} colegios · {asesor.congregaciones} congregaciones
                  </div>
                </div>
                <div className="asesor-revenue">
                  {formatCurrency(asesor.total)}
                  <Change current={asesor.total} base={asesor.base_total} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default CongregacionAsesores
