import { useApiData } from '../hooks/useApiData'
import './DataCoverage.css'

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

/**
 * States how far the data runs, and warns when the month in progress makes the
 * comparison approximate.
 *
 * The current month is included in the figures even though it is incomplete,
 * because excluding it hid real invoiced revenue. Invoice dates carry no day,
 * only year and month, so the base year cannot be trimmed to the same point -
 * that month is compared against a complete one, and this says so plainly
 * rather than letting the difference look like performance.
 */
function DataCoverage({ apiUrl, currentYear, baseYear }) {
  const { data } = useApiData(`${apiUrl}/api/data-coverage`, {})

  if (!data?.latest_month) return null

  const {
    latest_year: latestYear,
    latest_month_number: latestMonth,
    current_month_partial: partial,
    data_through_day: day
  } = data

  const monthName = MONTHS[latestMonth - 1] ?? `mes ${latestMonth}`
  const involvesCurrentYear = currentYear === latestYear || baseYear === latestYear
  const showWarning = partial && involvesCurrentYear && currentYear !== baseYear

  return (
    <div className={`data-coverage${showWarning ? ' data-coverage-warning' : ''}`}>
      <span className="coverage-label">
        Datos hasta <strong>{monthName} {latestYear}</strong>
        {partial && day ? ` (día ${day})` : ''}
      </span>
      {showWarning && (
        <span className="coverage-note">
          Aviso: {monthName} {latestYear} está incompleto y sí se incluye en los
          totales. Al compararlo con {monthName} de {baseYear}, que es un mes
          entero, la variación de ese mes no es exacta.
        </span>
      )}
    </div>
  )
}

export default DataCoverage
