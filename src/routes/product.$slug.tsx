import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { BestGear } from '@/components/BestGear'
import { Button, ButtonLink } from '@/components/Button'
import { CategoryCards } from '@/components/CategoryCards'
import { QuantityStepper } from '@/components/QuantityStepper'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { formatPrice } from '@/utils/pricing'
import { splitBeforeLastWord } from '@/utils/productName'
import { getProduct } from '@/utils/products'

export const Route = createFileRoute('/product/$slug')({
  loader: ({ params }) => {
    const product = getProduct(params.slug)
    if (!product) throw notFound()
    return product
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.name ?? 'Product'} — Audiophile` }],
  }),
  // Product to product is a param change on one route, so by default the
  // component is reused and its state survives — a quantity of 5 chosen for one
  // product would carry into the next. Nothing made that reachable until the
  // related-product cards did. Keying on the slug makes each product a fresh
  // page, which is what following a link to a different product means.
  remountDeps: ({ params }) => params.slug,
  component: ProductPage,
})

/**
 * The top of the product page: what this is and what it costs.
 *
 * The quantity lives here rather than in the stepper, because the next feature
 * reads it when wiring add-to-cart. Add-to-cart itself renders but does nothing
 * — no cart exists yet.
 *
 * Every image below sizes itself from its own crop: each shipped file's aspect
 * ratio matches its box in the design exactly (the mobile gallery crop is
 * 654x348 and the design box 327x174 — both 1.879), so `w-full` lands the right
 * height without a single fixed dimension. The one exception is the gallery's
 * stacked pair, for the reason set out above it.
 */
function ProductPage() {
  const product = Route.useLoaderData()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [stackedTop, stackedBottom, tall] = product.gallery
  const { lead, lastWord } = splitBeforeLastWord(product.name)

  return (
    <main className="max-w-content mx-auto px-6 pt-4 pb-30 md:px-10 md:pt-8 xl:px-0 xl:pt-20 xl:pb-40">
      <button
        type="button"
        onClick={() => {
          // canGoBack is false on a direct arrival — these pages are
          // prerendered for indexing, so that is a normal way to land here.
          // Falling back to the category keeps the control meaningful instead
          // of doing nothing or ejecting the visitor off-site.
          if (router.history.canGoBack()) router.history.back()
          else
            void router.navigate({
              to: '/category/$category',
              params: { category: product.category },
            })
        }}
        className="text-body focus-ring hover:text-orange-text text-black/60 transition-colors"
      >
        Go Back
      </button>

      {/* Grid rather than flex with w-1/2: percentage widths do not subtract the
          gap, so two halves plus a gap overflow the container. */}
      <div className="mt-6 grid gap-8 md:mt-8 md:grid-cols-2 md:items-center md:gap-17 xl:gap-31">
        {/* The page's LCP element, and the only image above the fold. */}
        <ResponsiveImage
          image={product.image}
          alt=""
          fetchPriority="high"
          className="w-full rounded-lg"
        />

        <div>
          {product.new && (
            <p className="text-overline text-orange-text">New Product</p>
          )}

          {/* The design sets a product name with its last word on its own
              line here too. At this column the short names — XX59, ZX7, ZX9 —
              fit on one, so wrapping alone would leave three of the six a line
              short. Same rule as the listing, stated once. */}
          <h1 className="text-h4 xl:text-h2 mt-6">
            {lead}
            <span className="block">{lastWord}</span>
          </h1>

          <p className="text-body mt-6 text-black/60">{product.description}</p>

          <p className="text-h6 mt-6">{formatPrice(product.price)}</p>

          <div className="mt-8 flex items-center gap-4">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            {/* Renders and is reachable, but the cart does not exist yet. */}
            <Button variant="primary">Add to Cart</Button>
          </div>
        </div>
      </div>

      {/* Side by side only at desktop. The design keeps them stacked on tablet,
          where two columns would leave the in-the-box list very narrow. */}
      <div className="xl:grid-prose-aside mt-22 grid gap-22 md:mt-30 md:gap-30 xl:mt-40 xl:gap-31">
        <section aria-labelledby="features">
          {/* H3 from tablet up, not desktop up — the design steps this heading
              at 768px, and shipping `xl:text-h3` left tablet a size behind. */}
          <h2 id="features" className="text-h3-mobile md:text-h3">
            Features
          </h2>
          {product.features.map((paragraph) => (
            <p key={paragraph} className="text-body mt-6 text-black/60">
              {paragraph}
            </p>
          ))}
        </section>

        <section aria-labelledby="in-the-box">
          <h2 id="in-the-box" className="text-h3-mobile md:text-h3">
            In the Box
          </h2>
          <ul role="list" className="mt-6 flex flex-col gap-2">
            {product.includes.map((entry) => (
              <li key={entry.item} className="flex gap-6">
                {/* Trailing space inside the span, not between the two: as
                    siblings they concatenate to "1xHeadphone unit" in the text
                    content. It collapses visually, so the gap still does the
                    spacing. */}
                <span className="text-body text-orange-text w-6 shrink-0 font-bold">
                  {`${entry.quantity}x `}
                </span>
                <span className="text-body text-black/60">{entry.item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Two stacked shots beside a tall one from tablet up. Tablet and desktop
          use the same column ratio — 277:395 and 445:635 are both 0.701 — so
          one utility covers both and only the gaps change. The tall shot is
          placed explicitly; the other two then auto-place down column one.

          The columns are flush only at exactly 768 and 1440, where the crops'
          own proportions happen to agree with a fixed 20px row gap. In between,
          the widths scale but the gap does not: at 1040 the stacked pair comes
          to 507.6 against the tall shot's 516, and the drift reaches ~15px near
          1280. So the tall shot sizes the rows and the stacked pair fills them,
          which costs under 2% of a crop and keeps both columns flush at every
          width. Cropping the pair rather than the tall shot leaves the largest
          image untouched. */}
      {/* alt="" is a decision, not an inheritance: these are lifestyle shots —
          a person wearing the headphones, the box on a desk — and what the
          product is and includes is already carried by the h1, the description,
          Features and In the Box. Describing the staging would add atmosphere
          no one asked for to every screen reader on the page. */}
      <div className="md:grid-gallery mt-22 grid gap-5 md:mt-30 md:gap-x-4.5 xl:mt-40 xl:gap-x-7.5 xl:gap-y-8">
        <ResponsiveImage
          image={stackedTop}
          alt=""
          loading="lazy"
          className="w-full rounded-lg md:h-full md:object-cover"
        />
        <ResponsiveImage
          image={stackedBottom}
          alt=""
          loading="lazy"
          className="w-full rounded-lg md:h-full md:object-cover"
        />
        <ResponsiveImage
          image={tall}
          alt=""
          loading="lazy"
          className="w-full rounded-lg md:col-start-2 md:row-span-2 md:row-start-1"
        />
      </div>

      <section aria-labelledby="related" className="mt-30 text-center xl:mt-40">
        <h2 id="related" className="text-h3-mobile md:text-h3">
          You may also like
        </h2>

        <ul
          role="list"
          className="mt-10 grid gap-14 md:mt-14 md:grid-cols-3 md:gap-x-2.75 xl:mt-16 xl:gap-x-7.5"
        >
          {product.others.map((other) => (
            <li key={other.slug} className="flex flex-col items-center">
              {/* A different, squarer crop than the product hero — these come
                  from `shared/`, not the product's own folder. */}
              <ResponsiveImage
                image={other.image}
                alt=""
                loading="lazy"
                className="w-full rounded-lg"
              />
              <h3
                id={`related-${other.slug}`}
                className="text-h5 mt-8 md:mt-10"
              >
                {other.name}
              </h3>
              {/* Three links reading "See Product" are indistinguishable in a
                  screen reader's links list. labelledby prepends the visible
                  text verbatim, so the name becomes "See Product XX99 Mark I"
                  and still starts with what is on screen — which is what 2.5.3
                  and speech input need. */}
              <ButtonLink
                to="/product/$slug"
                params={{ slug: other.slug }}
                id={`see-${other.slug}`}
                aria-labelledby={`see-${other.slug} related-${other.slug}`}
                className="mt-8"
              >
                See Product
              </ButtonLink>
            </li>
          ))}
        </ul>
      </section>

      {/* The thumbnails overhang the top of each card by 52px on phone and
          tablet and 80px on desktop, so these margins are the design's 120 and
          160 gaps plus that overhang — the cards' own boxes start lower. */}
      <div className="mt-43 xl:mt-60">
        <CategoryCards />
      </div>

      <div className="mt-30 xl:mt-40">
        <BestGear />
      </div>
    </main>
  )
}
