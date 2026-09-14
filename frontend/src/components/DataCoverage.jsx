import { useApiData } from '../hooks/useApiData'
import './DataCoverage.css'

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const shortMonth = (n) => (MONTHS[n - 1] ?? `mes ${n}`).slice(0, 3)

/**
 * States how far the data runs and which period the comparison actually uses.
 *
 * The current year is always partial, so the API clamps both sides of a
 * comparison to the last complete month. That keeps the figures honest, but it
 * has to be visible - otherwise the totals here will not match a full-year
 * number from anywhere else.
 */
function DataCoverage({ apiUrl, currentYear, baseYear }) {
  const { data } = useApiData(`${apiUrl}/api/data-coverage`, {})

  if (!data?.latest_month) return null

  const {
    latest_year: latestYear,
    latest_month_number: latestMonth,
    comparison_cutoff_month: cutoff
  } = data

  const monthName = MONTHS[latestMonth - 1] ?? `mes ${latestMonth}`

  // Both sides are clamped only when the partial year is part of the comparison.
  const isClamped =
    cutoff && (currentYear === latestYear || baseYear === latestYear) && currentYear !== baseYear

  return (
    <div className="data-coverage">
      <span className="coverage-label">
        Datos hasta <strong>{monthName} {latestYear}</strong>
      </span>
      {isClamped && (
        <span className="coverage-period">
          Comparación equivalente: <strong>ene–{shortMonth(cutoff)}</strong> de {baseYear} y {currentYear}
          {latestMonth > cutoff && ` · ${MONTHS[latestMonth - 1]} está incompleto y queda fuera`}
        </span>
      )}
    </div>
  )
}

export default DataCoverage
