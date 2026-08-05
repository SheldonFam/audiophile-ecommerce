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
 * Two placeholder origins to resolve against. Nothing is fetched from either;
 * they exist so a path can be asked where it points.
 *
 * There are two of them because one is not enough. A path that names its own
 * host resolves to that host whatever base it is given, so a single sentinel
 * could be spelled out in the data — `//first.invalid/assets/x.jpg` — and pass
 * its own check, while the browser, resolving against the real site, fetched
 * from somewhere else entirely. A genuinely site-relative path follows
 * whichever base it is handed; one carrying its own authority does not.
 * Comparing the two resolutions is what tells them apart.
 *
 * Both bases carry a path segment on purpose: that is what makes a
 * page-relative path like `assets/x.jpg` resolve to `/somewhere/assets/x.jpg`
 * and be rejected. Against a bare origin it would look like `/assets/x.jpg` and
 * seem fine, while in the browser it would mean something different on every
 * page — the bug ADR 0005 exists to prevent.
 *
 * `.invalid` is reserved by RFC 2606 and can never be registered.
 */
const ASSET_BASES = [
  { origin: 'https://first.invalid', base: 'https://first.invalid/somewhere/' },
  {
    origin: 'https://second.invalid',
    base: 'https://second.invalid/elsewhere/',
  },
] as const

/**
 * What an asset path may be made of, after resolving.
 *
 * Resolution alone is not quite enough. The URL parser leaves percent-encoding
 * intact, so `/assets/..%2f..%2fetc/passwd` resolves to itself and stays under
 * `/assets/` — until something downstream decodes it. Naming the characters an
 * asset may contain closes that, and rules out commas and quotes at the same
 * time. Every file the challenge ships is well within it.
 */
const ASSET_PATH = /^\/assets\/[A-Za-z0-9._~/-]+$/

/**
 * Resolves a path the way a browser would, and returns it only if it names a
 * file inside this site's own assets.
 *
 * Checking the characters a path starts with is not the same question.
 * `//evil.example/x.jpg` starts with a slash and is a protocol-relative URL to
 * another host; `/\evil.example/x.jpg` is parsed identically, because the URL
 * standard treats a backslash as a slash. `/assets/../../etc/passwd` starts
 * with `/assets/` and does not stay there. Only resolution answers all of them,
 * and it answers them the way the browser will.
 */
function resolveInsideAssets(path: string): string | undefined {
  let resolved
  try {
    resolved = ASSET_BASES.map(({ origin, base }) => ({
      origin,
      url: new URL(path, base),
    }))
  } catch {
    return undefined
  }

  const [first, second] = resolved
  if (first.url.origin !== first.origin) return undefined
  if (second.url.origin !== second.origin) return undefined
  if (first.url.pathname !== second.url.pathname) return undefined

  const { pathname } = first.url
  if (!ASSET_PATH.test(pathname)) return undefined

  // The resolved form, so what is stored is what a browser would request.
  return pathname
}

const AssetPath = z
  .string()
  .transform((path) => path.replace(/^\.\//, '/'))
  .transform((path, ctx) => {
    const resolved = resolveInsideAssets(path)

    if (resolved === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `"${path}" does not resolve to a file under /assets on this site`,
      })
      return z.NEVER
    }

    return resolved
  })

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
 * Names the record by its slug rather than by its position in the file, so a
 * failure says which product is wrong instead of asking the reader to count.
 * Falls back to the index when the slug is not itself readable — which is the
 * case when the slug is the thing that failed.
 */
function slugAt(source: unknown, index: number): string | undefined {
  if (!Array.isArray(source)) return undefined

  const slug: unknown = (source[index] as { slug?: unknown } | undefined)?.slug
  return typeof slug === 'string' && slug ? slug : undefined
}

function issueLabel(source: unknown, path: ReadonlyArray<PropertyKey>): string {
  const [index, ...rest] = path
  if (typeof index !== 'number') return path.join('.')

  return [slugAt(source, index) ?? String(index), ...rest].join('.')
}

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
        .map((issue) => `  ${issueLabel(source, issue.path)}: ${issue.message}`)
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
