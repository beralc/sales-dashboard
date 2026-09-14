import { useApiData } from '../hooks/useApiData'
import './DataCoverage.css'

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

/**
 * States how far the loaded data runs, and warns when the selected comparison
 * puts a partial year against a complete one.
 *
 * Without this the dashboard gave no clue that the current year stops mid-way:
 * a seven-month 2026 against a twelve-month 2025 renders as a large drop that
 * looks like a real collapse.
 */
function DataCoverage({ apiUrl, currentYear, baseYear }) {
  const { data } = useApiData(`${apiUrl}/api/data-coverage`, {})

  if (!data?.latest_month) return null

  const { latest_year: latestYear, latest_month_number: monthNumber } = data
  const monthName = MONTHS[monthNumber - 1] ?? `mes ${monthNumber}`
  const isPartialYear = monthNumber < 12

  // Only a partial current year measured against an earlier, complete year
  // produces the misleading comparison.
  const comparisonIsUneven =
    isPartialYear && currentYear === latestYear && baseYear < latestYear

  return (
    <div className={`data-coverage${comparisonIsUneven ? ' data-coverage-warning' : ''}`}>
      <span className="coverage-label">
        Datos hasta <strong>{monthName} {latestYear}</strong>
      </span>
      {comparisonIsUneven && (
        <span className="coverage-note">
          {currentYear} incluye solo {monthNumber} {monthNumber === 1 ? 'mes' : 'meses'};
          {' '}la comparación con {baseYear} (año completo) no es equivalente.
        </span>
      )}
    </div>
  )
}

export default DataCoverage
