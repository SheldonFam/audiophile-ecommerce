import { getProduct } from './products'

/**
 * How a product is written and pictured inside the cart.
 *
 * Neither of these is in the catalogue. The design calls the product
 * "XX99 MK II" where the catalogue says "XX99 Mark II Headphones", and the
 * pictures come from `/assets/cart/`, which `products.json` never references.
 * So the cart carries its own map, the way the category cards carry their own
 * thumbnails.
 *
 * The design only ever draws a cart holding three products, so three of these
 * labels are read from it and three follow its evident rule: the model
 * designation alone, with "Mark" shortened to "MK". They are marked below.
 */
const LABELS: Record<string, string> = {
  // From the design.
  'xx99-mark-two-headphones': 'XX99 MK II',
  'xx59-headphones': 'XX59',
  'yx1-earphones': 'YX1',
  // Following its rule; the design never shows these three in a cart.
  'xx99-mark-one-headphones': 'XX99 MK I',
  'zx9-speaker': 'ZX9',
  'zx7-speaker': 'ZX7',
}

export type CartDisplay = { label: string; thumbnail: string }

/**
 * Returns nothing for a product the catalogue does not have, so a caller can
 * skip the line rather than draw a blank one. The cart's own parser already
 * removes those on read; this is what makes the type say so.
 */
export function cartDisplay(slug: string): CartDisplay | undefined {
  if (!getProduct(slug) || !LABELS[slug]) return undefined

  return {
    label: LABELS[slug],
    thumbnail: `/assets/cart/image-${slug}.jpg`,
  }
}
