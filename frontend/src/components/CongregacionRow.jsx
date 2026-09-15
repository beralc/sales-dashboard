import { useState } from 'react'
import { useApiData } from '../hooks/useApiData'
import Change from './Change'
import { formatCurrency } from '../utils/format'

/**
 * One congregación, expanding to the schools inside it.
 *
 * The schools are fetched only when the row is opened - there are 154
 * congregations and loading every school up front would pull most of the
 * dataset to show a handful of rows.
 */
function Colegios({ apiUrl, congregacion, currentYear, baseYear, productsParam, colSpan }) {
  const { data, loading, error } = useApiData(
    `${apiUrl}/api/congregacion-colegios`,
    {
      congregacion,
      year: currentYear,
      compare_year: baseYear,
      products: productsParam,
      limit: 200
    }
  )

  if (loading) {
    return (
      <tr className="congr-child">
        <td colSpan={colSpan} className="child-status">Cargando colegios...</td>
      </tr>
    )
  }

  if (error) {
    return (
      <tr className="congr-child">
        <td colSpan={colSpan} className="child-status error">
          No se pudieron cargar los colegios.
        </td>
      </tr>
    )
  }

  const rows = data?.data ?? []
  if (rows.length === 0) {
    return (
      <tr className="congr-child">
        <td colSpan={colSpan} className="child-status">Sin colegios en este periodo.</td>
      </tr>
    )
  }

  return rows.map((c) => (
    <tr key={c.colegio} className="congr-child">
      <td className="child-name">{c.colegio}</td>
      <td className="num">
        {formatCurrency(c.total)}
        <Change current={c.total} base={c.base_total} />
      </td>
      <td colSpan={colSpan - 2} />
    </tr>
  ))
}

function CongregacionRow({ row, products, apiUrl, currentYear, baseYear, productsParam }) {
  const [open, setOpen] = useState(false)
  const colSpan = products.length + 2

  return (
    <>
      <tr className="congr-parent" onClick={() => setOpen(!open)}>
        <td className="congr-name">
          <span className="twisty" aria-hidden="true">{open ? '▼' : '▶'}</span>
          {row.congregacion}
          <span className="congr-sub">{row.colegios} colegios</span>
        </td>
        <td className="num congr-total">
          {formatCurrency(row.total)}
          <Change current={row.total} base={row.base_total} />
        </td>
        {products.map((slug) => {
          const value = row.productos?.[slug] ?? 0
          return (
            <td key={slug} className="num">
              {value ? formatCurrency(value) : <span className="zero">–</span>}
              {value ? <Change current={value} base={row.base_productos?.[slug] ?? 0} /> : null}
            </td>
          )
        })}
      </tr>
      {open && (
        <Colegios
          apiUrl={apiUrl}
          congregacion={row.congregacion}
          currentYear={currentYear}
          baseYear={baseYear}
          productsParam={productsParam}
          colSpan={colSpan}
        />
      )}
    </>
  )
}

export default CongregacionRow
