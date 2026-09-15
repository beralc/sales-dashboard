import { formatCurrency, getChange } from '../utils/format'
import './Congregaciones.css'

/** Renders a year-over-year change, or nothing when one would mislead. */
function Change({ current, base }) {
  const change = getChange(current, base)
  if (!change) return null

  if (change.kind === 'new') {
    return <span className="congr-change new">nuevo</span>
  }

  if (change.kind === 'abs') {
    return (
      <span className={`congr-change ${change.diff >= 0 ? 'up' : 'down'}`}>
        {change.diff >= 0 ? '+' : '−'}{formatCurrency(Math.abs(change.diff))}
      </span>
    )
  }

  const { pct } = change
  const dir = pct > 1 ? 'up' : pct < -1 ? 'down' : 'flat'
  const arrow = pct > 1 ? '▲' : pct < -1 ? '▼' : '■'

  return (
    <span className={`congr-change ${dir}`}>
      {arrow} {pct > 0 ? '+' : ''}{pct.toFixed(1).replace('.', ',')}%
    </span>
  )
}

export default Change
