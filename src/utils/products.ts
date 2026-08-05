import { z } from 'zod'
import raw from '@/data/products.json'

/**
 * The single trusted way to read product data (ADR 0005).
 *
 * The challenge JSON has four shapes that are hostile to direct use, all
 * resolved here once rather than at every call site:
 *
 *   - image paths are relative (`./assets/…`), which resolves against the
 *     current address and so breaks on nested routes
 *   - `gallery` is an object of named slots rather than something iterable
 *   - `others` embeds partial copies of products, missing category and price
 *   - `features` is one string with blank lines standing in for paragraphs
 *
 * Parsing runs once at module load. Because content routes are prerendered,
 * that happens during the build and costs nothing at page load.
 */
export const CATEGORIES = ['headphones', 'speakers', 'earphones'] as const

export type Category = (typeof CATEGORIES)[number]

export function isCategory(value: string): value is Category {
  return (CATEGORIES as ReadonlyArray<string>).includes(value)
}

/**
 * Paths arrive relative to the JSON; the app serves them from the web root.
 * The refine is the point: rewriting `./` alone would let a path written
 * without it through unchanged, still relative, and it would 404 only on
 * nested addresses.
 */
const AssetPath = z
  .string()
  .transform((path) => path.replace(/^\.\//, '/'))
  .refine(
    (path) => path.startsWith('/'),
    'asset path must resolve from the web root',
  )

/** The three crops every image in the challenge ships as. */
const ImageSource = z.object({
  mobile: AssetPath,
  tablet: AssetPath,
  desktop: AssetPath,
})

export type ImageSource = z.infer<typeof ImageSource>

/** A product as it appears in the JSON, with per-field normalisation applied. */
const ParsedProduct = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  image: ImageSource,
  category: z.enum(CATEGORIES),
  categoryImage: ImageSource,
  new: z.boolean(),
  price: z.number(),
  description: z.string(),
  // Prose with blank lines between paragraphs in the source. Split here so no
  // component has to parse text, and the whole text survives the split.
  features: z.string().transform((text) =>
    text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
  ),
  includes: z.array(z.object({ quantity: z.number(), item: z.string() })),
  // Named slots in the source; an ordered list is what the design renders.
  gallery: z
    .object({
      first: ImageSource,
      second: ImageSource,
      third: ImageSource,
    })
    // `as const` so the type carries the arity too: the design places three
    // images in three specific positions, and a plain array would let a
    // fourth slot type-check into a layout that has nowhere to put it.
    .transform(({ first, second, third }) => [first, second, third] as const),
  others: z.array(
    z.object({ slug: z.string(), name: z.string(), image: ImageSource }),
  ),
})

/**
 * A related product, widened with the category and price its source copy omits.
 *
 * `name` is deliberately the source's short label — the design's related-product
 * cards read "XX99 Mark I" where the canonical name is "XX99 Mark I Headphones".
 * ADR 0005 speaks of names not drifting; this is a display distinction the
 * design makes, not drift.
 */
const RelatedProduct = z.object({
  slug: z.string(),
  name: z.string(),
  image: ImageSource,
  category: z.enum(CATEGORIES),
  price: z.number(),
})

const Product = ParsedProduct.omit({ others: true }).extend({
  others: z.array(RelatedProduct),
})

export type RelatedProduct = z.infer<typeof RelatedProduct>
export type Product = z.infer<typeof Product>

/**
 * Validates and normalises. Exported so the failure path is testable: a
 * malformed record must fail loudly, naming the product and field, rather than
 * yielding a partial product.
 */
export function parseProducts(source: unknown): Array<Product> {
  const result = z.array(ParsedProduct).safeParse(source)

  if (!result.success) {
    throw new Error(
      `products.json is malformed:\n${result.error.issues
        .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
        .join('\n')}`,
    )
  }

  const bySlug = new Map(result.data.map((product) => [product.slug, product]))

  return result.data.map((product) => ({
    ...product,
    others: product.others.map((other) => {
      const canonical = bySlug.get(other.slug)
      if (!canonical) {
        throw new Error(
          `products.json is malformed:\n  ${product.slug}.others: references unknown product "${other.slug}"`,
        )
      }
      return { ...other, category: canonical.category, price: canonical.price }
    }),
  }))
}

const products = parseProducts(raw)

const productsBySlug = new Map(
  products.map((product) => [product.slug, product]),
)

export function getProduct(slug: string): Product | undefined {
  return productsBySlug.get(slug)
}

/**
 * Newest first, which the design uses on every category page: headphones leads
 * with XX99 Mark II and speakers with ZX9, both the reverse of the file's order.
 * `id` is the catalogue's own sequence, so descending `id` is what "newest"
 * means here — there is no date in the data to sort on.
 *
 * Sorted here rather than in the route so every listing agrees, and so a
 * component never has to know the ordering rule. Sorting in place is safe:
 * `filter` has already returned a new array, so the module's own is untouched.
 */
export function getProductsByCategory(category: Category): Array<Product> {
  return products
    .filter((product) => product.category === category)
    .sort((a, b) => b.id - a.id)
}
