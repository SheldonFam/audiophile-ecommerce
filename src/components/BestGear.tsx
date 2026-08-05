import { ResponsiveImage } from './ResponsiveImage'
import type { ImageSource } from '@/utils/products'

/**
 * The "Bringing you the best audio gear" section, which closes nearly every
 * page.
 *
 * Its image is the clearest case for art direction on the site: near-square on
 * a phone, a wide banner on a tablet, portrait on a desktop — and the desktop
 * file is the smallest of the three, because desktop places it in a column
 * rather than full width.
 *
 * The heading is one sentence with a coloured word inside it, so the emphasis
 * is markup within the heading rather than three separate elements. The colour
 * carries no information the sentence lacks, so 1.4.1 does not apply — but it
 * clears contrast only as large text, so it must not be reused in body copy.
 *
 * Renders an h2, so it expects a page that owns the h1.
 */
const IMAGE: ImageSource = {
  mobile: '/assets/shared/mobile/image-best-gear.jpg',
  tablet: '/assets/shared/tablet/image-best-gear.jpg',
  desktop: '/assets/shared/desktop/image-best-gear.jpg',
}

export function BestGear() {
  return (
    <section className="flex flex-col items-center gap-10 xl:flex-row-reverse xl:gap-32">
      <ResponsiveImage
        image={IMAGE}
        alt=""
        loading="lazy"
        className="w-full rounded-lg object-cover xl:w-1/2"
      />
      {/* Constrained while stacked so the prose does not run the full width of
          the page; the desktop column supplies its own limit. */}
      <div className="flex max-w-2xl flex-col items-center text-center xl:max-w-none xl:items-start xl:text-left">
        <h2 className="text-h4 md:text-h2">
          Bringing you the <span className="text-orange">best</span> audio gear
        </h2>
        <p className="text-body mt-8 text-black/60">
          Located at the heart of New York City, Audiophile is the premier store
          for high end headphones, earphones, speakers, and audio accessories.
          We have a large showroom and luxury demonstration rooms available for
          you to browse and experience a wide range of our products. Stop by our
          store to meet some of the fantastic people who make Audiophile the
          best place to buy your portable audio equipment.
        </p>
      </div>
    </section>
  )
}
