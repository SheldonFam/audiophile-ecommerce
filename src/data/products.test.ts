import { describe, expect, it } from 'vitest'
import products from './products.json'

// Smoke test for the Phase 0 toolchain: proves the runner, the jsdom
// environment and JSON module resolution all work end to end.
describe('products.json', () => {
  it('contains the six catalogue products', () => {
    expect(products).toHaveLength(6)
  })

  it('gives every product a unique slug', () => {
    const slugs = products.map((product) => product.slug)
    expect(new Set(slugs).size).toBe(products.length)
  })
})
