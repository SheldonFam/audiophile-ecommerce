import { describe, expect, it } from 'vitest'
import products from '@/data/products.json'
import { cartDisplay } from './cartDisplay'

describe('cartDisplay', () => {
  it('has a label and a picture for every product in the catalogue', () => {
    // A product with no entry would render a blank row, and the design only
    // ever shows three of the six — so the other three are inferences that
    // nothing else would catch going missing.
    for (const { slug } of products) {
      expect(cartDisplay(slug), slug).toBeDefined()
    }
  })

  it('uses the short labels the design writes, not the catalogue names', () => {
    expect(cartDisplay('xx99-mark-two-headphones')?.label).toBe('XX99 MK II')
    expect(cartDisplay('xx59-headphones')?.label).toBe('XX59')
    expect(cartDisplay('yx1-earphones')?.label).toBe('YX1')
  })

  it('points at a picture that ships', async () => {
    const { existsSync } = await import('node:fs')

    for (const { slug } of products) {
      const path = `public${cartDisplay(slug)!.thumbnail}`
      expect(existsSync(path), path).toBe(true)
    }
  })

  it('returns nothing for a product the catalogue does not have', () => {
    expect(cartDisplay('discontinued-product')).toBeUndefined()
  })
})
