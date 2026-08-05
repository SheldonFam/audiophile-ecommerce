/**
 * Money formatting for the catalogue.
 *
 * This module is Seam 1 from ADR 0001: if the project later grows a server,
 * `calculateTotals` lands here and the server imports the same function, so
 * the price a visitor sees and the price they are charged cannot disagree.
 *
 * Prices in the catalogue are whole dollars, so nothing here handles cents.
 */
const format = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

/** `2999` becomes `$ 2,999` — the spacing after the sign is the design's. */
export function formatPrice(amount: number): string {
  return `$ ${format.format(amount)}`
}
