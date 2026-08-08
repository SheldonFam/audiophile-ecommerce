import { describe, expect, it } from 'vitest'
import { calculateTotals, formatPrice } from './pricing'

/**
 * Prices are the one number a visitor reads and acts on, and the design is
 * specific about how they look: a dollar sign, a space, and thousands grouped.
 */
describe('formatPrice', () => {
  it.each([
    [599, '$ 599'],
    [899, '$ 899'],
    [1750, '$ 1,750'],
    [2999, '$ 2,999'],
    [4500, '$ 4,500'],
  ])('formats %i as %s', (amount, expected) => {
    expect(formatPrice(amount)).toBe(expected)
  })

  it('groups thousands so a large total stays readable', () => {
    expect(formatPrice(5446)).toBe('$ 5,446')
  })

  it('shows no decimal part, because the catalogue has none', () => {
    expect(formatPrice(100)).toBe('$ 100')
  })
})

/**
 * The reference order from the design and from `CODING_STANDARDS.md`, which
 * exists because the arithmetic is easy to get wrong in a way nobody notices:
 * every figure looks plausible whether or not the tax was added.
 */
const REFERENCE = [
  { price: 2999, quantity: 1 },
  { price: 899, quantity: 2 },
  { price: 599, quantity: 1 },
]

describe('calculateTotals', () => {
  it('gives the four figures the design shows', () => {
    expect(calculateTotals(REFERENCE)).toEqual({
      total: 5396,
      shipping: 50,
      vat: 1079,
      grandTotal: 5446,
    })
  })

  it('leaves the tax out of the grand total', () => {
    const { total, shipping, vat, grandTotal } = calculateTotals(REFERENCE)

    // The design labels the row "(INCLUDED)". Adding it is the trap, and it
    // would give 6,525 — a number that looks entirely reasonable.
    expect(grandTotal).toBe(total + shipping)
    expect(grandTotal).not.toBe(total + shipping + vat)
  })

  it('multiplies each price by its quantity', () => {
    expect(calculateTotals([{ price: 100, quantity: 3 }]).total).toBe(300)
  })

  it('charges shipping once however much is being bought', () => {
    const one = calculateTotals([{ price: 100, quantity: 1 }])
    const many = calculateTotals([
      { price: 100, quantity: 9 },
      { price: 250, quantity: 4 },
    ])

    expect(one.shipping).toBe(50)
    expect(many.shipping).toBe(50)
  })

  it('charges nothing at all for an empty order', () => {
    // Not 50. Shipping nothing costs nothing, and a caller should not have to
    // special-case the empty cart to avoid quoting a delivery fee for it.
    expect(calculateTotals([])).toEqual({
      total: 0,
      shipping: 0,
      vat: 0,
      grandTotal: 0,
    })
  })

  it('charges shipping for an order that has something in it, whatever it costs', () => {
    // The rule is "nothing to send, nothing to charge" rather than "no money,
    // no charge" — the two agree for this catalogue and are not the same rule.
    expect(calculateTotals([{ price: 0, quantity: 1 }]).shipping).toBe(50)
  })

  it('rounds the tax to whole dollars', () => {
    // 5396 x 0.2 is 1079.2, and the design shows 1,079.
    expect(calculateTotals(REFERENCE).vat).toBe(1079)
    expect(calculateTotals([{ price: 3, quantity: 1 }]).vat).toBe(1)
  })

  it('works on prices that are in no catalogue, so it cannot be looking one up', () => {
    // Purity is the point of this seam: a server has to be able to import it
    // and hand it its own prices.
    expect(calculateTotals([{ price: 7, quantity: 2 }])).toEqual({
      total: 14,
      shipping: 50,
      vat: 3,
      grandTotal: 64,
    })
  })

  it('formats through the one formatter, giving the strings on the page', () => {
    const { total, shipping, vat, grandTotal } = calculateTotals(REFERENCE)

    expect([total, shipping, vat, grandTotal].map(formatPrice)).toEqual([
      '$ 5,396',
      '$ 50',
      '$ 1,079',
      '$ 5,446',
    ])
  })
})
