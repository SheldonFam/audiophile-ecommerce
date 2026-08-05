import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  getProduct,
  getProductsByCategory,
  isCategory,
} from './products'

describe('isCategory', () => {
  it.each(CATEGORIES)('accepts %s', (category) => {
    expect(isCategory(category)).toBe(true)
  })

  it.each(['banana', 'Headphones', '', 'headphone'])('rejects %j', (value) => {
    expect(isCategory(value)).toBe(false)
  })
})

describe('getProduct', () => {
  it('finds a product by slug', () => {
    expect(getProduct('yx1-earphones')?.name).toBe('YX1 Wireless Earphones')
  })

  it.each(['not-a-product', 'YX1-EARPHONES', ''])(
    'returns nothing for %j',
    (slug) => {
      expect(getProduct(slug)).toBeUndefined()
    },
  )
})

describe('getProductsByCategory', () => {
  it('returns only products belonging to the category', () => {
    expect(
      getProductsByCategory('speakers')
        .map((p) => p.slug)
        .sort(),
    ).toEqual(['zx7-speaker', 'zx9-speaker'])
  })

  it('partitions every product into exactly one category', () => {
    const grouped = CATEGORIES.flatMap(getProductsByCategory)

    expect(grouped).toHaveLength(6)
    expect(new Set(grouped.map((p) => p.slug)).size).toBe(6)
  })
})
