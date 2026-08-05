import { describe, expect, it } from 'vitest'
import products from '@/data/products.json'
import { splitBeforeLastWord } from './productName'

describe('splitBeforeLastWord', () => {
  it.each([
    ['XX99 Mark II Headphones', 'XX99 Mark II ', 'Headphones'],
    ['YX1 Wireless Earphones', 'YX1 Wireless ', 'Earphones'],
    ['ZX9 Speaker', 'ZX9 ', 'Speaker'],
  ])('splits %s before its last word', (name, lead, lastWord) => {
    expect(splitBeforeLastWord(name)).toEqual({ lead, lastWord })
  })

  it('leaves a single-word name whole, with nothing before it', () => {
    expect(splitBeforeLastWord('ZX9')).toEqual({ lead: '', lastWord: 'ZX9' })
  })

  /**
   * The parts are rendered adjacently, and the element's text is what the
   * "See Product" links build their accessible name from. Losing the space
   * would turn that into "XX99 Mark IIHeadphones" without changing anything
   * visible — the same failure the in-the-box list hit with sibling spans.
   */
  it('loses nothing when the parts are put back together', () => {
    for (const { name } of products) {
      const { lead, lastWord } = splitBeforeLastWord(name)
      expect(lead + lastWord).toBe(name)
    }
  })

  it('puts a real word on the last line for every product in the catalogue', () => {
    for (const { name } of products) {
      const { lastWord } = splitBeforeLastWord(name)
      expect(lastWord).not.toBe('')
      expect(lastWord).not.toContain(' ')
    }
  })
})
