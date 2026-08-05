import raw from '@/data/products.json'

/**
 * Product access for routing.
 *
 * ADR 0005 decides that this module parses the challenge JSON through a schema
 * once at load and hands out normalised products. Ticket 02 builds that. Until
 * then this reads the JSON directly and returns only the two fields routing
 * needs.
 *
 * The accessor names are the ones ADR 0005 specifies, so ticket 02 widens what
 * they return rather than renaming them, and callers stay put.
 */
export const CATEGORIES = ['headphones', 'speakers', 'earphones'] as const

export type Category = (typeof CATEGORIES)[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as ReadonlyArray<string>).includes(value)
}

type ProductSummary = {
  slug: string
  name: string
}

export function getProduct(slug: string): ProductSummary | undefined {
  return raw.find((product) => product.slug === slug)
}

export function getProductsByCategory(
  category: Category,
): Array<ProductSummary> {
  return raw.filter((product) => product.category === category)
}
