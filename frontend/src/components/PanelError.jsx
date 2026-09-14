import './PanelError.css'

/**
 * Shown when a panel's request fails, so a failure never renders as an empty
 * result. Without this a broken request looked exactly like "nothing to show".
 */
function PanelError({ onRetry }) {
  return (
    <div className="panel-error" role="alert">
      <span className="panel-error-icon" aria-hidden="true">⚠</span>
      <p>No se pudieron cargar los datos.</p>
      {onRetry && (
        <button className="panel-error-retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export default PanelError
