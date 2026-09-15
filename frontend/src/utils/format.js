export const formatCurrency = (value) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)

/**
 * A percentage is only meaningful against a real positive base.
 *
 * Credit notes make some bases negative, and a tiny base turns a trivial
 * movement into a four-digit percentage - an early build showed -976,7% for a
 * congregation whose prior-year total was a handful of euros. Those cases
 * report the change in euros, or "nuevo", instead of a ratio.
 */
const MIN_BASE = 500

export function getChange(current, base) {
  if (base <= 0) return current > 0 ? { kind: 'new' } : null
  if (base < MIN_BASE) return { kind: 'abs', diff: current - base }
  return { kind: 'pct', pct: ((current - base) / base) * 100 }
}
