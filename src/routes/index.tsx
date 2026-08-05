import { createFileRoute } from '@tanstack/react-router'
import { BestGear } from '@/components/BestGear'
import { ButtonLink } from '@/components/Button'
import { CategoryCards } from '@/components/CategoryCards'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { splitBeforeLastWord } from '@/utils/productName'
import { getProduct } from '@/utils/products'
import type { ImageSource } from '@/utils/products'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Audiophile — High-end audio gear' }],
  }),
  // The hero photograph runs behind the navigation in the design, so this page
  // supplies the backdrop the header would otherwise paint for itself.
  staticData: { headerOverContent: true },
  component: Home,
})

/**
 * Resolved at module load, so a slug that does not name a product fails the
 * build rather than shipping a link to nowhere. Nothing else checked these:
 * the prerender crawler would follow a wrong slug to a not-found page without
 * complaining.
 */
function featured(slug: string) {
  const product = getProduct(slug)
  if (!product)
    throw new Error(`home page references unknown product "${slug}"`)
  return product
}

const HERO_PRODUCT = featured('xx99-mark-two-headphones')
const ZX9_PRODUCT = featured('zx9-speaker')
const ZX7_PRODUCT = featured('zx7-speaker')
const YX1_PRODUCT = featured('yx1-earphones')

const HERO: ImageSource = {
  // The desktop file is `image-hero`; the other two are `image-header`.
  mobile: '/assets/home/mobile/image-header.jpg',
  tablet: '/assets/home/tablet/image-header.jpg',
  desktop: '/assets/home/desktop/image-hero.jpg',
}

const ZX9: ImageSource = {
  mobile: '/assets/home/mobile/image-speaker-zx9.png',
  tablet: '/assets/home/tablet/image-speaker-zx9.png',
  desktop: '/assets/home/desktop/image-speaker-zx9.png',
}

const ZX7: ImageSource = {
  mobile: '/assets/home/mobile/image-speaker-zx7.jpg',
  tablet: '/assets/home/tablet/image-speaker-zx7.jpg',
  desktop: '/assets/home/desktop/image-speaker-zx7.jpg',
}

const YX1: ImageSource = {
  mobile: '/assets/home/mobile/image-earphones-yx1.jpg',
  tablet: '/assets/home/tablet/image-earphones-yx1.jpg',
  desktop: '/assets/home/desktop/image-earphones-yx1.jpg',
}

/**
 * The landing page.
 *
 * Three of the four headings are the products' own names, read from the
 * catalogue so they cannot drift from the pages they link to. The fourth is
 * not: the design titles that panel "YX1 Earphones" where the product is "YX1
 * Wireless Earphones", the same kind of short display label ADR 0005 already
 * records for the related-product cards. The body copy is the page's own —
 * none of it appears in the catalogue.
 *
 * `CategoryCards` carries the three category links the prerender crawler needs
 * to reach every address from here.
 */
function Home() {
  const hero = splitBeforeLastWord(HERO_PRODUCT.name)
  const zx9 = splitBeforeLastWord(ZX9_PRODUCT.name)

  return (
    <main>
      {/* The header is absolute over this section, so the photograph starts at
          the top of the page and the copy is pushed clear of the navigation. */}
      <section className="relative h-150 overflow-hidden bg-black text-white md:h-182.25">
        <ResponsiveImage
          image={HERO}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="max-w-content relative mx-auto px-6 pt-49.5 text-center md:px-10 md:pt-54 xl:px-0 xl:pt-56.25 xl:text-left">
          <div className="mx-auto max-w-82 md:max-w-99 xl:mx-0 xl:max-w-99.5">
            {/* 50% over the hero's dark strip measures 5.08, so it clears AA
                without the lift ADR 0009 gives muted text on white. */}
            <p className="text-overline mb-4 text-white/50 md:mb-6">
              New Product
            </p>

            <h1 id="hero-name" className="text-h1-mobile md:text-h1">
              {hero.lead}
              <span className="block">{hero.lastWord}</span>
            </h1>

            <p className="text-body mt-6 text-white/75 md:max-w-87.25">
              Experience natural, lifelike audio and exceptional build quality
              made for the passionate music enthusiast.
            </p>

            {/* Four links on this page read "See Product". Each composes its
                name from its own text and then its section's heading, as the
                catalogue routes do. */}
            <ButtonLink
              surface="dark"
              to="/product/$slug"
              params={{ slug: HERO_PRODUCT.slug }}
              id="hero-cta"
              aria-labelledby="hero-cta hero-name"
              className="mt-7 md:mt-10"
            >
              See Product
            </ButtonLink>
          </div>
        </div>
      </section>

      <div className="max-w-content mx-auto px-6 pb-30 md:px-10 xl:px-0 xl:pb-50">
        {/* The thumbnails overhang each card's top by 52px on phone and tablet
            and 80px on desktop, so these margins are the design's gaps plus
            that overhang. */}
        <div className="mt-23 md:mt-37 xl:mt-50">
          <CategoryCards />
        </div>

        {/* ZX9 — the one panel with its own colour, its own button, and a
            decorative backdrop that runs past its own edges. */}
        <section className="bg-orange relative mt-30 overflow-hidden rounded-lg text-center text-white md:mt-24 xl:mt-42 xl:h-140 xl:text-left">
          {/* Three concentric rings, centred behind the speaker and clipped by
              the panel. Decorative, so it is hidden rather than described. */}
          <img
            src="/assets/home/desktop/pattern-circles.svg"
            alt=""
            className="pointer-events-none absolute -top-30.25 -left-29 w-139.5 max-w-none md:-top-72 md:-left-31.75 md:w-236 xl:-top-9 xl:-left-37.25"
          />

          <div className="relative flex flex-col items-center px-6 pt-13.75 pb-14.5 md:px-10 md:pt-13 md:pb-16 xl:h-full xl:flex-row xl:items-end xl:gap-34.75 xl:px-0 xl:pt-24 xl:pb-0">
            <ResponsiveImage
              image={ZX9}
              alt=""
              loading="lazy"
              className="w-43 md:w-49.25 xl:ml-29.25 xl:w-102.5"
            />

            <div className="mt-8 md:mt-16 xl:mt-0 xl:mb-31 xl:max-w-87.25">
              <h2 id="zx9-name" className="text-h1-mobile md:text-h1">
                {zx9.lead}
                <span className="block">{zx9.lastWord}</span>
              </h2>

              <p className="text-body mx-auto mt-6 max-w-70 text-white/75 md:max-w-87.25">
                Upgrade to premium speakers that are phenomenally built to
                deliver truly remarkable sound.
              </p>

              <ButtonLink
                variant="inverse"
                to="/product/$slug"
                params={{ slug: ZX9_PRODUCT.slug }}
                id="zx9-cta"
                aria-labelledby="zx9-cta zx9-name"
                className="mt-6 md:mt-10"
              >
                See Product
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* ZX7 — the copy sits over the photograph rather than beside it. */}
        <section className="relative mt-6 overflow-hidden rounded-lg md:mt-8 xl:mt-12">
          <ResponsiveImage
            image={ZX7}
            alt=""
            loading="lazy"
            className="h-80 w-full object-cover"
          />

          <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-15.5 xl:px-23.75">
            <h2 id="zx7-name" className="text-h4">
              {ZX7_PRODUCT.name}
            </h2>
            <ButtonLink
              variant="secondary"
              to="/product/$slug"
              params={{ slug: ZX7_PRODUCT.slug }}
              id="zx7-cta"
              aria-labelledby="zx7-cta zx7-name"
              className="mt-8"
            >
              See Product
            </ButtonLink>
          </div>
        </section>

        {/* YX1 — a photograph and a panel of equal width, side by side from
            tablet up. */}
        <section className="mt-6 grid gap-6 md:mt-8 md:grid-cols-2 md:gap-2.75 xl:mt-12 xl:gap-7.5">
          <ResponsiveImage
            image={YX1}
            alt=""
            loading="lazy"
            className="h-50 w-full rounded-lg object-cover md:h-80"
          />

          <div className="bg-grey flex h-50 flex-col items-start justify-center rounded-lg px-6 md:h-80 md:px-10 xl:px-23.75">
            {/* The design's own short label, not the catalogue's "YX1 Wireless
                Earphones" — the same distinction ADR 0005 records for cards. */}
            <h2 id="yx1-name" className="text-h4">
              YX1 Earphones
            </h2>
            <ButtonLink
              variant="secondary"
              to="/product/$slug"
              params={{ slug: YX1_PRODUCT.slug }}
              id="yx1-cta"
              aria-labelledby="yx1-cta yx1-name"
              className="mt-8"
            >
              See Product
            </ButtonLink>
          </div>
        </section>

        <div className="mt-30 md:mt-24 xl:mt-50">
          <BestGear />
        </div>
      </div>
    </main>
  )
}
