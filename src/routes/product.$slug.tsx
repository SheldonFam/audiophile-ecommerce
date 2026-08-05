import { createFileRoute, notFound, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/Button'
import { QuantityStepper } from '@/components/QuantityStepper'
import { ResponsiveImage } from '@/components/ResponsiveImage'
import { formatPrice } from '@/utils/pricing'
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
  component: ProductPage,
})

/**
 * The top of the product page: what this is and what it costs.
 *
 * The quantity lives here rather than in the stepper, because the next feature
 * reads it when wiring add-to-cart. Add-to-cart itself renders but does nothing
 * — no cart exists yet.
 *
 * The gallery and related products arrive in ticket 09.
 */
function ProductPage() {
  const product = Route.useLoaderData()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)

  return (
    <main className="max-w-content mx-auto px-6 py-4 md:px-10 md:py-8 xl:px-0 xl:py-20">
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
        <ResponsiveImage
          image={product.image}
          alt=""
          className="w-full rounded-lg"
        />

        <div>
          {product.new && (
            <p className="text-overline text-orange-text">New Product</p>
          )}

          <h1 className="text-h4 xl:text-h2 mt-6">{product.name}</h1>

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
      <div className="xl:grid-prose-aside mt-22 grid gap-22 xl:mt-40 xl:gap-31">
        <section aria-labelledby="features">
          <h2 id="features" className="text-h5 xl:text-h3">
            Features
          </h2>
          {product.features.map((paragraph) => (
            <p key={paragraph} className="text-body mt-6 text-black/60">
              {paragraph}
            </p>
          ))}
        </section>

        <section aria-labelledby="in-the-box">
          <h2 id="in-the-box" className="text-h5 xl:text-h3">
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
    </main>
  )
}
