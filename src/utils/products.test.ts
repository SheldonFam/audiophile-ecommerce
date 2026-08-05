import { describe, expect, it } from 'vitest'
import rawProducts from '@/data/products.json'
import {
  CATEGORIES,
  getProduct,
  getProductsByCategory,
  isCategory,
  parseProducts,
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
    // A Set, because this case is about membership and the next one is about
    // order. Sorting the slugs here instead would have quietly made both cases
    // blind to the order.
    expect(
      new Set(getProductsByCategory('speakers').map((p) => p.slug)),
    ).toEqual(new Set(['zx7-speaker', 'zx9-speaker']))
  })

  it('partitions every product into exactly one category', () => {
    const grouped = CATEGORIES.flatMap(getProductsByCategory)

    expect(grouped).toHaveLength(6)
    expect(new Set(grouped.map((p) => p.slug)).size).toBe(6)
  })

  it('lists newest first, which is the order the category pages render', () => {
    expect(getProductsByCategory('headphones').map((p) => p.slug)).toEqual([
      'xx99-mark-two-headphones',
      'xx99-mark-one-headphones',
      'xx59-headphones',
    ])
    expect(getProductsByCategory('speakers').map((p) => p.slug)).toEqual([
      'zx9-speaker',
      'zx7-speaker',
    ])
  })
})

describe('image paths', () => {
  const product = getProduct('yx1-earphones')!

  it('are absolute, so they resolve from any address depth', () => {
    const everyPath = [
      ...Object.values(product.image),
      ...Object.values(product.categoryImage),
      ...product.gallery.flatMap((image) => Object.values(image)),
      ...product.others.flatMap((other) => Object.values(other.image)),
    ]

    expect(everyPath.length).toBeGreaterThan(0)
    for (const path of everyPath) {
      expect(path.startsWith('/assets/')).toBe(true)
    }
  })
})

describe('gallery', () => {
  it('is a list of three images rather than named slots', () => {
    const { gallery } = getProduct('yx1-earphones')!

    expect(Array.isArray(gallery)).toBe(true)
    expect(gallery).toHaveLength(3)
  })

  it('preserves the design order first, second, third', () => {
    const { gallery } = getProduct('yx1-earphones')!

    expect(gallery[0].desktop).toContain('gallery-1')
    expect(gallery[1].desktop).toContain('gallery-2')
    expect(gallery[2].desktop).toContain('gallery-3')
  })
})

describe('related products', () => {
  it('resolve to the canonical product, carrying category and price', () => {
    const [related] = getProduct('yx1-earphones')!.others
    const canonical = getProduct(related.slug)!

    expect(related.category).toBe(canonical.category)
    expect(related.price).toBe(canonical.price)
  })

  it('always resolve to a product that exists', () => {
    for (const product of CATEGORIES.flatMap(getProductsByCategory)) {
      for (const other of product.others) {
        expect(getProduct(other.slug)).toBeDefined()
      }
    }
  })
})

describe('features', () => {
  it('arrive as paragraphs rather than one block of prose', () => {
    expect(getProduct('yx1-earphones')!.features.length).toBeGreaterThan(1)
  })

  it('carry no leftover blank entries or surrounding whitespace', () => {
    for (const product of CATEGORIES.flatMap(getProductsByCategory)) {
      for (const paragraph of product.features) {
        expect(paragraph).toBe(paragraph.trim())
        expect(paragraph).not.toBe('')
      }
    }
  })

  it('lose no words to the split', () => {
    // Comparing against the source rather than spot-checking one phrase: an
    // assertion that the joined text contains some word still passes if a
    // whole paragraph is dropped.
    for (const raw of rawProducts) {
      const product = getProduct(raw.slug)!
      const wordsIn = (text: string) => text.split(/\s+/).filter(Boolean).length

      expect(product.features.reduce((n, p) => n + wordsIn(p), 0)).toBe(
        wordsIn(raw.features),
      )
    }
  })

  it('give every paragraph a distinct value, which the render relies on for keys', () => {
    for (const product of CATEGORIES.flatMap(getProductsByCategory)) {
      expect(new Set(product.features).size).toBe(product.features.length)
    }
  })
})

describe('includes', () => {
  it('names each item once per product, which the render relies on for keys', () => {
    for (const product of CATEGORIES.flatMap(getProductsByCategory)) {
      const names = product.includes.map((entry) => entry.item)

      expect(new Set(names).size).toBe(names.length)
    }
  })
})

describe('parseProducts', () => {
  const imageAt = (name: string) => ({
    mobile: `./assets/${name}.jpg`,
    tablet: `./assets/${name}.jpg`,
    desktop: `./assets/${name}.jpg`,
  })

  const valid = {
    id: 1,
    slug: 'a-product',
    name: 'A Product',
    image: {
      mobile: './assets/a.jpg',
      tablet: './assets/b.jpg',
      desktop: './assets/c.jpg',
    },
    category: 'speakers',
    categoryImage: {
      mobile: './assets/a.jpg',
      tablet: './assets/b.jpg',
      desktop: './assets/c.jpg',
    },
    new: false,
    price: 100,
    description: 'd',
    features: 'f',
    includes: [{ quantity: 1, item: 'thing' }],
    gallery: {
      first: imageAt('1'),
      second: imageAt('2'),
      third: imageAt('3'),
    },
    others: [],
  }

  it('accepts a well-formed record', () => {
    expect(() => parseProducts([valid])).not.toThrow()
  })

  it('names the offending field when a record is malformed', () => {
    const broken = { ...valid, price: 'free' }

    expect(() => parseProducts([broken])).toThrow(/price/)
  })

  it('rejects an unknown category rather than accepting it', () => {
    const broken = { ...valid, category: 'turntables' }

    expect(() => parseProducts([broken])).toThrow(/category/)
  })

  it('rejects a record missing a required field', () => {
    const { price: _price, ...missingPrice } = valid

    expect(() => parseProducts([missingPrice])).toThrow(/price/)
  })

  /**
   * A path is checked by resolving it the way a browser will, not by looking at
   * the characters it starts with. Each of these passes a `startsWith('/')`
   * test and none of them points at a file on this site.
   */
  it.each([
    ['a page-relative path', 'assets/no-leading-slash.jpg'],
    ['a protocol-relative URL', '//evil.example/x.jpg'],
    ['a backslash the URL parser reads as a slash', '/\\evil.example/x.jpg'],
    ['an absolute URL to another origin', 'https://evil.example/x.jpg'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['a data: URL', 'data:image/png;base64,AAAA'],
    ['a path that climbs out of assets', '/assets/../../etc/passwd'],
    ['a path somewhere else on this site', '/not-assets/x.jpg'],
    // The check resolves against placeholder origins to decide where a path
    // points. Naming one of those origins in the data would pass a check that
    // used only one of them, while the browser — resolving against the real
    // site — fetched from somewhere else entirely.
    ['the origin the check resolves against', '//first.invalid/assets/x.jpg'],
    ['the second such origin', '//second.invalid/assets/x.jpg'],
    ['the assets directory rather than a file in it', '/assets/'],
    ['a directory that merely starts the same way', '/assetsfoo/x.jpg'],
    // Resolution leaves percent-encoding alone, so this stays under /assets
    // until something downstream decodes it.
    ['traversal hidden in percent-encoding', '/assets/..%2f..%2fetc/passwd'],
    ['a comma, which srcset would read as a separator', '/assets/a.jpg,/b.jpg'],
  ])('rejects %s', (_name, path) => {
    const broken = { ...valid, image: { ...valid.image, desktop: path } }

    expect(() => parseProducts([broken])).toThrow(/does not resolve/)
  })

  it('falls back to the position in the file when the slug is what is wrong', () => {
    // Nothing else can name the record: the slug is the label, and here it is
    // the field that failed.
    const { slug: _slug, ...noSlug } = valid

    expect(() => parseProducts([noSlug])).toThrow(/0\.slug/)
  })

  it('names the product and the offending path when it rejects one', () => {
    const broken = {
      ...valid,
      image: { ...valid.image, desktop: '//evil.example/x.jpg' },
    }

    expect(() => parseProducts([broken])).toThrow(
      /a-product\.image\.desktop.*evil\.example/s,
    )
  })

  it('keeps a path that stays inside assets after resolving', () => {
    const winding = {
      ...valid,
      image: { ...valid.image, desktop: '/assets/one/../two.jpg' },
    }

    // Stored as what a browser would actually request, so the manifest lookup
    // and the rendered src agree.
    expect(parseProducts([winding])[0].image.desktop).toBe('/assets/two.jpg')
  })

  it('rejects a related product that does not exist, naming both', () => {
    const dangling = {
      ...valid,
      others: [{ slug: 'ghost-product', name: 'Ghost', image: valid.image }],
    }

    expect(() => parseProducts([dangling])).toThrow(
      /a-product\.others.*ghost-product/s,
    )
  })
})
