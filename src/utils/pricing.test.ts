import { describe, expect, it } from 'vitest'
import { formatPrice } from './pricing'

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
